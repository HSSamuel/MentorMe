import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../api/axios";
import {
  Calendar,
  User,
  Check,
  X,
  Hourglass,
  Star,
  Search,
  ChevronDown,
  Eye,
} from "lucide-react";
import io from "socket.io-client"; // 1. Import the socket.io client
import { useAuth } from "../contexts/AuthContext"; // 2. Import useAuth to get the token

// --- Define a more specific type for a Session for better code quality ---
interface Session {
  id: string;
  mentor: { profile?: { name?: string } };
  mentee: { profile?: { name?: string } };
  date: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  rating?: number;
  feedback?: string;
}

// --- A dedicated modal to display existing feedback ---
const ViewFeedbackModal = ({
  isOpen,
  onClose,
  session,
}: {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}) => {
  if (!isOpen || !session) return null;

  const StarRatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-6 h-6 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Session Feedback
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Rating Provided:
            </p>
            <div className="mt-1">
              {session.rating ? (
                <StarRatingDisplay rating={session.rating} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No rating was given.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Comments:
            </p>
            <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md whitespace-pre-wrap">
              {session.feedback || "No comments were provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const statusStyles = {
  UPCOMING: {
    icon: <Hourglass size={14} className="mr-1.5" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    borderColor: "border-blue-500",
  },
  COMPLETED: {
    icon: <Check size={14} className="mr-1.5" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    borderColor: "border-green-500",
  },
  CANCELLED: {
    icon: <X size={14} className="mr-1.5" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    borderColor: "border-red-500",
  },
};

const AdminSessionsPage = () => {
  const { token } = useAuth(); // Get the auth token for the socket
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/admin/sessions");
        if (Array.isArray(response.data.sessions)) {
          setAllSessions(response.data.sessions);
        }
        setTotalCount(response.data.totalCount);
      } catch (err) {
        setError("Failed to fetch sessions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // --- [REAL-TIME UPDATE] ---
  // This new useEffect sets up the WebSocket listener for real-time updates.
  useEffect(() => {
    if (token) {
      const socket = io(import.meta.env.VITE_API_BASE_URL!, {
        auth: { token },
      });

      // Listen for 'sessionUpdated' events from the backend
      socket.on("sessionUpdated", (updatedSession: Session) => {
        setAllSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          )
        );
        // Also update the total count if it's part of the event data
        if (updatedSession.totalCount) {
          setTotalCount(updatedSession.totalCount);
        }
      });

      // Listen for 'newSession' events from the backend
      socket.on("newSession", (newSession: Session) => {
        setAllSessions((prevSessions) => [newSession, ...prevSessions]);
        setTotalCount((prevCount) => prevCount + 1);
      });

      // Disconnect the socket when the component unmounts
      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const filteredSessions = useMemo(() => {
    return allSessions
      .filter((session) => {
        if (statusFilter !== "ALL" && session.status !== statusFilter) {
          return false;
        }
        if (searchTerm) {
          const mentorName = session.mentor.profile?.name?.toLowerCase() || "";
          const menteeName = session.mentee.profile?.name?.toLowerCase() || "";
          return (
            mentorName.includes(searchTerm.toLowerCase()) ||
            menteeName.includes(searchTerm.toLowerCase())
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [allSessions, searchTerm, statusFilter, sortBy]);

  const handleViewFeedback = (session: Session) => {
    setSelectedSession(session);
    setFeedbackModalOpen(true);
  };

  const FilterButton = ({
    status,
    label,
  }: {
    status: string;
    label: string;
  }) => (
    <button
      onClick={() => setStatusFilter(status)}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
        statusFilter === status
          ? "bg-indigo-600 text-white shadow"
          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  if (isLoading)
    return (
      <p className="p-8 text-center text-gray-500 dark:text-gray-400">
        Loading all sessions...
      </p>
    );
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Sessions
        </h1>
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl shadow-lg p-4 text-center">
          <h2 className="text-md font-semibold opacity-80">Total Sessions</h2>
          <p className="text-3xl font-bold">{totalCount}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="relative flex-grow md:mr-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by mentor or mentee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterButton status="ALL" label="All" />
          <FilterButton status="UPCOMING" label="Upcoming" />
          <FilterButton status="COMPLETED" label="Completed" />
          <FilterButton status="CANCELLED" label="Cancelled" />
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full md:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 pl-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300"
              size={20}
            />
          </div>
        </div>
      </div>

      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const statusInfo =
              statusStyles[session.status] || statusStyles.UPCOMING;
            const hasFeedback = session.rating || session.feedback;

            return (
              <div
                key={session.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-l-4 ${statusInfo.borderColor} flex flex-col`}
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {session.status}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <span className="font-bold text-lg text-gray-800 dark:text-white mr-1">
                        {session.rating ? session.rating.toFixed(1) : "N/A"}
                      </span>
                      <Star size={18} />
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      <span className="font-bold">
                        {session.mentor.profile?.name || "N/A"}
                      </span>{" "}
                      &amp;{" "}
                      <span className="font-bold">
                        {session.mentee.profile?.name || "N/A"}
                      </span>
                    </p>
                    <p className="flex items-center text-gray-500 dark:text-gray-400">
                      <Calendar size={14} className="mr-2" />
                      {new Date(session.date).toLocaleString([], {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-between items-center rounded-b-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Session ID: {session.id}
                  </p>
                  {hasFeedback && (
                    <button
                      onClick={() => handleViewFeedback(session)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                      <Eye size={14} /> View Feedback
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            No Sessions Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Your search, filter, or sort criteria did not match any sessions.
          </p>
        </div>
      )}

      <ViewFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        session={selectedSession}
      />
    </div>
  );
};

export default AdminSessionsPage;
