import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
// --- [ADDED] Imports for Socket.IO client and react-hot-toast ---
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

// Define the shape of the user and context
interface User {
  id: string;
  email: string;
  role: "ADMIN" | "MENTOR" | "MENTEE";
  profile?: {
    name?: string;
    bio?: string;
    skills?: string[];
    goals?: string;
    avatarUrl?: string;
  };
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, from: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRefreshToken = () => {
  const cookies = document.cookie.split("; ");
  const refreshTokenCookie = cookies.find((row) =>
    row.startsWith("refreshToken=")
  );
  return refreshTokenCookie ? refreshTokenCookie.split("=")[1] : null;
};

const setRefreshTokenCookie = (token: string) => {
  document.cookie = `refreshToken=${token}; path=/; max-age=604800; SameSite=Lax;`;
};

const clearRefreshTokenCookie = () => {
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // --- [ADDED] Ref to hold the socket instance ---
  const socketRef = useRef<Socket | null>(null);

  const fetchUser = async (authToken: string) => {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Auth token is invalid, logging out.", error);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        localStorage.setItem("authToken", refreshToken);
        setToken(refreshToken);
        await fetchUser(refreshToken);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // --- [ADDED] useEffect to manage the real-time socket connection ---
  useEffect(() => {
    // Connect to the socket server only when we have a user and token
    if (user && token) {
      // Initialize the socket connection
      const socket = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });
      socketRef.current = socket;

      // Join a room specific to this user to receive personal notifications
      socket.emit("join", user.id);

      // Listen for the 'newNotification' event from the server
      socket.on("newNotification", (notification) => {
        // When a notification is received, show it as a toast
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Incoming Call
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(notification.link || "/");
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Join Call
                </button>
              </div>
            </div>
          ),
          { duration: 10000 } // Keep the toast on screen for 10 seconds
        );
      });

      // Cleanup function: disconnect the socket when the user logs out or component unmounts
      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user, token, navigate]);

  const login = async (newToken: string, from: string) => {
    setIsLoading(true);
    setToken(newToken);
    setRefreshTokenCookie(newToken);
    localStorage.setItem("authToken", newToken);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    await fetchUser(newToken);
    setIsLoading(false);
    navigate(from, { replace: true });
  };

  const logout = () => {
    // --- [ADDED] Disconnect socket on logout ---
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setUser(null);
    setToken(null);
    clearRefreshTokenCookie();
    localStorage.clear();
    sessionStorage.clear();
    delete apiClient.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  const refetchUser = async () => {
    if (token) {
      setIsLoading(true);
      await fetchUser(token);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
