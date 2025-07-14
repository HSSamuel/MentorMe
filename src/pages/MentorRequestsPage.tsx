import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
  let specificClasses = "";

  switch (status) {
    case "PENDING":
      specificClasses =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200";
      break;
    case "ACCEPTED":
      specificClasses =
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      break;
    case "REJECTED":
      specificClasses =
        "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
      break;
    default:
      specificClasses =
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }

  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

const MentorRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPageData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [requestsRes, statsRes] = await Promise.all([
          apiClient.get("/requests/received"),
          apiClient.get(`/users/mentor/${user.id}/stats`),
        ]);
        setRequests(requestsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError("Failed to load mentorship requests.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [user]);

  const handleUpdateRequest = async (
    requestId: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    try {
      const response = await apiClient.put(`/requests/${requestId}`, {
        status,
      });
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: response.data.status } : req
        )
      );
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()} request.`);
      console.error(err);
    }
  };

  const getAvatarUrl = (profile: any) => {
    if (profile?.avatarUrl) {
      return profile.avatarUrl.startsWith("http")
        ? profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || "User"
    )}&background=random&color=fff`;
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 py-10">
        Loading incoming requests...
      </p>
    );
  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;

  return (
    <div className="py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Incoming Mentorship Requests
        </h1>
        {requests.length > 0 ? (
          <div className="space-y-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    {/* Updated section with avatar */}
                    <div className="flex items-center mb-4 sm:mb-0">
                      <img
                        src={getAvatarUrl(req.mentee.profile)}
                        alt={`Avatar of ${req.mentee.profile.name}`}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {req.mentee.profile.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requested on{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Bio:</strong> {req.mentee.profile.bio}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Goals:</strong> {req.mentee.profile.goals}
                    </p>
                  </div>
                </div>

                {req.status === "PENDING" && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 grid grid-cols-2 sm:flex sm:justify-end gap-3">
                    <button
                      onClick={() => handleUpdateRequest(req.id, "REJECTED")}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(req.id, "ACCEPTED")}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-md">
            <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
              <svg
                className="h-12 w-12 text-blue-500 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              No Incoming Requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
              You don't have any pending mentorship requests right now.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {stats && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-6 rounded-lg text-left shadow-lg">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3">
                    Your Impact
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-800 dark:text-indigo-300">
                        Total Mentees Helped
                      </p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-white">
                        {stats.menteeCount}
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-800 dark:text-indigo-300">
                        Sessions Completed
                      </p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-white">
                        {stats.completedSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 p-6 rounded-lg text-left shadow-lg">
                <h4 className="font-bold text-green-900 dark:text-green-200 mb-3">
                  How to Attract More Mentees
                </h4>
                <ul className="space-y-2 text-green-800 dark:text-green-300 text-sm list-disc list-inside">
                  <li>
                    Make sure your profile is fully complete and up-to-date.
                  </li>
                  <li>
                    Add a clear and friendly bio that explains what you can help
                    with.
                  </li>
                  <li>
                    Set your availability to let mentees know when you're free.
                  </li>
                </ul>
                <div className="mt-4">
                  <Link
                    to="/profile/edit"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline font-semibold"
                  >
                    Update Your Profile &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorRequestsPage;
