import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";

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
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceivedRequests = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/requests/received");
        setRequests(response.data);
      } catch (err) {
        setError("Failed to load mentorship requests.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceivedRequests();
  }, []);

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

  if (isLoading)
    return (
      <p className="text-center text-gray-500">Loading incoming requests...</p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Incoming Mentorship Requests
      </h1>
      {requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">
                      {req.mentee.profile.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Requested on{" "}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <StatusBadge status={req.status} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Bio:</strong> {req.mentee.profile.bio}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Goals:</strong> {req.mentee.profile.goals}
                  </p>
                </div>
              </div>

              {req.status === "PENDING" && (
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
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
        <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800">
            No Incoming Requests
          </h3>
          <p className="text-gray-500 mt-2">
            You don't have any pending mentorship requests right now.
          </p>
        </div>
      )}
    </div>
  );
};

export default MentorRequestsPage;
