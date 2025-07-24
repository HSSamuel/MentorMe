import React, { useState, useEffect } from "react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
  LoadingIndicator,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// --- Helper hook to detect if the screen is mobile-sized ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
};

interface Connection {
  id: string;
  name: string;
  avatarUrl?: string;
}

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-900">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// --- A component dedicated to showing the conversation list ---
const ConversationList = ({ connections, onSelectConversation }) => {
  const navigate = useNavigate();
  const handleAvatarClick = (e, userId) => {
    e.stopPropagation();
    navigate(`/users/${userId}`);
  };
  return (
    <div className="w-full h-full flex-col flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Conversations
        </h2>
      </div>
      <ul className="overflow-y-auto h-full">
        {connections.length > 0 ? (
          connections.map((conn) => (
            <li
              key={conn.id}
              onClick={() => onSelectConversation(conn.id)}
              className="flex items-center p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div
                onClick={(e) => handleAvatarClick(e, conn.id)}
                className="z-10"
              >
                <img
                  src={
                    conn.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      conn.name
                    )}&background=random`
                  }
                  alt={conn.name}
                  className="w-12 h-12 rounded-full mr-3 object-cover hover:ring-2 hover:ring-indigo-500 transition-all"
                />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {conn.name}
              </span>
            </li>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No connections found.</p>
          </div>
        )}
      </ul>
    </div>
  );
};

// --- A component dedicated to showing the chat window ---
const ChatWindow = ({ channel, onBack }) => {
  const { user } = useAuth();
  if (!channel) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 dark:bg-gray-900 w-full">
        <div className="mb-5 text-indigo-300 dark:text-indigo-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-28 w-28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h6l2-2h2l-2 2z"
            />
          </svg>
        </div>
        <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Select a conversation
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          Click on one of your connections to see your messages.
        </p>
        {user?.role === "MENTEE" && (
          <Link
            to="/mentors"
            className="mt-8 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Find a New Mentor
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="w-full h-full flex-grow flex flex-col">
      <Channel channel={channel} key={channel.cid}>
        <Window>
          <div className="str-chat__header-livestream dark:bg-gray-800 flex items-center p-2">
            <button
              onClick={onBack}
              className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft
                size={24}
                className="text-gray-600 dark:text-gray-300"
              />
            </button>
            <div className="flex-grow">
              <ChannelHeader />
            </div>
          </div>
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </div>
  );
};

const MessagesPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(
    null
  );
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!user?.id) {
      setIsConnecting(false);
      return;
    }
    const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY!);
    let isMounted = true;
    const setupChat = async () => {
      try {
        if (client.userID !== user.id) {
          await client.connectUser(
            {
              id: user.id,
              name: user.profile?.name || "Anonymous",
              image: user.profile?.avatarUrl,
            },
            async () => {
              const response = await apiClient.post("/stream/token");
              return response.data.token;
            }
          );
        }
        if (!isMounted) return;
        setChatClient(client);
        const response = await apiClient.get<Connection[]>(
          "/users/connections"
        );
        if (isMounted) setConnections(response.data);
      } catch (error) {
        console.error("Failed to setup chat:", error);
        toast.error("Could not connect to chat service.");
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };
    setupChat();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const selectConnection = async (otherUserId: string) => {
    if (!chatClient || !user?.id) return;
    try {
      const channel = chatClient.channel("messaging", {
        members: [user.id, otherUserId],
      });
      await channel.watch();
      setActiveChannel(channel);
    } catch (error) {
      console.error("Error watching channel:", error);
      toast.error("Could not open the conversation.");
    }
  };

  if (isConnecting) return <PageLoader />;
  if (!chatClient)
    return (
      <div className="p-8 text-center text-red-500">
        Error: Chat service connection failed.
      </div>
    );

  return (
    <div className="w-full h-[calc(100vh-4rem)] overflow-hidden">
      <Chat
        client={chatClient}
        theme={isDarkMode ? "messaging dark" : "messaging light"}
      >
        <div className="flex h-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {isMobile ? (
            // On MOBILE, we render EITHER the list OR the chat window
            activeChannel ? (
              <ChatWindow
                channel={activeChannel}
                onBack={() => setActiveChannel(null)}
              />
            ) : (
              <ConversationList
                connections={connections}
                onSelectConversation={selectConnection}
              />
            )
          ) : (
            // On DESKTOP, we render both side-by-side
            <>
              <div className="w-1/3 max-w-sm flex-shrink-0">
                <ConversationList
                  connections={connections}
                  onSelectConversation={selectConnection}
                />
              </div>
              <div className="flex-grow">
                <ChatWindow
                  channel={activeChannel}
                  onBack={() => setActiveChannel(null)}
                />
              </div>
            </>
          )}
        </div>
      </Chat>
    </div>
  );
};

export default MessagesPage;
