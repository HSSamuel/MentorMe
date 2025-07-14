import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";

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

const MyRequestsPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/requests/sent");
        setRequests(response.data);
      } catch (error) {
        console.error("Failed to fetch sent requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (isLoading) {
    return (
      <p className="text-center text-gray-500">Loading your requests...</p>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        My Sent Requests
      </h1>
      {requests.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((req) => (
              <li
                key={req.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between"
              >
                <div className="mb-4 sm:mb-0">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Mentor: {req.mentor.profile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Requested on: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={req.status} />
                  {req.status === "ACCEPTED" && (
                    <Link
                      to={`/book-session/${req.mentorId}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Session
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            No Requests Sent
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            You haven't requested mentorship from anyone yet.
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

export default MyRequestsPage;
