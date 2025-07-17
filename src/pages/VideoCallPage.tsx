import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const VideoCallPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // State Management
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to start the camera and join the call
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const socket = io(import.meta.env.VITE_API_BASE_URL, { auth: { token } });
      socketRef.current = socket;
      socket.emit("join-room", sessionId);
      setIsConnecting(true); // Show connecting status

      // --- Setup all socket listeners once ---
      setupSocketListeners(socket, stream);
    } catch (error) {
      console.error("Error starting call.", error);
    }
  };

  // Function to set up all socket event listeners
  const setupSocketListeners = (socket: Socket, stream: MediaStream) => {
    // This is the trigger to start the WebRTC handshake
    socket.on("other-user-ready", (data: { otherUserId: string }) => {
      const pc = createPeerConnection(data.otherUserId, stream);

      // The user with the smaller socket ID makes the offer to avoid conflicts
      if (socket.id < data.otherUserId) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              target: data.otherUserId,
              offer: pc.localDescription,
            });
          });
      }
    });

    socket.on("offer", async (payload: { from: string; offer: any }) => {
      const pc = createPeerConnection(payload.from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", {
        target: payload.from,
        answer: pc.localDescription,
      });
    });

    socket.on("answer", (payload: { from: string; answer: any }) => {
      peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
    });

    socket.on("ice-candidate", (payload: { from: string; candidate: any }) => {
      peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      );
    });

    socket.on("user-left", () => {
      handleEndCall();
    });
  };

  // Helper to create and configure a peer connection
  const createPeerConnection = (
    otherUserSocketId: string,
    stream: MediaStream
  ) => {
    // Close any existing connection before creating a new one
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          target: otherUserSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setIsConnecting(false); // Connection is established, hide "Connecting..."
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    peerConnectionRef.current = pc;
    return pc;
  };

  const handleEndCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    navigate("/my-sessions");
  };

  // Effect to assign the remote stream to the video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // --- RENDER LOGIC ---
  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-4">Video Session</h1>
      <div className="flex-1 relative bg-black rounded-lg flex items-center justify-center">
        {/* Remote Video Display */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${
            remoteStream ? "block" : "hidden"
          }`}
        />

        {/* UI States */}
        {!localStream && (
          <button
            onClick={startCall}
            className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 z-10"
          >
            Start Call
          </button>
        )}

        {isConnecting && !remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-xl mt-4">Connecting...</p>
          </div>
        )}

        {!remoteStream && localStream && !isConnecting && (
          <p className="text-xl">Waiting for other user to join...</p>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 border-2 border-gray-600 rounded-lg overflow-hidden z-10">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      {localStream && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleEndCall}
            className="px-4 py-2 text-white bg-red-700 rounded-lg hover:bg-red-800"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
