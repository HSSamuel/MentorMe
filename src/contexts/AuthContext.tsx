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
  };
  // Add fields for calendar integration
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void; // Add a function to refetch user data
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Encapsulated function to fetch user data
  const fetchUser = async (authToken: string) => {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Auth token is invalid, logging out.", error);
      // Call logout directly to handle cleanup
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common["Authorization"];
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
    // The navigate function is stable and doesn't need to be a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
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

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
