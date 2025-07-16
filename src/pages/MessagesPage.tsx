import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import io, { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import moment from "moment";
import { formatLastSeen } from "../utils/timeFormat";

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
    className="w-24 h-24 text-gray-300 dark:text-gray-600"
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

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

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
    if (!timestamp) return "";
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user?.id]);

  // FIX: This useEffect handles selecting a conversation from the URL on page load/refresh.
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
      if (message.conversationId === selectedConversation?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }

      // FIX: This logic correctly updates the conversation list with the new last message.
      setConversations((prevConvos) => {
        const newConvos = [...prevConvos];
        const convoIndex = newConvos.findIndex(
          (c) => c.id === message.conversationId
        );

        if (convoIndex > -1) {
          const updatedConvo = {
            ...newConvos[convoIndex],
            messages: [message], // This ensures the 'messages' array has the latest message for the preview.
            updatedAt: message.createdAt,
          };
          newConvos.splice(convoIndex, 1);
          newConvos.unshift(updatedConvo);
        }
        return newConvos;
      });
    });

    socketRef.current.on("userStatusChange", (statusChange: UserStatus) => {
      setUserStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(statusChange.userId, statusChange.isOnline);
        return newMap;
      });
      setLastSeenTimes((prev) => {
        const newMap = new Map(prev);
        newMap.set(statusChange.userId, statusChange.lastSeen);
        return newMap;
      });
    });

    socketRef.current.on("messageError", (error: any) => {
      console.error("Message send error from server:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isOptimistic)
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !selectedConversation ||
      !socketRef.current ||
      !user
    ) {
      return;
    }

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: newMessage,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        profile: user.profile,
      },
      isOptimistic: true,
      conversationId: selectedConversation.id,
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    socketRef.current.emit("sendMessage", {
      conversationId: selectedConversation.id,
      content: newMessage,
    });

    setNewMessage("");
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
              <p className="text-center p-4 text-gray-500">Loading...</p>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => {
                const otherParticipant = getOtherParticipant(convo);
                if (!otherParticipant || !otherParticipant.profile) return null;
                // FIX: This now correctly reads the last message from the 'messages' array in the conversation object.
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
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">
                  You'll see your chats appear here once your mentorship request
                  is accepted.
                </p>
                {user?.role === "MENTEE" && (
                  <p className="text-sm mt-2">
                    <Link
                      to="/mentors"
                      className="text-blue-500 hover:underline"
                    >
                      Find a mentor
                    </Link>{" "}
                    to get started!
                  </p>
                )}
                {user?.role === "MENTOR" && (
                  <p className="text-sm mt-2">Find a mentee to get started!</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`w-full md:w-2/3 flex flex-col absolute md:static top-0 right-0 h-full bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out z-10 ${
            selectedConversation
              ? "translate-x-0"
              : "translate-x-full md:translate-x-0"
          }`}
        >
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center flex-shrink-0">
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
                      <div className="text-sm">
                        {getOtherParticipant(selectedConversation)?.id &&
                          getParticipantStatus(
                            getOtherParticipant(selectedConversation).id
                          )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="space-y-2">
                  {messages.length === 0 && !isLoading ? (
                    <div className="text-center text-gray-500">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id || index}
                        className={`flex items-end gap-3 ${
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
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // FIX: This now correctly displays role-specific messages.
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <ChatBubbleIcon />
              <h3 className="text-xl font-semibold mt-4">
                Select a conversation
              </h3>
              <p>
                You'll see your chats appear here once your mentorship request
                is accepted.
              </p>
              {user?.role === "MENTEE" && (
                <p className="text-sm mt-2">
                  <Link to="/mentors" className="text-blue-500 hover:underline">
                    Find a mentor
                  </Link>{" "}
                  to get started!
                </p>
              )}
              {user?.role === "MENTOR" && (
                <p className="text-sm mt-2">Find a mentee to get started!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
