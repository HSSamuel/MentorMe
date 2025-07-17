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

  // Effect for getting user media
  useEffect(() => {
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
  }, []);

  // Effect for WebSocket and WebRTC logic
  useEffect(() => {
    // Only run if we have a token and the local stream is ready
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
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      return pc;
    };

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
    });

    socketRef.current.emit("join-room", sessionId);

    socketRef.current.on("user-joined", (socketId: string) => {
      const pc = createPeerConnection(socketId);
      peerConnections.current[socketId] = pc;
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit("offer", {
            target: socketId,
            offer: pc.localDescription,
          });
        });
    });

    socketRef.current.on(
      "offer",
      async (payload: { from: string; offer: any }) => {
        const pc = createPeerConnection(payload.from);
        peerConnections.current[payload.from] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit("answer", {
          target: payload.from,
          answer,
        });
      }
    );

    socketRef.current.on("answer", (payload: { from: string; answer: any }) => {
      const pc = peerConnections.current[payload.from];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });

    socketRef.current.on(
      "ice-candidate",
      (payload: { from: string; candidate: any }) => {
        const pc = peerConnections.current[payload.from];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      }
    );

    socketRef.current.on("user-left", (socketId: string) => {
      if (peerConnections.current[socketId]) {
        peerConnections.current[socketId].close();
        delete peerConnections.current[socketId];
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Cleanup logic
    return () => {
      socketRef.current?.disconnect();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      localStream.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, token, localStream]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Video Session</h1>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Your Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto bg-gray-200 rounded-md"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Mentor's Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-auto bg-gray-200 rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
