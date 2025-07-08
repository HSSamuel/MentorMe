import React, { useState, useRef, useEffect } from "react";
import apiClient from "../api/axios";

// --- Helper Icons ---
const CloseIcon = () => (
  <svg
    className="w-8 h-8 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const HelpIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0114.5 16c1.255 0 2.443-.29 3.5-.804V4.804A7.968 7.968 0 0014.5 4z"></path>
  </svg>
);
const EmojiIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500 hover:text-blue-600 transition-colors"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const AttachmentIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500 hover:text-blue-600 transition-colors"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);
const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
  <svg
    className={`w-6 h-6 transition-colors ${
      isRecording ? "text-red-500" : "text-gray-500 hover:text-blue-600"
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);
const ChatIcon = () => (
  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
  </svg>
);
const FloatingButtonChatIcon = () => (
  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
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

// --- Help Articles Data ---
const helpArticles = [
  {
    title: "Mentor responsiveness tips",
    content:
      "To get the best response from mentors, make sure your initial message is clear and concise. Mention what you'd like to learn and what your goals are. This helps mentors quickly understand if they are a good fit for you.",
  },
  {
    title: "Cancel a session request",
    content:
      "If you need to cancel a session request that is still pending, navigate to 'My Requests' from the dashboard. You will find a 'Cancel' button next to each pending request.",
  },
  {
    title: "Session response time",
    content:
      "Our mentors are active professionals and typically respond to session requests within 48 hours. If you haven't heard back after 2 days, we recommend reaching out to another mentor.",
  },
  {
    title: "How to Give Effective Feedback",
    content:
      "Effective feedback is specific, actionable, and kind. Focus on the behavior or outcome, not the person. Use 'I' statements to express how something impacted you, and offer clear suggestions for improvement.",
  },
  {
    title: "Setting Mentorship Goals",
    content:
      "Good goals are SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. Work with your mentor to define 1-3 clear goals for your mentorship period to ensure you stay on track.",
  },
  {
    title: "Get In Touch",
    content: "Reach me @ smkmayomisamuel@gmail.com.",
  },
];

const suggestionChips = [
  "Help me write a cover letter",
  "How to prepare for an interview?",
  "What are some good resume tips?",
];

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPalette, setShowEmojiPalette] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAI, setSelectedAI] = useState("gemini");
  const [helpView, setHelpView] = useState("list");
  const [currentArticle, setCurrentArticle] = useState({
    title: "",
    content: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleArticleClick = (article: { title: string; content: string }) => {
    setCurrentArticle(article);
    setHelpView("article");
  };

  const handleSend = async (messageToSend?: string) => {
    const currentInput = messageToSend || input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage = { sender: "USER", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsLoading(true);

    const endpoint = selectedAI === "cohere" ? "/ai/chat/cohere" : "/ai/chat";

    try {
      const { data } = await apiClient.post(endpoint, {
        message: currentInput,
        conversationId: activeConversationId,
      });
      setMessages((prev) => [...prev, data.reply]);
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        "Thank you for visiting our website. Kindly register or login to explore our services.";
      setMessages((prev) => [
        ...prev,
        { sender: "AI", content: `${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      setInput((prev) => `${prev} [Attached: ${file.name}] `);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPalette(false);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error", event.error);
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) => prev + finalTranscript);
      }
    };
    recognitionRef.current.start();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:bottom-4 md:right-8 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-[60] hover:bg-blue-700 transition-transform hover:scale-110"
        aria-label="Toggle Assistant"
      >
        {isOpen ? <CloseIcon /> : <FloatingButtonChatIcon />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-[calc(100vw-2rem)] max-w-[380px] h-[77vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-40 md:right-8">
          <div
            className="bg-blue-600 p-4 md:rounded-t-2xl text-white flex-shrink-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            <div className="flex justify-center space-x-2 mb-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === "chat"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                <ChatIcon /> Chat
              </button>
              <button
                onClick={() => {
                  setActiveTab("help");
                  setHelpView("list");
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === "help"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                <HelpIcon /> Help
              </button>
            </div>
          </div>

          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 border-b">
                <select
                  value={selectedAI}
                  onChange={(e) => setSelectedAI(e.target.value)}
                  className="w-full p-2 border-gray-300 rounded-md text-sm"
                >
                  <option value="gemini">Gemini (Recommended)</option>
                  <option value="cohere">Cohere</option>
                </select>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center p-8">
                    <div className="inline-block p-4 bg-blue-100 rounded-full">
                      <ChatIcon />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">
                      How can I help you today?
                    </h3>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {suggestionChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleSuggestionClick(chip)}
                          className="px-3 py-1 bg-gray-200 text-sm rounded-full hover:bg-gray-300"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      msg.sender === "USER" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg max-w-xs text-sm whitespace-pre-wrap ${
                        msg.sender === "USER"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <p className="text-gray-500 text-sm text-center">
                    Thinking...
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-2 border-t border-gray-200 relative">
                {showEmojiPalette && (
                  <div className="absolute bottom-16 bg-white border rounded-lg p-2 shadow-lg">
                    {["😊", "😂", "❤️", "👍", "🤔", "🎉"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl p-1 hover:bg-gray-200 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSend())
                  }
                  className="w-full p-2 resize-none border-none focus:ring-0 text-sm"
                  placeholder="Compose your message..."
                  disabled={isLoading}
                  rows={2}
                />
                <div className="flex justify-end space-x-3 p-2">
                  <button
                    onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                  >
                    <EmojiIcon />
                  </button>
                  <button onClick={handleAttachment}>
                    <AttachmentIcon />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <button onClick={handleVoiceInput}>
                    <MicIcon isRecording={isRecording} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto">
              {helpView === "list" ? (
                <div>
                  <h3 className="font-bold mb-3 text-center">
                    Most Frequently Read Articles
                  </h3>
                  <ul className="space-y-3">
                    {helpArticles.map((article) => (
                      <li
                        key={article.title}
                        onClick={() => handleArticleClick(article)}
                        className="flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-gray-100"
                      >
                        <span className="flex items-center text-sm">
                          <HelpIcon />{" "}
                          <span className="ml-2">{article.title}</span>
                        </span>
                        <span className="text-gray-400">&gt;</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setHelpView("list")}
                    className="flex items-center text-sm text-blue-600 font-semibold mb-4"
                  >
                    <BackIcon />
                    <span className="ml-1">Back to help</span>
                  </button>
                  <h3 className="font-bold text-lg mb-3">
                    {currentArticle.title}
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {currentArticle.content}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;
