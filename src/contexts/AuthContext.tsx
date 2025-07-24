import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useRef,
  useCallback, // Import useCallback for function memoization
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
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
  // --- [ENHANCED] Initialize token directly from localStorage for robustness ---
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("authToken")
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // --- [ENHANCED] Wrapped fetchUser in useCallback to stabilize its identity ---
  const fetchUser = useCallback(async (authToken: string) => {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Auth token is invalid, logging out.", error);
      // Use the logout function to ensure a clean state reset
      clearRefreshTokenCookie();
      localStorage.removeItem("authToken");
      setUser(null);
      setToken(null);
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Prioritize token from localStorage, fallback to cookie if needed
      const currentToken = token || getRefreshToken();
      if (currentToken) {
        if (!token) {
          // Sync state if token was only in cookie
          setToken(currentToken);
          localStorage.setItem("authToken", currentToken);
        }
        await fetchUser(currentToken);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [fetchUser]); // fetchUser is now a stable dependency

  useEffect(() => {
    if (user && token) {
      const socket = io(import.meta.env.VITE_API_BASE_URL!, {
        auth: { token },
      });
      socketRef.current = socket;

      socket.emit("join", user.id);

      socket.on("newNotification", (notification) => {
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
          { duration: 10000 }
        );
      });

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
    await fetchUser(newToken);
    setIsLoading(false);
    navigate(from, { replace: true });
  };

  const logout = () => {
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
