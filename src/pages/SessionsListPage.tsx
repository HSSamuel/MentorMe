import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import FeedbackModal from "../components/FeedbackModal";
import { Link } from "react-router-dom";

const SessionsListPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

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

  const handleOpenFeedbackModal = (session: any) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleFeedbackSubmitted = (updatedSession: any) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.date) >= now);
  const pastSessions = sessions.filter((s) => new Date(s.date) < now);

  const renderSessionCard = (session: any) => {
    const sessionDate = new Date(session.date);
    const hasFeedback = session.rating || session.feedback;

    let sessionTitle = "Session";
    if (user?.role === "ADMIN") {
      sessionTitle = `Session: ${session.mentor?.profile?.name || "N/A"} & ${
        session.mentee?.profile?.name || "N/A"
      }`;
    } else {
      const otherUser =
        user?.role === "MENTOR" ? session.mentee : session.mentor;
      sessionTitle = `Session with ${otherUser?.profile?.name || "a user"}`;
    }

    return (
      <div
        key={session.id}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h4 className="text-lg font-bold text-gray-800">
                {sessionTitle}
              </h4>
              <p className="text-sm text-gray-500">
                {sessionDate.toLocaleString([], {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              {activeTab === "past" && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Completed
                </span>
              )}
              {activeTab === "upcoming" && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Upcoming
                </span>
              )}
            </div>
          </div>
        </div>
        {activeTab === "past" && !hasFeedback && user?.role !== "ADMIN" && (
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={() => handleOpenFeedbackModal(session)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Feedback
            </button>
          </div>
        )}
        {activeTab === "past" && hasFeedback && (
          <div className="bg-gray-50 px-6 py-3">
            <p className="text-xs text-green-600 italic text-right">
              Feedback submitted. Thank you!
            </p>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ tab }: { tab: "upcoming" | "past" }) => (
    <div className="text-center py-16 px-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
      <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
        <svg
          className="h-12 w-12 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">No {tab} sessions</h3>
      <p className="text-gray-500 mt-2 mb-6">
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
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}{" "}
      <span
        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === tabName
            ? "bg-indigo-400 text-white"
            : "bg-gray-300 text-gray-700"
        }`}
      >
        {count}
      </span>
    </button>
  );

  if (isLoading)
    return (
      <p className="text-center text-gray-500">Loading your sessions...</p>
    );

  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="gradient-background py-8 -m-8 px-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {user?.role === "ADMIN" ? "All Platform Sessions" : "My Sessions"}
        </h1>
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <TabButton
              tabName="upcoming"
              label="Upcoming"
              count={upcomingSessions.length}
            />
            <TabButton
              tabName="past"
              label="Past"
              count={pastSessions.length}
            />
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === "upcoming" &&
            (upcomingSessions.length > 0 ? (
              upcomingSessions.map(renderSessionCard)
            ) : (
              <EmptyState tab="upcoming" />
            ))}
          {activeTab === "past" &&
            (pastSessions.length > 0 ? (
              pastSessions.map(renderSessionCard)
            ) : (
              <EmptyState tab="past" />
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
