import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { io, Socket } from "socket.io-client";
import { Link } from "react-router-dom";

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

// --- Main Messages Page Component ---
const MessagesPage = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // --- Utility function to get the other participant in a conversation ---
  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants || !user) return null;
    return conversation.participants.find((p: any) => p.id !== user.id);
  };

  // --- Fetching Initial Conversation Data ---
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/messages");
        // Sort conversations by the last message date
        const sortedConversations = res.data.sort((a: any, b: any) => {
          const lastMessageA = new Date(
            a.messages[0]?.createdAt || 0
          ).getTime();
          const lastMessageB = new Date(
            b.messages[0]?.createdAt || 0
          ).getTime();
          return lastMessageB - lastMessageA;
        });
        setConversations(sortedConversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // --- Socket.io Connection and Listeners ---
  useEffect(() => {
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
    });

    socketRef.current.on("receiveMessage", (message: any) => {
      // Update the message list if the conversation is currently open
      if (message.conversationId === selectedConversation?.id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }

      // Update the conversation list to bring the updated one to the top
      setConversations((prevConvos) => {
        const updatedConvo = prevConvos.find(
          (c) => c.id === message.conversationId
        );
        if (updatedConvo) {
          const otherConvos = prevConvos.filter(
            (c) => c.id !== message.conversationId
          );
          return [{ ...updatedConvo, messages: [message] }, ...otherConvos];
        }
        return prevConvos; // Or fetch all convos again if a new one might have been created
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, selectedConversation?.id]);

  // --- Auto-scrolling for new messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handler for selecting a conversation ---
  const handleSelectConversation = async (conversation: any) => {
    if (selectedConversation?.id === conversation.id) return;
    setSelectedConversation(conversation);
    try {
      const res = await apiClient.get(`/messages/${conversation.id}`);
      setMessages(res.data);
      socketRef.current?.emit("joinConversation", conversation.id);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    }
  };

  // --- Handler for sending a message ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newMessage.trim() &&
      selectedConversation &&
      socketRef.current &&
      user
    ) {
      socketRef.current.emit("sendMessage", {
        conversationId: selectedConversation.id,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter((convo) => {
    const otherParticipant = getOtherParticipant(convo);
    return otherParticipant?.profile?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex overflow-hidden relative">
        {/* Left Column: Conversation List */}
        <div
          className={`w-full md:w-1/3 md:flex flex-col transition-transform duration-300 ease-in-out absolute md:static inset-0 ${
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
            ) : (
              filteredConversations.map((convo) => {
                const otherParticipant = getOtherParticipant(convo);
                if (!otherParticipant) return null; // Skip rendering if no other participant
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
                      src={
                        otherParticipant.profile?.avatarUrl?.startsWith("http")
                          ? otherParticipant.profile.avatarUrl
                          : otherParticipant.profile?.avatarUrl
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
                    <div className="flex-grow ml-4 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {otherParticipant.profile?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {convo.messages[0]?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`w-full md:w-2/3 flex flex-col absolute md:static top-0 right-0 h-full bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out ${
            selectedConversation
              ? "translate-x-0"
              : "translate-x-full md:translate-x-0"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center flex-shrink-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden mr-2"
                  aria-label="Back to conversations"
                >
                  <BackIcon />
                </button>
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={
                    getOtherParticipant(
                      selectedConversation
                    )?.profile?.avatarUrl?.startsWith("http")
                      ? getOtherParticipant(selectedConversation).profile
                          .avatarUrl
                      : getOtherParticipant(selectedConversation)?.profile
                          ?.avatarUrl
                      ? `${apiClient.defaults.baseURL}${
                          getOtherParticipant(selectedConversation).profile
                            .avatarUrl
                        }`.replace("/api", "")
                      : `https://ui-avatars.com/api/?name=${
                          getOtherParticipant(selectedConversation).profile
                            ?.name ||
                          getOtherParticipant(selectedConversation).email
                        }&background=random&color=fff`
                  }
                  alt="Avatar"
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white ml-4">
                  {getOtherParticipant(selectedConversation)?.profile?.name}
                </h3>
              </div>

              {/* Messages Area */}
              <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-3 ${
                        msg.senderId === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {msg.senderId !== user?.id && (
                        <img
                          src={
                            getOtherParticipant(
                              selectedConversation
                            )?.profile?.avatarUrl?.startsWith("http")
                              ? getOtherParticipant(selectedConversation)
                                  .profile.avatarUrl
                              : getOtherParticipant(selectedConversation)
                                  ?.profile?.avatarUrl
                              ? `${apiClient.defaults.baseURL}${
                                  getOtherParticipant(selectedConversation)
                                    .profile.avatarUrl
                                }`.replace("/api", "")
                              : `https://ui-avatars.com/api/?name=${
                                  getOtherParticipant(selectedConversation)
                                    .profile?.name ||
                                  getOtherParticipant(selectedConversation)
                                    .email
                                }&background=random&color=fff`
                          }
                          alt="Sender"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-lg ${
                          msg.senderId === user?.id
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
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
            // Placeholder when no conversation is selected
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <ChatBubbleIcon />
              <h3 className="text-xl font-semibold mt-4">
                Select a conversation
              </h3>
              <p>Choose from your existing conversations to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
