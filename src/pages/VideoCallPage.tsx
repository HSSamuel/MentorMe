import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../api/axios";
import "./VideoCallPage.css";
import SharedNotepad from "../components/SharedNotepad";

type CallStatusType = "info" | "success" | "error" | "connecting";
interface CallStatus {
  message: string;
  type: CallStatusType;
}

const LiveTranscript = ({ transcript }: { transcript: string }) => (
  <div className="transcript-container">
    <h3 className="transcript-header">Live Transcript</h3>
    <div className="transcript-content">
      <p>{transcript}</p>
    </div>
  </div>
);

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
  const [status, setStatus] = useState<CallStatus>({
    message: "Initializing...",
    type: "info",
  });
  const isMentor = user?.role === "MENTOR";

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptionSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId || !authToken) return;
    setStatus({ message: "Authenticating...", type: "connecting" });
    axios
      .post(
        `/sessions/${sessionId}/call-token`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then((response) => {
        setVideoToken(response.data.videoToken);
        setStatus({ message: "Ready to start camera.", type: "info" });
      })
      .catch((error) => {
        console.error("ERROR: Failed to get video token.", error);
        setStatus({ message: "Error: Authentication failed.", type: "error" });
      });
  }, [sessionId, authToken]);

  const startCamera = () => {
    setStatus({ message: "Accessing camera...", type: "connecting" });
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus({
          message: "Camera is on. Waiting for other user...",
          type: "connecting",
        });
        if (!isMentor) {
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
        setStatus({
          message: "Error: Camera not found or permission denied.",
          type: "error",
        });
      });
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
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
    if (!isTranscribing || !localStream) return;

    const DEEPGRAM_API_KEY =
      import.meta.env.VITE_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY";
    const socketUrl = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&puncutate=true&interim_results=true`;

    const transcriptionSocket = new WebSocket(socketUrl, [
      "token",
      DEEPGRAM_API_KEY,
    ]);

    transcriptionSocket.onopen = () => {
      console.log("Transcription socket connected.");
      const mediaRecorder = new MediaRecorder(localStream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && transcriptionSocket.readyState === 1) {
          transcriptionSocket.send(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
    };

    transcriptionSocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const newTranscript = data.channel.alternatives[0].transcript;
      if (newTranscript && data.is_final) {
        setTranscript((prev) => prev + newTranscript + " ");
      }
    };

    transcriptionSocket.onclose = () => {
      console.log("Transcription socket closed.");
    };

    transcriptionSocketRef.current = transcriptionSocket;

    return () => {
      mediaRecorderRef.current?.stop();
      transcriptionSocketRef.current?.close();
    };
  }, [isTranscribing, localStream]);

  useEffect(() => {
    if (!videoToken || !localStream) return;

    const socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: videoToken },
    });
    socketRef.current = socket;

    socket.emit("get-notepad-content", sessionId);
    socket.on("notepad-content", (content: string) => {
      setNotepadContent(content);
    });

    const createPeerConnection = (targetSocketId: string) => {
      const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ];

      const pc = new RTCPeerConnection({ iceServers });

      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        setStatus({ message: "Connected!", type: "success" });
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            target: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] State: ${pc.connectionState}`);
        if (pc.connectionState === "failed") {
          setStatus({ message: "Connection failed.", type: "error" });
        }
      };

      peerConnections.current[targetSocketId] = pc;
      return pc;
    };

    socket.on("connect", () => {
      socket.emit("join-room", sessionId);
    });

    socket.on("other-user", (otherUserId: string) => {
      const pc = createPeerConnection(otherUserId);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("offer", {
            target: otherUserId,
            offer: pc.localDescription,
          });
        });
    });

    socket.on("offer", async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { target: from, answer });
    });

    socket.on("answer", ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("user-left", (id: string) => {
      peerConnections.current[id]?.close();
      delete peerConnections.current[id];
      setRemoteStream(null);
      setStatus({ message: "The other user has left the call.", type: "info" });
    });

    return () => {
      socket.disconnect();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      localStream.getTracks().forEach((track) => track.stop());
    };
  }, [localStream, videoToken, sessionId]);

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

  const saveTranscriptAndGetInsights = async () => {
    if (!transcript.trim() || !sessionId) return;
    try {
      await axios.post(
        `/sessions/${sessionId}/insights`,
        { transcript },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      alert("Session insights have been saved!");
    } catch (error) {
      console.error("Failed to save transcript and get insights:", error);
      alert("Could not save session insights. Please try again.");
    }
  };

  const getStatusClasses = (statusType: CallStatusType) => {
    switch (statusType) {
      case "success":
        return "status-success";
      case "error":
        return "status-error";
      case "connecting":
        return "status-connecting";
      default:
        return "status-info";
    }
  };

  return (
    <div className={`video-call-container ${theme}`}>
      <div className="flex justify-between items-center">
        <h1 className="video-call-header">Video Session</h1>
        {sessionStartTime && <SessionTimer startTime={sessionStartTime} />}
      </div>
      <p className={`video-call-status ${getStatusClasses(status.type)}`}>
        {status.message}
      </p>

      <div className={`video-main-area ${getStatusClasses(status.type)}`}>
        {!remoteStream ? (
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
        ) : (
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

        <div className="sidebar-features">
          <SharedNotepad
            isOpen={isNotepadOpen}
            content={notepadContent}
            onContentChange={handleNotepadChange}
            theme={theme}
          />
          {isTranscribing && <LiveTranscript transcript={transcript} />}
        </div>
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
          <button
            onClick={() => setIsTranscribing((prev) => !prev)}
            className={`control-button ${
              isTranscribing ? "inactive" : "active"
            }`}
          >
            {isTranscribing ? "Stop Transcript" : "Start Transcript"}
          </button>
          {transcript && (
            <button
              onClick={saveTranscriptAndGetInsights}
              className="control-button save-insights-button"
            >
              Save Insights
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
