import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

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

  // Encapsulated function to fetch user data
  const fetchUser = async (authToken: string) => {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Auth token is invalid, logging out.", error);
      // Force a full logout if the token is bad
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        setToken(refreshToken);
        await fetchUser(refreshToken);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (newToken: string, from: string) => {
    setIsLoading(true);
    // 1. Set the new token and cookie
    setToken(newToken);
    setRefreshTokenCookie(newToken);

    // 2. Fetch the new user's data
    await fetchUser(newToken);

    // 3. Navigate only after everything is loaded
    navigate(from, { replace: true });
    setIsLoading(false);
  };

  const logout = () => {
    // Clear everything possible
    setUser(null);
    setToken(null);
    clearRefreshTokenCookie();
    localStorage.clear(); // Clear all localStorage
    sessionStorage.clear(); // Clear all sessionStorage
    delete apiClient.defaults.headers.common["Authorization"];

    // A hard redirect to the login page is the most reliable way to clear all state
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
