import React, { useState, useRef, useEffect } from "react";
import apiClient from "../api/axios";

// --- Start of New Icons ---
const DownArrowIcon = () => (
  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
  </svg>
);
const MessagesIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 5a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5zM4 3a3 3 0 00-3 3v10a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H4z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const ChatIcon = () => (
  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10c0 3.866-3.582 7-8 7a8.962 8.962 0 01-4.306-.972L2.454 18.546a.5.5 0 01-.652-.652L3.972 14.306A8.962 8.962 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z"
      clipRule="evenodd"
    />
  </svg>
);
// --- End of New Icons ---

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("list"); // 'list' or 'chat'
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get("/ai/conversations");
      setConversations(res.data);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      setView("list");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = async (convoId: string) => {
    setActiveConversationId(convoId);
    try {
      const res = await apiClient.get(`/ai/conversations/${convoId}`);
      setMessages(res.data);
      setView("chat");
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setView("chat");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: "USER", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/ai/chat", {
        message: currentInput,
        conversationId: activeConversationId,
      });
      setMessages((prev) => [...prev, response.data.reply]);
      if (!activeConversationId) {
        setActiveConversationId(response.data.conversationId);
        fetchConversations();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "AI", content: "Sorry, I encountered an error." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-orange-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-orange-600 transition-transform hover:scale-110"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <DownArrowIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <div className="fixed bottom-0 inset-x-0 h-[85vh] md:h-[90vh] md:w-96 md:bottom-28 md:right-8 md:inset-x-auto bg-orange-500 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col z-50">
          <div className="p-4 text-white">
            {view === "list" && (
              <div className="text-center">
                <h2 className="text-3xl font-bold">Hi there 👋</h2>
                <p>Need help? Let's start a conversation!</p>
              </div>
            )}
            {view === "chat" && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView("list")}
                  className="p-2 rounded-full hover:bg-white/20"
                >
                  &larr;
                </button>
                <h3 className="font-bold text-lg">Messages</h3>
                <button className="p-2 rounded-full hover:bg-white/20">
                  &#8801;
                </button>
              </div>
            )}
          </div>

          <div className="flex-grow bg-white rounded-t-2xl flex flex-col">
            {view === "list" && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div
                  onClick={handleNewConversation}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center border border-orange-300"
                >
                  <div>
                    <p className="font-bold text-gray-800">New Conversation</p>
                    <p className="text-sm text-gray-500">
                      We typically reply in a few minutes
                    </p>
                  </div>
                  <span className="text-2xl text-orange-500">&rarr;</span>
                </div>
                <h4 className="font-bold text-gray-600 pt-4">Recent</h4>
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo.id)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <p className="truncate font-semibold">{convo.title}</p>
                    <p className="text-sm text-gray-500">
                      {convo._count.messages} messages
                    </p>
                  </div>
                ))}
              </div>
            )}

            {view === "chat" && (
              <>
                <div className="flex-grow p-4 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`my-2 flex ${
                        msg.sender === "USER" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-lg max-w-xs ${
                          msg.sender === "USER"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-800 whitespace-pre-wrap"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="my-2 flex justify-start">
                      <div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-2 border-t border-gray-200 flex gap-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="flex-grow px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Start a conversation..."
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="p-3 text-gray-500 hover:text-orange-500"
                  >
                    &#128512;
                  </button>
                  <button
                    disabled={isLoading}
                    className="p-3 text-gray-500 hover:text-orange-500"
                  >
                    &#128279;
                  </button>
                </div>
              </>
            )}

            <div className="p-2 border-t border-gray-200 flex justify-around items-center">
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg ${
                  view === "list" ? "text-orange-500" : "text-gray-400"
                }`}
              >
                <HomeIcon />
              </button>
              <button
                onClick={() => setView("chat")}
                className={`p-2 rounded-lg ${
                  view === "chat" && messages.length > 0
                    ? "text-orange-500"
                    : "text-gray-400"
                }`}
              >
                <MessagesIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;
