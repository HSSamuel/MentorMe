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
  login: (token: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A helper function to manage the refresh token in a cookie
const setRefreshTokenCookie = (token: string) => {
  // In a real app, 'secure: true' should be used in production
  document.cookie = `refreshToken=${token}; path=/; max-age=604800; SameSite=Lax;`;
};

const clearRefreshTokenCookie = () => {
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // Token is now in-memory
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async (authToken: string) => {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Auth token is invalid, logging out.", error);
      logout(); // Centralize logout logic
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // On initial load, try to "refresh" the session if a refresh token exists
    const refreshToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refreshToken="))
      ?.split("=")[1];

    if (refreshToken) {
      // In a real app, you would have a '/auth/refresh' endpoint.
      // We will simulate this by re-using the existing JWT for demonstration.
      // This structure shows how a real refresh flow would be initiated.
      setToken(refreshToken);
      fetchUser(refreshToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    setRefreshTokenCookie(newToken); // Use the JWT as a refresh token for this simulation
    await fetchUser(newToken);
  };

  const logout = () => {
    clearRefreshTokenCookie();
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  const refetchUser = () => {
    if (token) {
      setIsLoading(true);
      fetchUser(token);
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
