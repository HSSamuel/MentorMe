import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Video, { LocalVideoTrack, Room, RemoteAudioTrack } from "twilio-video";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../api/axios";
import "./VideoCallPage.css";
import SharedNotepad from "../components/SharedNotepad";
import toast from "react-hot-toast";

// --- Types and Helper Components ---
type CallStatusType = "info" | "success" | "error" | "connecting";
interface CallStatus {
  message: string;
  type: CallStatusType;
}

const LiveTranscript = ({ transcript }: { transcript: string }) => (
  <div className="transcript-container-overlay">
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
  const navigate = useNavigate();

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
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoStopped, setIsVideoStopped] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptionSocketRef = useRef<WebSocket | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [insightsGenerated, setInsightsGenerated] = useState(false);
  const notificationSentRef = useRef(false);

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

    setStatus({ message: "Joining room...", type: "connecting" });
    Video.connect(videoToken, {
      name: sessionId,
      audio: true,
      video: true,
    })
      .then((room) => {
        videoRoom = room;
        setRoom(room);
        setStatus({
          message: "Joined room. Waiting for other participant...",
          type: "success",
        });

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

    dataSocket = io(import.meta.env.VITE_API_BASE_URL!, {
      auth: { token: authToken },
    });
    dataSocketRef.current = dataSocket;
    dataSocket.emit("join-data-room", sessionId);

    dataSocket.on("notepad-update", (content: string) =>
      setNotepadContent(content)
    );

    return () => {
      videoRoom?.disconnect();
      dataSocket?.disconnect();
    };
  }, [videoToken, sessionId, authToken, sessionStartTime]);

  // --- This effect triggers the notification to the mentor ---
  useEffect(() => {
    if (room && user?.role === "MENTEE" && !notificationSentRef.current) {
      notificationSentRef.current = true;

      axios
        .post(`/sessions/${sessionId}/notify-call`)
        .then(() => {
          toast.success(
            "Your mentor has been notified that you've joined the call."
          );
        })
        .catch((error) => {
          console.error("Failed to send call notification:", error);
          toast.error("Could not notify your mentor.");
        });
    }
  }, [room, user, sessionId]);

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
      toast.success("Transcription stopped.");
    } else {
      const promise = new Promise<void>((resolve, reject) => {
        if (!room?.participants.size) {
          return reject(
            "Cannot start transcription without another participant."
          );
        }

        const remoteParticipant = Array.from(room.participants.values())[0];
        const remoteAudioTrack = Array.from(
          remoteParticipant.audioTracks.values()
        )[0]?.track as RemoteAudioTrack;

        if (remoteAudioTrack && remoteAudioTrack.mediaStreamTrack) {
          const stream = new MediaStream([
            remoteAudioTrack.mediaStreamTrack.clone(),
          ]);
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
            resolve();
          };

          socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            const newTranscript = data.channel.alternatives[0].transcript;
            if (newTranscript && data.is_final) {
              setTranscript((prev) => prev + newTranscript + " ");
            }
          };

          socket.onerror = () => {
            reject("Could not connect to transcription service.");
          };

          transcriptionSocketRef.current = socket;
        } else {
          reject("The other participant's audio is not available.");
        }
      });

      toast.promise(promise, {
        loading: "Starting transcription...",
        success: "Transcription started!",
        error: (err) => err.toString(),
      });
    }
  };

  const handleGenerateInsights = () => {
    if (!transcript || !sessionId) {
      toast.error("No transcript available to generate insights.");
      return;
    }
    setIsSummarizing(true);
    const promise = axios.post("/ai/summarize", {
      sessionId,
      transcript,
    });

    toast.promise(promise, {
      loading: "Generating AI insights...",
      success: (response) => {
        setInsightsGenerated(true);
        setIsSummarizing(false);
        return "Insights have been generated and saved!";
      },
      error: (err) => {
        setIsSummarizing(false);
        return err.response?.data?.message || "Failed to generate insights.";
      },
    });
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
        <div className="video-grid-container">
          <div className="video-participant-container">
            <div ref={remoteVideoRef} className="video-feed" />
            <div className="video-label">
              {user?.role === 'MENTEE' ? 'Mentor' : 'Mentee'}
            </div>
          </div>
          <div className="video-participant-container">
            <div ref={localVideoRef} className="video-feed" />
            <div className="video-label">
              {user?.role === 'MENTEE' ? 'You (Mentee)' : 'You (Mentor)'}
            </div>
          </div>
        </div>

        <SharedNotepad
          isOpen={isNotepadOpen}
          onToggle={() => setIsNotepadOpen((prev) => !prev)}
          content={notepadContent}
          onContentChange={handleNotepadChange}
          theme={theme}
        />
        {isTranscribing && <LiveTranscript transcript={transcript} />}
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
            onClick={() => setIsNotepadOpen((prev) => !prev)}
            className={`control-button ${
              isNotepadOpen ? "inactive" : "active"
            }`}
          >
            {isNotepadOpen ? "Close Notepad" : "Open Notepad"}
          </button>
          <button
            onClick={toggleTranscription}
            className={`control-button ${
              isTranscribing ? "inactive" : "active"
            }`}
          >
            {isTranscribing ? "Stop Transcript" : "Start Transcript"}
          </button>

          {!isTranscribing && transcript.length > 0 && !insightsGenerated && (
            <button
              onClick={handleGenerateInsights}
              disabled={isSummarizing}
              className="control-button active"
            >
              {isSummarizing ? "Generating..." : "Generate AI Insights"}
            </button>
          )}
          {insightsGenerated && (
            <Link
              to={`/session/${sessionId}/insights`}
              className="control-button active"
            >
              View Insights
            </Link>
          )}

          <button
            onClick={() => {
              room.disconnect();
              navigate("/my-sessions");
            }}
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