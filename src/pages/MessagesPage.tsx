import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { io, Socket } from "socket.io-client";

const MessagesPage = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Effect for fetching conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get("/messages");
        setConversations(res.data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Effect for managing Socket.IO connection
  useEffect(() => {
    if (token) {
      // Establish socket connection with authentication token
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      socketRef.current.on("receiveMessage", (message: any) => {
        // Only update messages if the received message belongs to the currently selected conversation
        if (message.conversationId === selectedConversation?.id) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
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
      // Join the specific conversation room on the server
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

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Conversations</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <p className="p-4">Loading...</p>
          ) : (
            conversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => handleSelectConversation(convo)}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedConversation?.id === convo.id ? "bg-blue-100" : ""
                }`}
              >
                <p className="font-semibold">
                  {getOtherParticipant(convo)?.profile?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {convo.messages[0]?.content || "No messages yet"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Window */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-lg">
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
                    className={`rounded-lg px-4 py-2 max-w-lg ${
                      msg.senderId === user?.id
                        ? "bg-blue-500 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Select a conversation to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
