import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const VideoCallPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // State Management
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    menteeSocketId: string;
  } | null>(null);
  const [receivedOffer, setReceivedOffer] = useState<{
    from: string;
    offer: any;
  } | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Helper to create and configure a peer connection
  const createPeerConnection = (
    otherUserSocketId: string,
    stream: MediaStream
  ) => {
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

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    peerConnectionRef.current = pc;
    return pc;
  };

  // Effect to set up socket listeners
  useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.emit("join-room", sessionId);

    // MENTOR listens for a call
    socket.on(
      "incoming-call",
      (data) => user?.role === "MENTOR" && setIncomingCall(data)
    );

    // MENTEE listens for call acceptance
    socket.on("mentor-joined", (data) => {
      if (user?.role === "MENTEE" && localStream) {
        const pc = createPeerConnection(data.mentorSocketId, localStream);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              target: data.mentorSocketId,
              offer: pc.localDescription,
            });
          });
      }
    });

    // MENTOR stores the offer until they are ready
    socket.on(
      "offer",
      (payload) => user?.role === "MENTOR" && setReceivedOffer(payload)
    );

    // MENTEE handles the answer
    socket.on("answer", (payload) =>
      peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      )
    );

    socket.on("ice-candidate", (payload) =>
      peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      )
    );

    socket.on("user-left", () => handleEndCall());

    return () => {
      socket.disconnect();
      peerConnectionRef.current?.close();
    };
  }, [token, sessionId, user?.role, localStream]);

  // Effect for MENTOR to act on the offer AFTER starting their camera
  useEffect(() => {
    if (user?.role === "MENTOR" && receivedOffer && localStream) {
      const pc = createPeerConnection(receivedOffer.from, localStream);
      pc.setRemoteDescription(new RTCSessionDescription(receivedOffer.offer))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          socketRef.current?.emit("answer", {
            target: receivedOffer.from,
            answer: pc.localDescription,
          });
        });
      setIsCallActive(true);
      setIncomingCall(null);
    }
  }, [receivedOffer, localStream, user?.role]);

  // Assign streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  // User Actions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  const handleCallMentor = () => {
    startCamera().then(() => {
      socketRef.current?.emit("mentee-ready", { roomId: sessionId });
      setIsCallActive(true);
    });
  };

  const handleAcceptCall = () => startCamera(); // This triggers the useEffect above

  const handleEndCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    socketRef.current?.disconnect();
    navigate("/my-sessions");
  };

  // --- RENDER LOGIC ---
  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-center mb-4">Video Session</h1>
      <div className="flex-1 relative bg-black rounded-lg flex items-center justify-center">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${
            remoteStream ? "block" : "hidden"
          }`}
        />

        {/* --- UI States --- */}
        {user?.role === "MENTOR" && incomingCall && !isCallActive && (
          <div className="text-center">
            <p className="text-xl mb-4">Incoming call from Mentee...</p>
            <button
              onClick={handleAcceptCall}
              className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Accept
            </button>
          </div>
        )}
        {user?.role === "MENTEE" && !localStream && (
          <button
            onClick={handleCallMentor}
            className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Call Mentor
          </button>
        )}
        {!remoteStream && isCallActive && (
          <p className="text-xl">Connecting...</p>
        )}
        {user?.role === "MENTOR" && !remoteStream && !incomingCall && (
          <p className="text-xl">Waiting for mentee to call...</p>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 border-2 border-gray-600 rounded-lg overflow-hidden">
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
      {isCallActive && (
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
