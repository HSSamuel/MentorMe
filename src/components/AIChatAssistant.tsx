import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

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

const CheckmarkIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      d="M5 13l4 4L19 7"
    ></path>
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
    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
  </svg>
);
const FloatingButtonChatIcon = () => (
  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
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
const HistoryIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path>
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400 hover:text-red-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>
  </svg>
);

const helpArticles = [
  {
    title: "Mentor Responsiveness Tips",
    content:
      "To get the best response from mentors, make sure your initial message is clear and concise. Mention what you'd like to learn and what your goals are. This helps mentors quickly understand if they are a good fit for you.",
  },
  {
    title: "How to Cancel a Session Request",
    content:
      "If you need to cancel a session request that is still pending, navigate to 'My Requests' from the dashboard. You will find a 'Cancel' button next to each pending request.",
  },
  {
    title: "Understanding Session Response Times",
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
    title: "Preparing for Your First Session",
    content:
      "Come prepared with questions! Think about what you want to achieve, what challenges you're facing, and what you'd like to learn from your mentor. Having an agenda makes the session more productive.",
  },
  {
    title: "What if I can't find a mentor?",
    content:
      "If you can't find a mentor with the exact skills you're looking for, try broadening your search. Sometimes a mentor with experience in a related field can provide invaluable and unexpected insights.",
  },
  {
    title: "Updating Your Profile",
    content:
      "A complete and up-to-date profile is key to attracting the right mentors or mentees. Make sure your bio, skills, and goals accurately reflect who you are and what you're looking for.",
  },
  {
    title: "Using the AI Assistant",
    content:
      "Our AI assistant can help you with a variety of tasks, from setting S.M.A.R.T. goals to getting quick answers about the platform. Just open the chat and ask away!",
  },
  {
    title: "Get In Touch",
    content: "Reach me @ smkmayomisamuel@gmail.com.",
  },
];

const suggestionChips = [
  "About MentorMe",
  "How to find a mentor?",
  "Give me some relevant skills",
  "Help me set a S.M.A.R.T. goal",
  "How to prepare for an interview?",
  "What are some good resume tips?",
  "I have a session coming up soon, can you help me prepare?",
  "Can you remind me what my goals are?",
];

