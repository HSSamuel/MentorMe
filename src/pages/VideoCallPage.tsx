import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

const VideoCallPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to start the camera and initiate the call
  const startCall = async () => {
    console.log("[FRONTEND] Attempting to start call...");
    try {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("[FRONTEND] Media stream acquired successfully.");
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Connect to socket server
      const socket = io(import.meta.env.VITE_API_BASE_URL, { auth: { token } });
      socketRef.current = socket;
      console.log("[FRONTEND] Socket connected.");

      // 3. Set up all socket event listeners
      setupSocketListeners(socket, stream);

      // 4. Join the room
      console.log("[FRONTEND] Emitting 'join-room' to server.");
      socket.emit("join-room", sessionId);
      setIsConnecting(true);
    } catch (error) {
      console.error("[FRONTEND] ERROR: Could not start camera.", error);
      toast.error("Could not start camera. Please check browser permissions.");
    }
  };

  // Function to set up all socket event listeners
  const setupSocketListeners = (socket: Socket, stream: MediaStream) => {
    console.log("[FRONTEND] Socket listeners are being set up.");

    socket.on("other-user-ready", (data: { otherUserId: string }) => {
      console.log(
        `[FRONTEND] Received 'other-user-ready'. Other user: ${data.otherUserId}`
      );
      toast.success("Other user is connecting!");
      const pc = createPeerConnection(data.otherUserId, stream);
      if (socket.id < data.otherUserId) {
        console.log("[FRONTEND] This client is the offerer. Creating offer...");
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            console.log("[FRONTEND] Sending offer to other user.");
            socket.emit("offer", {
              target: data.otherUserId,
              offer: pc.localDescription,
            });
          });
      }
    });

    socket.on("offer", async (payload: { from: string; offer: any }) => {
      console.log(
        `[FRONTEND] Received 'offer' from ${payload.from}. Creating answer...`
      );
      const pc = createPeerConnection(payload.from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("[FRONTEND] Sending answer to other user.");
      socket.emit("answer", {
        target: payload.from,
        answer: pc.localDescription,
      });
    });

    socket.on("answer", (payload: { from: string; answer: any }) => {
      console.log(
        `[FRONTEND] Received 'answer' from ${payload.from}. Connection should be established.`
      );
      peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
    });

    socket.on("ice-candidate", (payload: { from: string; candidate: any }) => {
      console.log(`[FRONTEND] Received 'ice-candidate' from ${payload.from}.`);
      peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      );
    });

    socket.on("user-left", () => {
      toast.error("The other user has left the call.");
      handleEndCall();
    });
  };

  // Helper to create the RTCPeerConnection
  const createPeerConnection = (
    otherUserSocketId: string,
    stream: MediaStream
  ) => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();

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
      console.log("[FRONTEND] Remote track received!");
      setRemoteStream(event.streams[0]);
      setIsConnecting(false);
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    peerConnectionRef.current = pc;
    return pc;
  };

  // Function to end the call and clean up resources
  const handleEndCall = () => {
    console.log("[FRONTEND] Ending call.");
    localStream?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    navigate("/my-sessions");
  };

  // Effect to attach the remote stream to the video element when it's available
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-4">Video Session</h1>
      <div className="flex-1 relative bg-black rounded-lg flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${
            remoteStream ? "block" : "hidden"
          }`}
        />
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
