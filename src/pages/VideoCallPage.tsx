import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../api/axios";
import "./VideoCallPage.css"; // Ensure this CSS file is updated
import SharedNotepad from "../components/SharedNotepad";

// Helper component for the session timer
const SessionTimer = ({ startTime }: { startTime: number }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const totalSeconds = Math.floor(timeElapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let timerColor = "text-green-500";
  if (minutes >= 45) timerColor = "text-yellow-500";
  if (minutes >= 55) timerColor = "text-red-500";

  return (
    <div className={`font-mono text-lg font-bold ${timerColor}`}>
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

const VideoCallPage = () => {
  const { theme } = useTheme();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token: authToken, user } = useAuth();
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const isMentor = user?.role === "MENTOR";

  useEffect(() => {
    if (!sessionId || !authToken) return;
    setStatus("Authenticating...");
    axios
      .post(
        `/sessions/${sessionId}/call-token`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then((response) => {
        console.log("LOG 1: Successfully received unique video token.");
        setVideoToken(response.data.videoToken);
        setStatus("Ready to start camera.");
      })
      .catch((error) => {
        console.error("ERROR: Failed to get video token.", error);
        setStatus("Error: Authentication failed.");
      });
  }, [sessionId, authToken]);

  const startCamera = () => {
    setStatus("Accessing camera...");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("LOG 2: Camera access granted.");
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus("Camera is on. Connecting...");
        if (!isMentor) {
          console.log("User is mentee. Notifying mentor of the call...");
          axios
            .post(
              `/sessions/${sessionId}/notify-call`,
              {},
              {
                headers: { Authorization: `Bearer ${authToken}` },
              }
            )
            .catch((err) => {
              console.error("Could not send notification to mentor:", err);
            });
        }
      })
      .catch((error) => {
        console.error("ERROR: Could not access media devices.", error);
        setStatus("Error: Camera not found or permission denied.");
      });
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("LOG 11: Attaching remote stream to video element.");
      remoteVideoRef.current.srcObject = remoteStream;
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }
    }
  }, [remoteStream, sessionStartTime]);

  const handleNotepadChange = useCallback(
    (newContent: string) => {
      setNotepadContent(newContent);
      if (socketRef.current) {
        socketRef.current.emit("notepad-change", {
          roomId: sessionId,
          content: newContent,
        });
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!videoToken || !localStream) return;
    console.log("LOG 3: All conditions met. Initializing socket connection.");
    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: videoToken },
    });
    socketRef.current = socket;
    socket.emit("get-notepad-content", sessionId);
    socket.on("notepad-content", (content: string) => {
      setNotepadContent(content);
    });
    const createPeerConnection = (targetSocketId: string) => {
      console.log(
        `LOG 4: Creating peer connection for target ${targetSocketId}`
      );
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`LOG --: Sending ICE candidate to ${targetSocketId}`);
          socket.emit("ice-candidate", {
            target: targetSocketId,
            candidate: event.candidate,
          });
        }
      };
      pc.ontrack = (event) => {
        console.log(
          `LOG 10: ✅✅✅ Remote track received from ${targetSocketId}!`
        );
        setStatus("Connected!");
        setRemoteStream(event.streams[0]);
      };
      pc.onconnectionstatechange = () => {
        console.log(
          `EVENT: Connection state with ${targetSocketId} is now ${pc.connectionState}`
        );
        if (pc.connectionState === "connected") {
          setStatus("Connected!");
        }
        if (pc.connectionState === "failed") {
          setStatus(
            "Connection failed. Please check your network and refresh."
          );
        }
      };
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
      return pc;
    };
    socket.on("connect", () => {
      console.log(
        `LOG 5: Socket connected with ID ${socket.id}. Joining room ${sessionId}.`
      );
      socket.emit("join-room", sessionId);
    });
    socket.on("other-user", (otherUserId: string) => {
      console.log(
        `LOG 6: 'other-user' event received. Peer ID: ${otherUserId}. Creating offer...`
      );
      const pc = createPeerConnection(otherUserId);
      peerConnections.current[otherUserId] = pc;
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          console.log("LOG 7: Offer created and set. Sending to peer.");
          socket.emit("offer", {
            target: otherUserId,
            offer: pc.localDescription,
          });
        });
    });
    socket.on("offer", async ({ from, offer }) => {
      console.log(`LOG 6: Offer received from ${from}. Creating answer...`);
      const pc = createPeerConnection(from);
      peerConnections.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("LOG 7: Answer created and set. Sending back to peer.");
      socket.emit("answer", { target: from, answer });
    });
    socket.on("answer", ({ from, answer }) => {
      console.log(
        `LOG 8: Answer received from ${from}. Setting remote description.`
      );
      peerConnections.current[from]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });
    socket.on("ice-candidate", ({ from, candidate }) => {
      console.log(
        `LOG --: Received ICE candidate from ${from}. Adding to peer connection.`
      );
      peerConnections.current[from]?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });
    socket.on("user-left", (id) => {
      peerConnections.current[id]?.close();
      delete peerConnections.current[id];
      setRemoteStream(null);
      setStatus("The other user has left the call.");
    });
    return () => {
      socket.disconnect();
      socket.off("notepad-content");
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      localStream.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, videoToken, localStream]);

  const toggleAudio = () => {
    localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setIsAudioMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    localStream
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setIsVideoStopped((prev) => !prev);
  };

  return (
    <div className={`video-call-container ${theme}`}>
      <div className="flex justify-between items-center">
        <h1 className="video-call-header">Video Session</h1>
        {sessionStartTime && <SessionTimer startTime={sessionStartTime} />}
      </div>
      <p className="video-call-status">{status}</p>

      <div className="video-main-area">
        {!remoteStream && (
          <div className="single-camera-view">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
            />
            {!localStream && videoToken && (
              <div className="start-camera-overlay">
                <button onClick={startCamera} className="start-camera-button">
                  Start Camera
                </button>
              </div>
            )}
          </div>
        )}

        {remoteStream && (
          <div className="split-screen-view">
            <div className="remote-video-container">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="video-element"
              />
            </div>
            <div className="local-video-container">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
            </div>
          </div>
        )}

        <SharedNotepad
          isOpen={isNotepadOpen}
          content={notepadContent}
          onContentChange={handleNotepadChange}
          theme={theme}
        />
      </div>

      {localStream && (
        <div className="control-bar">
          <button
            onClick={toggleAudio}
            className={`control-button ${isAudioMuted ? "inactive" : "active"}`}
          >
            {isAudioMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={toggleVideo}
            className={`control-button ${
              isVideoStopped ? "inactive" : "active"
            }`}
          >
            {isVideoStopped ? "Start Video" : "Stop Video"}
          </button>
          <button
            onClick={() => setIsNotepadOpen((prev) => !prev)}
            className="control-button active"
          >
            {isNotepadOpen ? "Hide Notes" : "Show Notes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
