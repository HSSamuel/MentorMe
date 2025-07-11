import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
  let specificClasses = "";

  switch (status) {
    case "PENDING":
      specificClasses = "bg-yellow-100 text-yellow-800";
      break;
    case "ACCEPTED":
      specificClasses = "bg-green-100 text-green-800";
      break;
    case "REJECTED":
      specificClasses = "bg-red-100 text-red-800";
      break;
    default:
      specificClasses = "bg-gray-100 text-gray-800";
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

  const getAvatarUrl = (mentee: any) => {
    const avatarUrl = mentee.profile?.avatarUrl;
    if (avatarUrl) {
      if (avatarUrl.startsWith("http")) {
        return avatarUrl;
      }
      return `${apiClient.defaults.baseURL}${avatarUrl}`.replace("/api", "");
    }
    return `https://ui-avatars.com/api/?name=${
      mentee.profile?.name || "M"
    }&background=random&color=fff`;
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 py-10">
        Loading incoming requests...
      </p>
    );
  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;

  return (
    <div className="gradient-background py-8 -m-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Incoming Mentorship Requests
        </h1>
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={getAvatarUrl(req.mentee)}
                        alt={req.mentee.profile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {req.mentee.profile.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Requested on{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="space-y-4 text-sm">
                    <p className="text-gray-700">
                      <strong className="font-medium text-gray-900">
                        Bio:
                      </strong>{" "}
                      {req.mentee.profile.bio}
                    </p>
                    <p className="text-gray-700">
                      <strong className="font-medium text-gray-900">
                        Goals:
                      </strong>{" "}
                      {req.mentee.profile.goals}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 px-5 py-3">
                  {req.status === "PENDING" && (
                    <div className="flex justify-end gap-3">
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
                  {req.status === "ACCEPTED" && (
                    <div className="flex justify-end">
                      <Link
                        to="/messages"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Chat
                      </Link>
                    </div>
                  )}
                  {req.status === "REJECTED" && (
                    <p className="text-sm text-center text-red-700 font-medium">
                      Request Rejected
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-md">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <svg
                className="h-12 w-12 text-blue-500"
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
            <h3 className="text-xl font-semibold text-gray-800">
              No Incoming Requests
            </h3>
            <p className="text-gray-500 mt-2 mb-8">
              You don't have any pending mentorship requests right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorRequestsPage;
