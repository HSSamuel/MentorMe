import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";

const AdminSessionsPage = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/admin/sessions");
        setSessions(response.data.sessions);
        setTotalCount(response.data.totalCount);
      } catch (err) {
        setError("Failed to fetch sessions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (isLoading)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading all sessions...
      </p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        All Platform Sessions
      </h1>

      <div className="mb-6">
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold">Total Sessions Held</h2>
          <p className="text-4xl font-bold">{totalCount}</p>
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    <span className="font-bold">
                      {session.mentor.profile?.name || "N/A"}
                    </span>{" "}
                    (Mentor) &amp;{" "}
                    <span className="font-bold">
                      {session.mentee.profile?.name || "N/A"}
                    </span>{" "}
                    (Mentee)
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(session.date).toLocaleString([], {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rating
                    </p>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">
                      {session.rating ? `${session.rating} ★` : "N/A"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            No Sessions Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            There are no completed or upcoming sessions in the system yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSessionsPage;
