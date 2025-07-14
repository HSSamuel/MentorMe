import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import GoalManagement from "../components/GoalManagement";

const MyMentorsPage = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        // FIX: Use the correct endpoint and filter for accepted requests
        const response = await apiClient.get("/requests/sent");
        const acceptedMatches = response.data.filter(
          (req: any) => req.status === "ACCEPTED"
        );
        setMatches(acceptedMatches);

        // Automatically select the first mentor if the list is not empty
        if (acceptedMatches.length > 0) {
          setSelectedMatch(acceptedMatches[0]);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (isLoading)
    return <p className="text-center text-gray-500">Loading your mentors...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        My Mentors
      </h1>
      {matches.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mentor List Sidebar */}
          <aside className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {matches.map((match) => (
                  <li key={match.id}>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedMatch?.id === match.id
                          ? "bg-blue-50 dark:bg-blue-900/50"
                          : ""
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          selectedMatch?.id === match.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {match.mentor.profile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Matched on{" "}
                        {new Date(match.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Selected Mentor Details */}
          <main className="flex-1">
            {selectedMatch ? (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedMatch.mentor.profile.name}
                  </h2>
                  <Link
                    to={`/book-session/${selectedMatch.mentor.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book a Session
                  </Link>
                </div>
                {/* Goal Management Component will go here */}
                <GoalManagement mentorshipId={selectedMatch.id} />
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Select a mentor to see details.
              </p>
            )}
          </main>
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            No Active Mentors
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            You have no active mentorships. Find a mentor to get started!
          </p>
          <Link
            to="/mentors"
            className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Find a Mentor
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyMentorsPage;
