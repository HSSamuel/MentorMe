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

  useEffect(() => {
    if (token) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          socketRef.current?.emit("join-room", sessionId);

          socketRef.current?.on(
            "offer",
            async (payload: { from: string; offer: any }) => {
              // Changed from socketId
              const pc = createPeerConnection(payload.from, stream); // Changed from socketId
              peerConnections.current[payload.from] = pc; // Changed from socketId
              await pc.setRemoteDescription(
                new RTCSessionDescription(payload.offer)
              );
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socketRef.current?.emit("answer", {
                target: payload.from, // Changed from socketId
                answer,
              });
            }
          );

          socketRef.current?.on(
            "answer",
            (payload: { from: string; answer: any }) => {
              // Changed from socketId
              peerConnections.current[payload.from]?.setRemoteDescription(
                // Changed from socketId
                new RTCSessionDescription(payload.answer)
              );
            }
          );

          socketRef.current?.on(
            "ice-candidate",
            (payload: { from: string; candidate: any }) => {
              // Changed from socketId
              peerConnections.current[payload.from]?.addIceCandidate(
                // Changed from socketId
                new RTCIceCandidate(payload.candidate)
              );
            }
          );

          // NEW: Handle user disconnection
          socketRef.current?.on("user-left", (socketId: string) => {
            if (peerConnections.current[socketId]) {
              peerConnections.current[socketId].close();
              delete peerConnections.current[socketId];
            }
            // Clear the remote video stream
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          });
        })
        .catch((error) => {
          console.error("Error accessing media devices.", error);
        });
    }

    return () => {
      socketRef.current?.disconnect();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [sessionId, token]);

  const createPeerConnection = (socketId: string, stream: MediaStream) => {
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

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    return pc;
  };

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
