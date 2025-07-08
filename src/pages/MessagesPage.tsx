import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { io, Socket } from "socket.io-client";
import { Link } from "react-router-dom";

const MessagesPage = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Effect for fetching conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/messages");
        setConversations(res.data);
        setFilteredConversations(res.data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Effect for filtering conversations
  useEffect(() => {
    const result = conversations.filter((convo) => {
      const otherParticipant = getOtherParticipant(convo);
      return (
        otherParticipant?.profile?.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        otherParticipant?.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });
    setFilteredConversations(result);
  }, [searchQuery, conversations]);

  // Effect for managing Socket.IO connection
  useEffect(() => {
    if (token) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      socketRef.current.on("receiveMessage", (message: any) => {
        if (message.conversationId === selectedConversation?.id) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.id === message.conversationId ? { ...c, messages: [message] } : c
          )
        );
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token, selectedConversation]);

  // Effect to scroll to the bottom of the messages list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    try {
      const res = await apiClient.get(`/messages/${conversation.id}`);
      setMessages(res.data);
      socketRef.current?.emit("joinConversation", conversation.id);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      socketRef.current?.emit("sendMessage", {
        conversationId: selectedConversation.id,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants.find((p: any) => p.id !== user?.id);
  };

  const EmptyState = () => (
    <div className="text-center py-16 px-6">
      <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
        <svg
          className="h-12 w-12 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">
        Your conversations live here
      </h3>
      {user?.role === "MENTEE" && (
        <p className="text-gray-500 mt-2 mb-6">
          Once a mentor accepts your request, you can start chatting with them.
        </p>
      )}
      {user?.role === "MENTOR" && (
        <p className="text-gray-500 mt-2 mb-6">
          When you accept a mentorship request, your private chat with that
          mentee will appear here.
        </p>
      )}
      {user?.role === "MENTEE" && (
        <Link
          to="/mentors"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Find a Mentor
        </Link>
      )}
      {user?.role === "MENTOR" && (
        <Link
          to="/requests"
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          View Your Requests
        </Link>
      )}
    </div>
  );

  return (
    <div className="gradient-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden h-[calc(100vh-10rem)] flex flex-col">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : selectedConversation ? (
          // View 2: Message Window
          <>
            <div className="p-4 border-b border-gray-200/50 bg-white/50 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-1 rounded-full hover:bg-gray-200"
                aria-label="Back to conversations"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <h3 className="font-bold text-lg text-gray-900">
                {getOtherParticipant(selectedConversation)?.profile?.name ||
                  "User"}
              </h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${
                    msg.senderId === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-lg shadow-sm ${
                      msg.senderId === user?.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-75 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white/50 border-t border-gray-200/50 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-transform hover:scale-105"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          // View 1: Conversation List
          <>
            <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Conversations</h2>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex-grow overflow-y-auto">
              {conversations.length > 0 ? (
                filteredConversations.map((convo) => {
                  const otherParticipant = getOtherParticipant(convo);
                  const lastMessage = convo.messages[0];
                  const isUnread =
                    lastMessage &&
                    lastMessage.senderId !== user?.id &&
                    !lastMessage.isRead;
                  return (
                    <div
                      key={convo.id}
                      onClick={() => handleSelectConversation(convo)}
                      className="p-4 cursor-pointer hover:bg-white/50 transition-colors duration-200 flex items-center gap-4 border-b border-gray-200/50"
                    >
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={
                          otherParticipant.profile?.avatarUrl
                            ? `${apiClient.defaults.baseURL}${otherParticipant.profile.avatarUrl}`.replace(
                                "/api",
                                ""
                              )
                            : `https://ui-avatars.com/api/?name=${
                                otherParticipant.profile?.name ||
                                otherParticipant.email
                              }&background=random&color=fff`
                        }
                        alt="Avatar"
                      />
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-900">
                          {otherParticipant?.profile?.name || "User"}
                        </p>
                        <p
                          className={`text-sm truncate ${
                            isUnread
                              ? "text-gray-800 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          {lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
