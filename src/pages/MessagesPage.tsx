import React, { useState, useEffect } from "react";
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

// A more visually appealing empty state component
const CustomEmptyState = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 dark:bg-gray-900/50">
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
        Your conversations live here
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
        Once a mentorship is accepted, you can chat directly with your mentor or
        mentee from this page.
      </p>
      {user?.role === "MENTEE" && (
        <Link
          to="/mentors"
          className="mt-8 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Find a Mentor to Get Started
        </Link>
      )}
    </div>
  );
};

// A simple loader component
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const MessagesPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Wait until the user object is fully loaded
    if (!user?.id || !user.profile?.name) {
      setIsConnecting(false);
      return;
    }

    const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
    let didAbort = false;

    const initChat = async () => {
      setIsConnecting(true);
      try {
        // Only connect if the current user is different from the one in the client
        if (client.userID !== user.id) {
          if (client.userID) {
            await client.disconnectUser();
          }
          const response = await apiClient.post("/stream/token");
          const { token } = response.data;
          await client.connectUser(
            {
              id: user.id,
              name: user.profile.name,
              image: user.profile.avatarUrl,
            },
            token
          );
        }
        if (!didAbort) {
          setChatClient(client);
        }
      } catch (error: any) {
        console.error("Error initializing chat:", error);
        toast.error(error.message || "Could not connect to the chat service.");
      } finally {
        if (!didAbort) {
          setIsConnecting(false);
        }
      }
    };

    initChat();

    return () => {
      // This cleanup function will run when the component unmounts
      didAbort = true;
      // Disconnecting the user on unmount is a good practice
      client.disconnectUser();
      setChatClient(null);
    };
  }, [user?.id, user?.profile?.name]); // Stable dependencies prevent re-render loops

  // --- [FIX] The main container now correctly fills the screen and prevents overflow ---
  return (
    <>
      {/* --- [REDESIGN] Custom styles for a modern chat interface --- */}
      <style>{`
        .str-chat__container {
          height: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
          };
        }
        .str-chat__channel-list {
          border-right: 1px solid ${
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
          };
        }
        .str-chat__channel-list-messenger {
            background-color: ${isDarkMode ? "#1a1d2e" : "#f9fafb"};
        }
        .str-chat__channel-preview-messenger {
            padding: 12px;
        }
        .str-chat__channel-preview-messenger--active {
            background-color: ${
              isDarkMode ? "rgba(59, 130, 246, 0.3)" : "#eff6ff"
            };
            border-left: 4px solid #3b82f6;
        }
        .str-chat__header-livestream {
            border-bottom: 1px solid ${
              isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
            };
            background-color: ${isDarkMode ? "#1f2937" : "#ffffff"};
            box-shadow: none;
        }
        .str-chat__main-panel {
            background-color: ${isDarkMode ? "#111827" : "#ffffff"};
        }
        .str-chat__message-list {
            padding: 1rem;
        }
        .str-chat__simple-message {
            padding: 0.5rem 0;
        }
        .str-chat__message-simple__bubble {
            border-radius: 1.25rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            max-width: 70%;
        }
        .str-chat__message--me .str-chat__message-simple__bubble {
            background-color: #3b82f6;
            color: white;
        }
        .str-chat__message--not-me .str-chat__message-simple__bubble {
            background-color: ${isDarkMode ? "#374151" : "#e5e7eb"};
        }
        .str-chat__message-text-inner {
            color: ${isDarkMode ? "#e5e7eb" : "#1f2937"};
        }
        .str-chat__message--me .str-chat__message-text-inner {
            color: white;
        }
        .str-chat__input-messenger-container {
            border-top: 1px solid ${
              isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
            };
            background-color: ${isDarkMode ? "#1f2937" : "#f9fafb"};
            padding: 1rem;
        }
      `}</style>
      <div className="w-full h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-gray-1000">
        {isConnecting || !chatClient ? (
          <PageLoader />
        ) : (
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
        )}
      </div>
    </>
  );
};

export default MessagesPage;
