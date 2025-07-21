import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";

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

// Define the structure of the insight data
interface Insight {
  summary: string;
  actionItems: string[];
}

const SessionInsightsPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!sessionId) {
        setError("Session ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/sessions/${sessionId}/insights`);
        setInsight(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(
            "No insights have been generated for this session yet. You can generate them from the video call page after a session."
          );
        } else {
          setError("Failed to fetch session insights. Please try again later.");
        }
        console.error("Error fetching insights:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [sessionId]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-gray-500">Loading insights...</p>;
    }

    if (error) {
      return (
        <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }

    if (!insight) {
      return <p className="text-center text-gray-500">No insights found.</p>;
    }

    return (
      <div className="space-y-8">
        {/* Session Summary Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
              <SummaryIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Session Summary
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {insight.summary}
          </p>
        </div>

        {/* Action Items Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
              <ActionItemsIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Action Items
            </h2>
          </div>
          {insight.actionItems.length > 0 ? (
            <ul className="space-y-3">
              {insight.actionItems.map((item, index) => (
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          AI-Powered Session Insights
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          A summary of your recent mentorship session.
        </p>
      </div>
      {renderContent()}
      <div className="mt-8 text-center">
        <Link
          to="/sessions-list"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to My Sessions
        </Link>
      </div>
    </div>
  );
};

export default SessionInsightsPage;
