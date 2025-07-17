import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const VideoCallPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate(); // Initialize navigate hook
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    menteeSocketId: string;
  } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!token || !localStream) {
      return;
    }

    const createPeerConnection = (socketId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("ice-candidate", {
            target: socketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      peerConnectionRef.current = pc;
      return pc;
    };

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
    });
    const socket = socketRef.current;

    socket.emit("join-room", sessionId);

    if (user?.role === "MENTEE") {
      socket.emit("mentee-ready", { roomId: sessionId });
      setIsCallActive(true);
    }

    socket.on("incoming-call", (data: { menteeSocketId: string }) => {
      if (user?.role === "MENTOR") {
        setIncomingCall(data);
      }
    });

    socket.on("mentor-joined", (data: { mentorSocketId: string }) => {
      if (user?.role === "MENTEE" && localStream) {
        const pc = createPeerConnection(data.mentorSocketId);
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

    socket.on("offer", async (payload: { from: string; offer: any }) => {
      if (user?.role === "MENTOR" && localStream) {
        const pc = createPeerConnection(payload.from, localStream);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { target: payload.from, answer });
        setIsCallActive(true);
      }
    });

    socket.on("answer", (payload: { from: string; answer: any }) => {
      peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
      setIsCallActive(true);
    });

    socket.on("ice-candidate", (payload: { from: string; candidate: any }) => {
      peerConnectionRef.current?.addIceCandidate(
        new RTCIceCandidate(payload.candidate)
      );
    });

    socket.on("user-left", () => {
      handleEndCall();
    });

    return () => {
      socket.disconnect();
      localStream?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
    };
  }, [sessionId, token, user, localStream]);

  const handleCallMentor = async () => {
    await startCamera();
  };

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await startCamera();
      socketRef.current?.emit("mentor-accepted", {
        menteeSocketId: incomingCall.menteeSocketId,
      });
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    navigate("/my-sessions");
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoStopped(!isVideoStopped);
    }
  };

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

      {localStream && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={toggleAudio}
            className={`px-4 py-2 text-white rounded-lg ${
              isAudioMuted ? "bg-red-600" : "bg-gray-600"
            }`}
          >
            {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
          </button>
          <button
            onClick={toggleVideo}
            className={`px-4 py-2 text-white rounded-lg ${
              isVideoStopped ? "bg-red-600" : "bg-gray-600"
            }`}
          >
            {isVideoStopped ? "Start Video" : "Stop Video"}
          </button>
          {/* New End Call Button */}
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
