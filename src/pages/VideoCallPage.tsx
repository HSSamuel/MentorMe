// Mentor/Frontend/src/pages/VideoCallPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const VideoCallPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });
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

      return pc;
    };

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
    });

    const socket = socketRef.current;

    socket.emit("join-room", sessionId);

    socket.on("other-user", (otherUserId: string) => {
      const pc = createPeerConnection(otherUserId);
      peerConnections.current[otherUserId] = pc;

      // Make the user with the lexicographically smaller ID the offerer
      if (socket.id < otherUserId) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              target: otherUserId,
              offer: pc.localDescription,
            });
          });
      }
    });

    socket.on("offer", async (payload: { from: string; offer: any }) => {
      const pc = createPeerConnection(payload.from);
      peerConnections.current[payload.from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { target: payload.from, answer });
    });

    socket.on("answer", (payload: { from: string; answer: any }) => {
      const pc = peerConnections.current[payload.from];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });

    socket.on("ice-candidate", (payload: { from: string; candidate: any }) => {
      const pc = peerConnections.current[payload.from];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    socket.on("user-left", (socketId: string) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      setRemoteStream(null);
    });

    return () => {
      socket.disconnect();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      localStream.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, token, localStream]);

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
    <div className="p-4">
      <h1 className="text-2xl font-bold">Video Session</h1>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1 relative">
          <h2 className="text-lg font-semibold">Your Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto bg-gray-200 rounded-md"
          />
          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <button
                onClick={startCamera}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Start Camera
              </button>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            {remoteStream
              ? "Participant's Video"
              : "Waiting for participant..."}
          </h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-auto bg-gray-200 rounded-md"
          />
        </div>
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
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
