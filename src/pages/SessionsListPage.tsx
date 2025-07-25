import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import FeedbackModal from "../components/FeedbackModal";
import { Link } from "react-router-dom";
import {
  Calendar,
  Video,
  MessageSquare,
  BarChart2,
  User,
  Award,
} from "lucide-react";

// --- Define a more specific type for a Session for better code quality ---
interface Session {
  id: string;
  date: string;
  rating?: number;
  feedback?: any;
  mentor: { profile?: { name?: string; avatarUrl?: string } };
  mentee: { profile?: { name?: string; avatarUrl?: string } };
}

// --- A dedicated, enhanced card component for displaying a session ---
const SessionCard = ({ session, user, onGiveFeedback }) => {
  const isPast = new Date(session.date) < new Date();
  const partner = user.role === "MENTOR" ? session.mentee : session.mentor;
  const partnerRole = user.role === "MENTOR" ? "Mentee" : "Mentor";
  const hasFeedback = session.rating || session.feedback;

  // --- [THE FIX] ---
  // This now safely handles cases where the partner (mentor/mentee) might be missing.
  const partnerName = partner?.profile?.name || "Deleted User";
  const partnerAvatar =
    partner?.profile?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}`;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col border-l-4 ${
        isPast ? "border-gray-400" : "border-indigo-500"
      }`}
    >
      <div className="p-5 flex-grow">
        <div className="flex items-center gap-4 mb-4">
          <img
            src={partnerAvatar}
            alt={partnerName}
            className="w-16 h-16 rounded-full object-cover bg-gray-200"
          />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session with
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {partnerName}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${
                partnerRole === "Mentor"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {partnerRole === "Mentor" ? (
                <Award size={12} className="mr-1" />
              ) : (
                <User size={12} className="mr-1" />
              )}
              {partnerRole}
            </span>
          </div>
        </div>
        <div className="border-t dark:border-gray-700 pt-4">
          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={14} className="mr-2.5 text-indigo-500" />
            {new Date(session.date).toLocaleString([], {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end items-center gap-3">
        {isPast ? (
          <>
            <Link
              to={`/session/${session.id}/insights`}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              <BarChart2 size={14} /> Insights
            </Link>
            {!hasFeedback && user?.role !== "ADMIN" && (
              <button
                onClick={() => onGiveFeedback(session)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <MessageSquare size={14} /> Feedback
              </button>
            )}
            {hasFeedback && (
              <span className="text-xs text-green-600 dark:text-green-400 italic">
                Feedback Submitted
              </span>
            )}
          </>
        ) : (
          <Link
            to={`/session/${session.id}/call`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Video size={16} /> Join Session
          </Link>
        )}
      </div>
    </div>
  );
};

const SessionsListPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setIsLoading(true);
      let endpoint = "";
      if (user.role === "ADMIN") {
        endpoint = "/admin/sessions";
      } else if (user.role === "MENTOR") {
        endpoint = "/sessions/mentor";
      } else {
        endpoint = "/sessions/mentee";
      }
      try {
        const response = await apiClient.get(endpoint);
        const sessionData =
          user.role === "ADMIN" ? response.data.sessions : response.data;

        // --- [THE FIX] ---
        // Removed the aggressive filter to ensure all sessions are loaded.
        // The SessionCard component will now handle any missing data gracefully.
        setSessions(sessionData || []);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to load sessions.";
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [user]);

  const handleOpenFeedbackModal = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleFeedbackSubmitted = (updatedSession: Session) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const now = new Date();
  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => new Date(s.date) >= now)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    [sessions]
  );
  const pastSessions = useMemo(
    () =>
      sessions
        .filter((s) => new Date(s.date) < now)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [sessions]
  );

  const TabButton = ({
    tabName,
    label,
    count,
  }: {
    tabName: "upcoming" | "past";
    label: string;
    count: number;
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabName
          ? "bg-indigo-600 text-white shadow"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {label}
      <span
        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === tabName
            ? "bg-indigo-400 text-white"
            : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
        }`}
      >
        {count}
      </span>
    </button>
  );

  const EmptyState = ({ tab }: { tab: "upcoming" | "past" }) => (
    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        No {tab} sessions
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">
        {tab === "upcoming"
          ? "You don't have any sessions scheduled."
          : "You haven't completed any sessions yet."}
      </p>
      {tab === "upcoming" && user?.role === "MENTEE" && (
        <Link
          to="/mentors"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Find a Mentor to Book a Session
        </Link>
      )}
      {tab === "upcoming" && user?.role === "MENTOR" && (
        <Link
          to="/availability"
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Set Your Availability
        </Link>
      )}
    </div>
  );

  if (isLoading)
    return (
      <p className="text-center p-8 text-gray-500 dark:text-gray-400">
        Loading your sessions...
      </p>
    );
  if (error)
    return <p className="text-center p-8 text-red-500">Error: {error}</p>;

  return (
    <div className="py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {user?.role === "ADMIN" ? "All Platform Sessions" : "My Sessions"}
        </h1>

        <div className="mb-8 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-center space-x-2">
          <TabButton
            tabName="upcoming"
            label="Upcoming"
            count={upcomingSessions.length}
          />
          <TabButton tabName="past" label="Past" count={pastSessions.length} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "upcoming" &&
            (upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  user={user}
                  onGiveFeedback={handleOpenFeedbackModal}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState tab="upcoming" />
              </div>
            ))}

          {activeTab === "past" &&
            (pastSessions.length > 0 ? (
              pastSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  user={user}
                  onGiveFeedback={handleOpenFeedbackModal}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState tab="past" />
              </div>
            ))}
        </div>
      </div>

      {isModalOpen && selectedSession && (
        <FeedbackModal
          session={selectedSession}
          onClose={() => setIsModalOpen(false)}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
};

export default SessionsListPage;
