import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import io, { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import moment from "moment";

// --- Reusable SVG Icons for UI ---
const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const SendIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg
    className="w-4 h-4 text-white ml-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    ></path>
  </svg>
);

const ChatBubbleIcon = () => (
  <svg
    className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const BackIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// --- [NEW] Skeleton Loader for a better loading experience ---
const ConversationSkeletonLoader = () => (
  <div className="p-4 space-y-3 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Define a type for messages for better type safety
interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    profile: {
      name?: string;
      avatarUrl?: string;
    };
  };
  isOptimistic?: boolean;
  conversationId: string;
  // --- [NEW] Add a temporary ID for robust optimistic updates ---
  tempId?: string;
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
}

// --- Main Messages Page Component ---
const MessagesPage = () => {
  const { user, token } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatuses, setUserStatuses] = useState<Map<string, boolean>>(
    new Map()
  );
  const [lastSeenTimes, setLastSeenTimes] = useState<
    Map<string, string | null>
  >(new Map());
  const [isSending, setIsSending] = useState(false);
  // --- [NEW] State to track if the other user is typing ---
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // --- [NEW] Ref for the audio context to play sounds ---
  const audioContextRef = useRef<AudioContext | null>(null);

  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants || !user) return null;
    return conversation.participants.find((p: any) => p.id !== user.id);
  };

  const getAvatarUrl = (profile: any) => {
    if (profile?.avatarUrl) {
      return profile.avatarUrl.startsWith("http")
        ? profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || "User"
    )}&background=random&color=fff`;
  };

  const formatLastSeen = useCallback((timestamp: string | null): string => {
    if (!timestamp) return "Offline";
    const now = moment();
    const lastSeenMoment = moment(timestamp);
    if (now.diff(lastSeenMoment, "minutes") < 1) {
      return "just now";
    } else if (now.diff(lastSeenMoment, "hours") < 1) {
      return `${now.diff(lastSeenMoment, "minutes")} min ago`;
    } else if (now.diff(lastSeenMoment, "days") < 1) {
      return lastSeenMoment.format("h:mm A");
    } else if (now.diff(lastSeenMoment, "years") < 1) {
      return lastSeenMoment.format("MMM D");
    } else {
      return lastSeenMoment.format("MMM D, YYYY");
    }
  }, []);

  // --- [NEW] Function to play a notification sound ---
  const playNotificationSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      600,
      audioContextRef.current.currentTime
    );
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.00001,
      audioContextRef.current.currentTime + 0.5
    );
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const handleSelectConversation = useCallback(
    async (conversation: any) => {
      if (selectedConversation?.id === conversation.id) return;

      setSelectedConversation(conversation);
      setMessages([]);

      try {
        const res = await apiClient.get(`/messages/${conversation.id}`);
        setMessages(res.data);

        socketRef.current?.emit("joinConversation", conversation.id);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Could not load messages for this conversation.");
        setMessages([]);
      }
    },
    [selectedConversation]
  );

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/messages");
        const sortedConversations = res.data.sort((a: any, b: any) => {
          const lastActivityA = new Date(a.updatedAt || 0).getTime();
          const lastActivityB = new Date(b.updatedAt || 0).getTime();
          return lastActivityB - lastActivityA;
        });
        setConversations(sortedConversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        toast.error("Failed to load your conversations.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user?.id]);

  useEffect(() => {
    if (conversationId && conversations.length > 0 && !selectedConversation) {
      const convoToSelect = conversations.find((c) => c.id === conversationId);
      if (convoToSelect) {
        handleSelectConversation(convoToSelect);
      }
    }
  }, [
    conversationId,
    conversations,
    selectedConversation,
    handleSelectConversation,
  ]);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
    });

    socketRef.current.on("receiveMessage", (message: Message) => {
      // --- [UPDATED] More robust message receiving logic ---
      setMessages((prevMessages) => {
        // Replace optimistic message with the real one from the server
        const existingIndex = message.tempId
          ? prevMessages.findIndex((m) => m.id === message.tempId)
          : -1;
        if (existingIndex !== -1) {
          const newMessages = [...prevMessages];
          newMessages[existingIndex] = message;
          return newMessages;
        }
        // Add new message if it's not a replacement
        if (message.conversationId === selectedConversation?.id) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });

      if (message.senderId !== user?.id) {
        playNotificationSound();
        if (message.conversationId !== selectedConversation?.id) {
          toast.success(`New message from ${message.sender.profile?.name}`, {
            icon: "💬",
          });
        }
      }

      setConversations((prevConvos) => {
        const newConvos = [...prevConvos];
        const convoIndex = newConvos.findIndex(
          (c) => c.id === message.conversationId
        );

        if (convoIndex > -1) {
          const updatedConvo = {
            ...newConvos[convoIndex],
            messages: [message],
            updatedAt: message.createdAt,
          };
          newConvos.splice(convoIndex, 1);
          newConvos.unshift(updatedConvo);
        }
        return newConvos;
      });
    });

    // --- [NEW] Listen for typing events ---
    socketRef.current.on("userTyping", ({ conversationId, isTyping }) => {
      if (conversationId === selectedConversation?.id) {
        setIsOtherUserTyping(isTyping);
      }
    });

    socketRef.current.on("userStatusChange", (statusChange: UserStatus) => {
      setUserStatuses((prev) =>
        new Map(prev).set(statusChange.userId, statusChange.isOnline)
      );
      setLastSeenTimes((prev) =>
        new Map(prev).set(statusChange.userId, statusChange.lastSeen)
      );
    });

    socketRef.current.on("messageError", (error: any) => {
      console.error("Message send error from server:", error);
      toast.error(error.message || "Failed to send message.");
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isOptimistic)
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, selectedConversation?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !selectedConversation ||
      !socketRef.current ||
      !user ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("stopTyping", {
      conversationId: selectedConversation.id,
    });

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      tempId: tempId,
      content: newMessage,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, profile: user.profile },
      isOptimistic: true,
      conversationId: selectedConversation.id,
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    socketRef.current.emit(
      "sendMessage",
      {
        conversationId: selectedConversation.id,
        content: newMessage,
        tempId: tempId, // Send tempId to be echoed back
      },
      (ack: { success: boolean; error?: string }) => {
        if (!ack.success) {
          toast.error(ack.error || "Message could not be sent.");
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id)
          );
        }
        setIsSending(false);
      }
    );

    setNewMessage("");
  };

  // --- [NEW] Handle typing event emission ---
  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!socketRef.current || !selectedConversation) return;

    if (!isSending) {
      socketRef.current.emit("startTyping", {
        conversationId: selectedConversation.id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", {
        conversationId: selectedConversation.id,
      });
    }, 2000); // Consider typing stopped after 2 seconds of inactivity
  };

  const filteredConversations = conversations.filter((convo) => {
    const otherParticipant = getOtherParticipant(convo);
    return otherParticipant?.profile?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const getParticipantStatus = useCallback(
    (participantId: string) => {
      const isOnline = userStatuses.get(participantId);
      const lastSeen = lastSeenTimes.get(participantId);

      if (isOnline) {
        return <span className="text-green-500 font-semibold">Online</span>;
      } else if (lastSeen) {
        return (
          <span className="text-gray-500 text-sm">
            Last seen {formatLastSeen(lastSeen)}
          </span>
        );
      }
      return <span className="text-gray-500 text-sm">Offline</span>;
    },
    [userStatuses, lastSeenTimes, formatLastSeen]
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex overflow-hidden relative">
        <div
          className={`w-full md:w-1/3 md:flex flex-col transition-transform duration-300 ease-in-out absolute md:static inset-0 bg-white dark:bg-gray-800 z-20 ${
            selectedConversation
              ? "-translate-x-full md:translate-x-0"
              : "translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Messages
            </h2>
            <div className="relative mt-4">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {isLoading ? (
              <ConversationSkeletonLoader />
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => {
                const otherParticipant = getOtherParticipant(convo);
                if (!otherParticipant || !otherParticipant.profile) return null;
                const lastMessage = convo.messages && convo.messages[0];
                return (
                  <div
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo)}
                    className={`flex items-center p-3 cursor-pointer transition-colors border-l-4 ${
                      selectedConversation?.id === convo.id
                        ? "bg-blue-50 dark:bg-blue-900/50 border-blue-500"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={getAvatarUrl(otherParticipant.profile)}
                      alt={`Avatar of ${
                        otherParticipant.profile?.name || "User"
                      }`}
                    />
                    <div className="flex-grow ml-4 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {otherParticipant.profile?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {lastMessage?.content || "No messages yet"}
                      </p>
                      <div className="text-xs">
                        {otherParticipant?.id &&
                          getParticipantStatus(otherParticipant.id)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 dark:text-gray-400">
                <ChatBubbleIcon />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  No conversations yet.
                </h3>
                <p className="text-sm mt-1 max-w-xs">
                  Your chats will appear here once a mentorship request is
                  accepted.
                </p>
                {user?.role === "MENTEE" && (
                  <Link
                    to="/mentors"
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Find a Mentor
                  </Link>
                )}
                {user?.role === "MENTOR" && (
                  <p className="text-sm mt-2">
                    Check your requests to get started!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`w-full md:w-2/3 flex flex-col absolute md:static top-0 right-0 h-full bg-gray-50 dark:bg-gray-900 transition-transform duration-300 ease-in-out z-10 ${
            selectedConversation
              ? "translate-x-0"
              : "translate-x-full md:translate-x-0"
          }`}
        >
          {selectedConversation ? (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center flex-shrink-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden mr-2"
                  aria-label="Back to conversations"
                >
                  <BackIcon />
                </button>
                {getOtherParticipant(selectedConversation)?.id && (
                  <Link
                    to={`/users/${
                      getOtherParticipant(selectedConversation)?.id
                    }`}
                    className="flex items-center group"
                  >
                    <img
                      className="h-10 w-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                      src={getAvatarUrl(
                        getOtherParticipant(selectedConversation)?.profile
                      )}
                      alt={`Avatar of ${
                        getOtherParticipant(selectedConversation)?.profile
                          ?.name || "User"
                      }`}
                    />
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {
                          getOtherParticipant(selectedConversation)?.profile
                            ?.name
                        }
                      </h3>
                      <div className="text-sm h-4">
                        {/* --- [NEW] Display typing indicator or online status --- */}
                        {isOtherUserTyping ? (
                          <span className="text-blue-500 italic">
                            typing...
                          </span>
                        ) : (
                          getOtherParticipant(selectedConversation)?.id &&
                          getParticipantStatus(
                            getOtherParticipant(selectedConversation).id
                          )
                        )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-2">
                  {messages.length === 0 && !isLoading ? (
                    <div className="text-center text-gray-500 py-10">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id || index}
                        className={`flex items-end gap-3 animate-fade-in-up ${
                          // --- [NEW] Animation class ---
                          msg.senderId === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {msg.senderId !== user?.id && (
                          <img
                            src={getAvatarUrl(
                              getOtherParticipant(selectedConversation)?.profile
                            )}
                            alt="Sender"
                            className="h-8 w-8 rounded-full object-cover self-start"
                          />
                        )}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 max-w-lg inline-block ${
                              msg.senderId === user?.id
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none"
                            }`}
                          >
                            <p className="flex items-center">
                              {msg.content}
                              {msg.senderId === user?.id &&
                                !msg.isOptimistic && <CheckmarkIcon />}
                            </p>
                          </div>
                          <p
                            className={`text-xs text-gray-400 mt-1 ${
                              msg.senderId === user?.id
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {moment(msg.createdAt).format("h:mm A")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    aria-label="Send message"
                    disabled={isSending}
                  >
                    <SendIcon />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-8">
              <ChatBubbleIcon />
              <h3 className="text-xl font-semibold mt-4 text-gray-700 dark:text-gray-300">
                Select a conversation
              </h3>
              <p className="max-w-xs">
                Your chats will appear here once a mentorship request is
                accepted.
              </p>
              {user?.role === "MENTEE" && (
                <Link
                  to="/mentors"
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Find a Mentor
                </Link>
              )}
              {user?.role === "MENTOR" && (
                <p className="text-sm mt-2">
                  Check your requests to get started!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
