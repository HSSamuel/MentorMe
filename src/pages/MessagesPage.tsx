import React, { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

// --- [NEW] A custom component to show when the user has no conversations ---
const CustomEmptyState = () => {
  const { user } = useAuth(); // Get the current user to show role-specific messages

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-800 dark:text-white">
        No conversations yet
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
        Your chats will appear here once a mentorship request is accepted.
      </p>
      {user?.role === "MENTEE" && (
        <Link
          to="/mentors"
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Find a Mentor to Get Started
        </Link>
      )}
    </div>
  );
};

// A simple loader component
const PageLoader = () => (
  <div className="flex justify-center items-center h-full w-full">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const MessagesPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const isConnecting = useRef(false);

  // This effect applies the global CSS class needed for Stream's dark mode
  useEffect(() => {
    const body = document.body;
    const themeClass = "str-chat__theme-dark";

    if (isDarkMode) {
      body.classList.add(themeClass);
    } else {
      body.classList.remove(themeClass);
    }

    return () => {
      body.classList.remove(themeClass);
    };
  }, [isDarkMode]);

  // This effect initializes the chat client and connects the user
  useEffect(() => {
    if (!user || isConnecting.current) return;

    const initChat = async () => {
      isConnecting.current = true;
      const client = StreamChat.getInstance(
        import.meta.env.VITE_STREAM_API_KEY
      );

      try {
        const response = await apiClient.post("/stream/token");
        const { token } = response.data;

        if (client.userID !== user.id) {
          if (client.userID) {
            await client.disconnectUser();
          }
          await client.connectUser(
            {
              id: user.id,
              name: user.profile.name,
              image: user.profile.avatarUrl,
            },
            token
          );
        }
        setChatClient(client);
      } catch (error: any) {
        console.error("Error initializing chat:", error);
        toast.error(error.message || "Could not connect to the chat service.");
      } finally {
        isConnecting.current = false;
      }
    };

    if (!chatClient) {
      initChat();
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
    };
  }, [user, chatClient]);

  if (!chatClient) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-white dark:bg-gray-900">
      <Chat
        client={chatClient}
        theme={isDarkMode ? "messaging dark" : "messaging light"}
      >
        <ChannelList
          filters={{ members: { $in: [user!.id] } }}
          sort={{ last_message_at: -1 }}
          EmptyStateIndicator={CustomEmptyState}
        />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
};

export default MessagesPage;
