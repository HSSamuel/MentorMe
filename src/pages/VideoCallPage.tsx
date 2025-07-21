import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Video, { LocalVideoTrack, Room } from "twilio-video";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../api/axios";
import "./VideoCallPage.css";
import SharedNotepad from "../components/SharedNotepad";

// --- Types and Helper Components ---
type CallStatusType = "info" | "success" | "error" | "connecting";
interface CallStatus {
  message: string;
  type: CallStatusType;
}
interface ChatMessage {
  message: string;
  senderName: string;
  isLocal: boolean;
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
    const timer = setInterval(
      () => setTimeElapsed(Date.now() - startTime),
      1000
    );
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

  // --- State Variables ---
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState<CallStatus>({
    message: "Initializing...",
    type: "info",
  });
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const dataSocketRef = useRef<Socket | null>(null);

  // --- Feature States ---
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [notepadContent, setNotepadContent] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptionSocketRef = useRef<WebSocket | null>(null);

  // --- Core Logic ---

  // 1. Get the Twilio Video Token
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
        setStatus({ message: "Ready to join session.", type: "info" });
      })
      .catch((error) =>
        setStatus({
          message: "Error: Could not authenticate for call.",
          type: "error",
        })
      );
  }, [sessionId, authToken]);

  // 2. Connect to Twilio Room AND our Data Socket
  useEffect(() => {
    if (!videoToken) return;

    let videoRoom: Room | null = null;
    let dataSocket: Socket | null = null;

    // --- Connect to Twilio for Video ---
    setStatus({ message: "Joining room...", type: "connecting" });
    Video.connect(videoToken, {
      name: sessionId,
      audio: true,
      video: { width: 1280 },
    })
      .then((room) => {
        videoRoom = room;
        setRoom(room);
        setStatus({
          message: "Joined room. Waiting for other participant...",
          type: "success",
        });

        // Attach local video
        const localParticipant = room.localParticipant;
        localParticipant.tracks.forEach((publication) => {
          if (publication.track) {
            localVideoRef.current?.appendChild(publication.track.attach());
          }
        });

        const handleParticipant = (participant: Video.RemoteParticipant) => {
          setStatus({ message: "Participant connected!", type: "success" });
          if (!sessionStartTime) setSessionStartTime(Date.now());
          participant.tracks.forEach((publication) => {
            if (publication.track)
              remoteVideoRef.current?.appendChild(publication.track.attach());
          });
          participant.on("trackSubscribed", (track) =>
            remoteVideoRef.current?.appendChild(track.attach())
          );
        };
        room.on("participantConnected", handleParticipant);
        room.participants.forEach(handleParticipant);
        room.on("participantDisconnected", () => {
          setStatus({ message: "The other user has left.", type: "info" });
          if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = "";
        });
      })
      .catch((error) =>
        setStatus({
          message: "Error: Failed to connect to video service.",
          type: "error",
        })
      );

    // --- Connect to our Data Socket for Chat/Notepad ---
    dataSocket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token: authToken },
    });
    dataSocketRef.current = dataSocket;
    dataSocket.emit("join-data-room", sessionId);

    dataSocket.on("notepad-update", (content: string) =>
      setNotepadContent(content)
    );
    dataSocket.on(
      "new-chat-message",
      (message: { message: string; senderName: string; socketId: string }) => {
        setChatMessages((prev) => [...prev, { ...message, isLocal: false }]);
      }
    );

    return () => {
      videoRoom?.disconnect();
      dataSocket?.disconnect();
    };
  }, [videoToken, sessionId]);

  // --- Feature Handlers ---
  const handleNotepadChange = useCallback(
    (newContent: string) => {
      setNotepadContent(newContent);
      dataSocketRef.current?.emit("notepad-change", {
        roomId: sessionId,
        content: newContent,
      });
    },
    [sessionId]
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const message = {
      message: chatInput,
      senderName: user?.profile?.name || "User",
      isLocal: true,
    };
    setChatMessages((prev) => [...prev, message]);
    dataSocketRef.current?.emit("send-chat-message", {
      roomId: sessionId,
      ...message,
    });
    setChatInput("");
  };

  const toggleAudio = () => {
    room?.localParticipant.audioTracks.forEach((pub) => {
      if (pub.track.isEnabled) pub.track.disable();
      else pub.track.enable();
      setIsAudioMuted(!pub.track.isEnabled);
    });
  };

  const toggleVideo = () => {
    room?.localParticipant.videoTracks.forEach((pub) => {
      if (pub.track.isEnabled) pub.track.disable();
      else pub.track.enable();
      setIsVideoStopped(!pub.track.isEnabled);
    });
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      const { localParticipant } = room!;
      const screenTrack = Array.from(localParticipant.videoTracks.values())[0]
        .track as LocalVideoTrack;
      localParticipant.unpublishTrack(screenTrack);
      screenTrack.stop();
      const newVideoTrack = await Video.createLocalVideoTrack();
      localParticipant.publishTrack(newVideoTrack);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = new Video.LocalVideoTrack(stream.getTracks()[0]);
        const { localParticipant } = room!;
        localParticipant.unpublishTrack(
          Array.from(localParticipant.videoTracks.values())[0].track
        );
        localParticipant.publishTrack(screenTrack);
        setIsScreenSharing(true);
        screenTrack.mediaStreamTrack.onended = () => {
          handleToggleScreenShare();
        };
      } catch (error) {
        console.error("Screen share failed:", error);
        setIsScreenSharing(false);
      }
    }
  };

  const toggleTranscription = () => {
    if (isTranscribing) {
      mediaRecorderRef.current?.stop();
      transcriptionSocketRef.current?.close();
      setIsTranscribing(false);
    } else {
      if (room?.localParticipant) {
        const localAudioTrack = Array.from(
          room.localParticipant.audioTracks.values()
        )[0]?.track;
        if (localAudioTrack) {
          const stream = new MediaStream([localAudioTrack.mediaStreamTrack]);
          const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
          const socketUrl = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=true`;

          const socket = new WebSocket(socketUrl, ["token", DEEPGRAM_API_KEY]);

          socket.onopen = () => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0 && socket.readyState === 1) {
                socket.send(event.data);
              }
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250);
            setIsTranscribing(true);
          };

          socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            const newTranscript = data.channel.alternatives[0].transcript;
            if (newTranscript && data.is_final) {
              setTranscript((prev) => prev + newTranscript + " ");
            }
          };

          transcriptionSocketRef.current = socket;
        }
      }
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
        <div className="video-content">
          <div ref={remoteVideoRef} className="remote-video-container" />
          <div ref={localVideoRef} className="local-video-container" />
        </div>

        <div className="sidebar-container">
          <SharedNotepad
            isOpen={isNotepadOpen}
            onToggle={() => setIsNotepadOpen((prev) => !prev)}
            content={notepadContent}
            onContentChange={handleNotepadChange}
            theme={theme}
          />
          <div className="chat-container">
            <h3 className="chat-header">In-Call Chat</h3>
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${msg.isLocal ? "local" : "remote"}`}
                >
                  <div className="chat-bubble">{msg.message}</div>
                  <div className="chat-sender">
                    {msg.isLocal ? "You" : msg.senderName}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="chat-input"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="chat-send-button"
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
          {isTranscribing && <LiveTranscript transcript={transcript} />}
        </div>
      </div>

      {room && (
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
            onClick={handleToggleScreenShare}
            className={`control-button ${
              isScreenSharing ? "inactive" : "active"
            }`}
          >
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </button>
          <button
            onClick={toggleTranscription}
            className={`control-button ${
              isTranscribing ? "inactive" : "active"
            }`}
          >
            {isTranscribing ? "Stop Transcript" : "Start Transcript"}
          </button>
          <button
            onClick={() => room.disconnect()}
            className="control-button inactive"
          >
            Leave Session
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;
