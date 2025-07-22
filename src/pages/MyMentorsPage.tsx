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
        const response = await apiClient.get("/requests/sent");
        const acceptedMatches = response.data.filter(
          (req: any) => req.status === "ACCEPTED"
        );
        setMatches(acceptedMatches);

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

  // --- [ADDED] Helper function to get avatar URL with a fallback ---
  const getAvatarUrl = (profile: any) => {
    if (profile?.avatarUrl) {
      // Handles both absolute URLs and relative paths from the backend
      return profile.avatarUrl.startsWith("http")
        ? profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    // Fallback to a generated avatar if no URL is present
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || "User"
    )}&background=random&color=fff`;
  };

  if (isLoading)
    return <p className="text-center text-gray-500">Loading your mentors...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
        My Mentors
      </h1>
      {matches.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mentor List Sidebar */}
          <aside className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {matches.map((match) => (
                  <li key={match.id}>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-4 transition-all duration-200 flex items-center ${
                        // --- [MODIFIED] Added flex for avatar alignment ---
                        selectedMatch?.id === match.id
                          ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      {/* --- [ADDED] Avatar in the sidebar list --- */}
                      <img
                        src={getAvatarUrl(match.mentor.profile)}
                        alt={`Avatar of ${match.mentor.profile.name}`}
                        className="w-10 h-10 rounded-full object-cover mr-4"
                      />
                      <div>
                        <p
                          className={`font-semibold ${
                            selectedMatch?.id === match.id
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {match.mentor.profile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Matched on{" "}
                          {new Date(match.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Selected Mentor Details */}
          <main className="flex-1">
            {selectedMatch ? (
              <div className="rounded-xl shadow-2xl p-6 bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 dark:from-purple-900/70 dark:via-blue-900/70 dark:to-cyan-900/70">
                <div className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-600 mb-6">
                  {/* --- [MODIFIED] Added flex container for avatar and name --- */}
                  <div className="flex items-center">
                    {/* --- [ADDED] Avatar in the main details card --- */}
                    <img
                      src={getAvatarUrl(selectedMatch.mentor.profile)}
                      alt={`Avatar of ${selectedMatch.mentor.profile.name}`}
                      className="w-16 h-16 rounded-full object-cover mr-4 ring-2 ring-white/50"
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedMatch.mentor.profile.name}
                    </h2>
                  </div>
                  <Link
                    to={`/book-session/${selectedMatch.mentor.id}`}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Book a Session
                  </Link>
                </div>
                {/* Goal Management Component will now have a styled container */}
                <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-lg">
                  <GoalManagement mentorshipId={selectedMatch.id} />
                </div>
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