interface Message {
  sender: "USER" | "AI";
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

const AIChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const assistantRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await apiClient.get<Conversation[]>("/ai/conversations");
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }
      setIsLoading(true);
      try {
        const { data } = await apiClient.get<Message[]>(
          `/ai/messages/${activeConversationId}`
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([
          {
            sender: "AI",
            content: "Error: Could not load messages for this conversation.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [activeConversationId]);

  const handleArticleClick = (article: { title: string; content: string }) => {
    setCurrentArticle(article);
    setHelpView("article");
  };

  const handleSend = async (messageToSend?: string) => {
    const currentInput = messageToSend || input;
    if ((!currentInput.trim() && !attachedFile) || isLoading) return;

    const userMessageContent = attachedFile
      ? `${currentInput} [File: ${attachedFile.name}]`
      : currentInput;

    const userMessage: Message = {
      sender: "USER",
      content: userMessageContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsLoading(true);
    setIsFileUploaded(false);

    try {
      let response;
      if (attachedFile) {
        const formData = new FormData();
        formData.append("file", attachedFile);
        formData.append("prompt", currentInput);
        if (activeConversationId) {
          formData.append("conversationId", activeConversationId);
        }

        response = await apiClient.post("/ai/analyze-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const endpoint =
          selectedAI === "cohere" ? "/ai/chat/cohere" : "/ai/chat";
        response = await apiClient.post(endpoint, {
          message: currentInput,
          conversationId: activeConversationId,
        });
      }

      setMessages((prev) => [...prev, response.data.reply]);

      if (!activeConversationId && response.data.conversationId) {
        setActiveConversationId(response.data.conversationId);
        fetchConversations();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "An error occurred. Please try again.";
      setMessages((prev) => [
        ...prev,
        { sender: "AI", content: `${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
      setAttachedFile(null);
      setFilePreview(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      setIsFileUploaded(true);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPalette(false);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setActiveTab("chat");
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
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 5;

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error", event.error);
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = "";
      let highestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          for (let j = 0; j < event.results[i].length; j++) {
            if (event.results[i][j].confidence > highestConfidence) {
              highestConfidence = event.results[i][j].confidence;
              finalTranscript = event.results[i][j].transcript;
            }
          }
        }
      }
      if (finalTranscript) {
        setInput((prev) => prev + finalTranscript + " ");
      }
    };
    recognitionRef.current.start();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this chat history?")) {
      try {
        await apiClient.delete(`/ai/conversations/${conversationId}`);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          setMessages([]);
        }
        toast.success("Conversation deleted.");
      } catch (error) {
        toast.error("Failed to delete conversation.");
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const MessageContent = ({ content }: { content: string }) => {
    const parts = content.split(/(\[View Goals\]\(#\/goals\))|(\*\*.*?\*\*)/g);

    return (
      <>
        {parts.map((part, index) => {
          if (!part) return null;

          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
          }

          if (part === "[View Goals](#/goals)") {
            return (
              <Link
                key={index}
                to="/goals"
                className="text-blue-600 font-bold underline hover:text-blue-800"
              >
                View Goals
              </Link>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        buttonRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        assistantRef.current &&
        !assistantRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-4 right-4 md:bottom-4 md:right-8 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-[60] hover:bg-blue-700 transition-transform hover:scale-110"
        aria-label="Toggle Assistant"
      >
        {isOpen ? <CloseIcon /> : <FloatingButtonChatIcon />}
      </button>

      {isOpen && (
        <div
          ref={assistantRef}
          className="fixed bottom-24 right-4 w-[calc(100vw-2rem)] max-w-[380px] h-[77vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 md:right-8"
        >
          <div
            className="bg-blue-600 dark:bg-gray-900 p-4 md:rounded-t-2xl text-white flex-shrink-0"
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
                onClick={() => setActiveTab("history")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === "history"
                    ? "bg-white text-blue-600"
                    : "bg-blue-700 text-white"
                }`}
              >
                <HistoryIcon /> History
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

          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 border-b dark:border-gray-700">
                <select
                  value={selectedAI}
                  onChange={(e) => setSelectedAI(e.target.value)}
                  className="w-full p-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm"
                >
                  <option value="gemini">Gemini (Recommended)</option>
                  <option value="cohere">Cohere</option>
                </select>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center p-8">
                    <div className="inline-block p-4 bg-blue-100 rounded-full">
                      <FloatingButtonChatIcon />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg dark:text-gray-100">
                      How can I help you today?
                    </h3>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {suggestionChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleSuggestionClick(chip)}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
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
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <MessageContent content={msg.content} />
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
              <div className="p-2 border-t dark:border-gray-700 relative">
                {filePreview && (
                  <div className="p-2 relative">
                    {attachedFile?.type.startsWith("image/") ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-24 rounded-lg"
                      />
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-sm text-gray-700 dark:text-gray-200">
                        {filePreview}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setAttachedFile(null);
                        setFilePreview(null);
                        setIsFileUploaded(false);
                      }}
                      className={`absolute top-0 right-0 rounded-full w-5 h-5 flex items-center justify-center text-xs
                        ${isFileUploaded ? "bg-green-500" : "bg-red-500"}`}
                    >
                      {isFileUploaded ? <CheckmarkIcon /> : "×"}
                    </button>
                  </div>
                )}
                {showEmojiPalette && (
                  <div className="absolute bottom-16 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-2 shadow-lg">
                    {["😊", "😂", "❤️", "👍", "🤔", "🎉"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSend())
                    }
                    className="w-full p-2 resize-none border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="Compose your message..."
                    disabled={isLoading}
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !attachedFile)}
                    className="bg-blue-600 text-white rounded-full p-2.5 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors hover:bg-blue-700 flex-shrink-0"
                    aria-label="Send message"
                  >
                    <svg
                      className="w-5 h-5 transform rotate-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
                <div className="flex justify-end space-x-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <EmojiIcon />
                  </button>
                  <button
                    type="button"
                    onClick={handleAttachment}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <AttachmentIcon />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MicIcon isRecording={isRecording} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2 border-b dark:border-gray-700">
                <button
                  onClick={handleNewChat}
                  className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  + Start New Chat
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                <h3 className="font-bold mb-2 text-center text-gray-600 dark:text-gray-400">
                  Past Conversations
                </h3>
                {conversations.length > 0 ? (
                  conversations.map((convo) => (
                    <div
                      key={convo.id}
                      className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border dark:border-gray-700 flex justify-between items-center group"
                    >
                      <div
                        onClick={() => {
                          setActiveConversationId(convo.id);
                          setActiveTab("chat");
                        }}
                        className="flex-grow min-w-0"
                      >
                        <p className="font-semibold text-sm truncate dark:text-gray-100">
                          {convo.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last updated:{" "}
                          {new Date(convo.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(convo.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    No conversation history yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div className="flex-1 p-4 overflow-y-auto">
              {helpView === "list" ? (
                <div>
                  <h3 className="font-bold mb-3 text-center dark:text-gray-100">
                    Most Frequently Read Articles
                  </h3>
                  <ul className="space-y-3">
                    {helpArticles.map((article) => (
                      <li
                        key={article.title}
                        onClick={() => handleArticleClick(article)}
                        className="flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span className="flex items-center text-sm dark:text-gray-200">
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
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold mb-4"
                  >
                    <BackIcon />
                    <span className="ml-1">Back to help</span>
                  </button>
                  <h3 className="font-bold text-lg mb-3 dark:text-gray-100">
                    {currentArticle.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
