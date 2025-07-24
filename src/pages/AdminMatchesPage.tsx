import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";
import AssignMentorModal from "../components/AssignMentorModal";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

// --- [NEW] Interfaces for modals and data ---
interface Match {
  id: string;
  status: string;
  createdAt: string;
  mentor: { profile?: { name?: string } };
  mentee: { profile?: { name?: string } };
}

interface ModalState {
  isOpen: boolean;
  match: Match | null;
}

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

// --- [NEW] Reusable Confirmation Modal ---
const ConfirmationModal = ({
  modalState,
  onClose,
  onConfirm,
  title,
  children,
}) => {
  if (!modalState.isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div>{children}</div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- [NEW] Modal for Editing Request Status ---
const EditRequestModal = ({ modalState, onClose, onSave }) => {
  const [newStatus, setNewStatus] = useState(modalState.match?.status);
  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Request Status
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Change the status for the request between{" "}
          <strong>{modalState.match.mentor.profile.name}</strong> and{" "}
          <strong>{modalState.match.mentee.profile.name}</strong>.
        </p>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="PENDING">PENDING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(modalState.match.id, newStatus)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminMatchesPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // --- [NEW] State for confirmation modals ---
  const [deleteModalState, setDeleteModalState] = useState<ModalState>({
    isOpen: false,
    match: null,
  });
  const [editModalState, setEditModalState] = useState<ModalState>({
    isOpen: false,
    match: null,
  });

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/matches");
      setMatches(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch matches.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // --- [NEW] Handler functions for modal actions ---
  const handleDeleteRequest = async () => {
    if (!deleteModalState.match) return;
    try {
      await apiClient.delete(`/admin/requests/${deleteModalState.match.id}`);
      toast.success("Request deleted successfully.");
      fetchMatches(); // Refresh the list
    } catch (err) {
      toast.error("Failed to delete request.");
    } finally {
      setDeleteModalState({ isOpen: false, match: null });
    }
  };

  const handleUpdateRequest = async (matchId: string, status: string) => {
    try {
      await apiClient.put(`/admin/requests/${matchId}/status`, { status });
      toast.success("Request status updated successfully.");
      fetchMatches(); // Refresh the list
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setEditModalState({ isOpen: false, match: null });
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading all matches...
      </p>
    );
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center sm:text-left">
          All Mentorship Matches
        </h1>
        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
        >
          <PlusCircle size={20} />
          Create New Match
        </button>
      </div>

      {matches.length > 0 ? (
        <div className="bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 dark:from-blue-900/50 dark:via-teal-900/50 dark:to-cyan-900/50 rounded-xl shadow-2xl p-4">
          <ul className="space-y-4">
            {matches.map((match) => (
              <li
                key={match.id}
                className="p-6 bg-white/70 dark:bg-gray-800/70 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {match.mentor.profile?.name || "N/A"}
                    </span>{" "}
                    (Mentor) &harr;{" "}
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {match.mentee.profile?.name || "N/A"}
                    </span>{" "}
                    (Mentee)
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Requested on:{" "}
                    {new Date(match.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* --- [ENHANCED] Action buttons for PENDING requests --- */}
                <div className="flex items-center gap-2">
                  {match.status === "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          setEditModalState({ isOpen: true, match })
                        }
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit
                          size={16}
                          className="text-gray-600 dark:text-gray-300"
                        />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModalState({ isOpen: true, match })
                        }
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </>
                  )}
                  <StatusBadge status={match.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            No Matches Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            There are no mentorship requests or matches in the system yet.
          </p>
        </div>
      )}

      <AssignMentorModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onMatchCreated={fetchMatches}
      />

      {/* --- [NEW] Render the modals --- */}
      <ConfirmationModal
        modalState={deleteModalState}
        onClose={() => setDeleteModalState({ isOpen: false, match: null })}
        onConfirm={handleDeleteRequest}
        title="Confirm Deletion"
      >
        <p>
          Are you sure you want to delete this pending request? This action
          cannot be undone.
        </p>
      </ConfirmationModal>

      <EditRequestModal
        modalState={editModalState}
        onClose={() => setEditModalState({ isOpen: false, match: null })}
        onSave={handleUpdateRequest}
      />
    </div>
  );
};

export default AdminMatchesPage;
