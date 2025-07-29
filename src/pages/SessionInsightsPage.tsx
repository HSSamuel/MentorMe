import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, ListChecks, ArrowLeft, Tag } from "lucide-react"; // Added Tag icon

// --- Helper Icons ---
const SummaryIcon = () => (
  <svg
    className="w-6 h-6 text-indigo-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const ActionItemsIcon = () => (
  <svg
    className="w-6 h-6 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);
const InsightsNotFoundIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

// --- Skeleton Loader for a better UX ---
const InsightsSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700/50 p-6 rounded-xl">
      <div className="h-7 w-1/2 bg-gray-300 dark:bg-gray-600 rounded-md mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-4/6"></div>
      </div>
    </div>
    <div className="bg-gray-200 dark:bg-gray-700/50 p-6 rounded-xl">
      <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-md mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-5/6"></div>
      </div>
    </div>
  </div>
);

// --- [UPDATED] Interface to support both 1-on-1 and group sessions ---
interface SessionData {
  id: string;
  date: string;
  mentor: { profile?: { name?: string } };
  mentee: { profile?: { name?: string } } | null; // Mentee can be null
  isGroupSession?: boolean; // New field for group sessions
  topic?: string; // New field for group session topic
  insights: {
    summary: string;
    keyTopics: string[];
    actionItems: string[];
  } | null;
}

const SessionInsightsPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!sessionId) {
        setError("Session ID is missing.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiClient.get(`/sessions/${sessionId}/insights`);
        setSession(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(
            "Session not found or insights have not been generated for this session yet."
          );
        } else {
          setError("Failed to fetch session insights. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [sessionId]);

  const renderContent = () => {
    if (isLoading) {
      return <InsightsSkeletonLoader />;
    }

    if (error || !session) {
      return (
        <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-md border border-blue-200 dark:border-blue-800 text-center">
          <div className="flex justify-center mb-4">
            <InsightsNotFoundIcon />
          </div>
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300">
            Insights Not Available
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || "Could not find the requested session."}
          </p>
        </div>
      );
    }

    if (!session.insights) {
      return (
        <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-md border border-blue-200 dark:border-blue-800 text-center">
          <div className="flex justify-center mb-4">
            <InsightsNotFoundIcon />
          </div>
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300">
            Insights Not Generated Yet
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You can generate insights from the video call page after a session
            is complete.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Session Summary
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {session.insights.summary}
          </p>
        </div>

        {/* --- [THIS IS THE NEW SECTION] --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
              <Tag className="w-6 h-6 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Key Topics
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.insights.keyTopics?.map((topic, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-purple-900/70 dark:text-purple-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        {/* --- END OF NEW SECTION --- */}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
              <ListChecks className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Action Items
            </h2>
          </div>
          {session.insights.actionItems.length > 0 ? (
            <ul className="space-y-3">
              {session.insights.actionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No specific action items were identified in this session.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Link
          to="/my-sessions"
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
        >
          <ArrowLeft size={20} />
          Back to My Sessions
        </Link>
        <div className="mt-4">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            AI-Powered Session Insights
          </h1>
          {!isLoading &&
            session &&
            // --- FIX: Conditionally render header for group or 1-on-1 sessions ---
            (session.isGroupSession ? (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                A summary of your Mentoring Circle on{" "}
                <strong>{session.topic}</strong>, held on{" "}
                {new Date(session.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            ) : (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                A summary of your session with{" "}
                <strong>{session.mentor.profile?.name || "N/A"}</strong> &{" "}
                <strong>{session.mentee?.profile?.name || "N/A"}</strong> on{" "}
                {new Date(session.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            ))}
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default SessionInsightsPage;
