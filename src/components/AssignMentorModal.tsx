import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../api/axios";
import { X, Search, User, Award } from "lucide-react";
import toast from "react-hot-toast";

// A simple spinner component
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface User {
  id: string;
  profile: { name?: string; avatarUrl?: string };
}

interface AssignMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

const AssignMentorModal = ({
  isOpen,
  onClose,
  onMatchCreated,
}: AssignMentorModalProps) => {
  const [mentors, setMentors] = useState<User[]>([]);
  const [mentees, setMentees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedMentorId(null);
      setSelectedMenteeId(null);
      setSearchTerm("");
      const fetchUsers = async () => {
        try {
          setLoading(true);
          // --- [THE FIX] ---
          // Fetched mentors and mentees separately and requested a high limit to get all users.
          const [mentorsRes, menteesRes] = await Promise.all([
            apiClient.get("/admin/users?role=MENTOR&limit=1000"),
            apiClient.get("/admin/users?role=MENTEE&limit=1000"),
          ]);
          setMentors(mentorsRes.data.users || []);
          setMentees(menteesRes.data.users || []);
        } catch (err) {
          setError("Failed to fetch users.");
          toast.error("Could not load users for assignment.");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleCreateMatch = async () => {
    if (!selectedMentorId || !selectedMenteeId) {
      toast.error("Please select both a mentor and a mentee.");
      return;
    }
    setIsAssigning(true); // Start loading spinner
    try {
      await apiClient.post("/admin/matches", {
        mentorId: selectedMentorId,
        menteeId: selectedMenteeId,
      });
      toast.success("Mentorship match created successfully!");
      onMatchCreated();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create match.";
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false); // Stop loading spinner
    }
  };

  const filteredMentees = useMemo(
    () =>
      mentees.filter((m) =>
        m.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [mentees, searchTerm]
  );
  const filteredMentors = useMemo(
    () =>
      mentors.filter((m) =>
        m.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [mentors, searchTerm]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-3xl transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create a New Match
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-80 overflow-y-auto p-2">
          {/* Mentees List */}
          <div>
            <h3 className="flex items-center font-semibold mb-2 text-gray-800 dark:text-gray-200">
              <User size={16} className="mr-2 text-green-500" />
              Select a Mentee
            </h3>
            <div className="border dark:border-gray-600 rounded-lg h-full">
              {loading ? (
                <p className="p-4 text-center">Loading...</p>
              ) : (
                filteredMentees.map((mentee) => (
                  <div
                    key={mentee.id}
                    onClick={() => setSelectedMenteeId(mentee.id)}
                    className={`flex items-center p-3 cursor-pointer border-l-4 transition-colors ${
                      selectedMenteeId === mentee.id
                        ? "border-green-500 bg-green-50 dark:bg-green-900/50"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <img
                      src={
                        mentee.profile?.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${mentee.profile?.name}`
                      }
                      alt={mentee.profile?.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <span>{mentee.profile?.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mentors List */}
          <div>
            <h3 className="flex items-center font-semibold mb-2 text-gray-800 dark:text-gray-200">
              <Award size={16} className="mr-2 text-blue-500" />
              Select a Mentor
            </h3>
            <div className="border dark:border-gray-600 rounded-lg h-full">
              {loading ? (
                <p className="p-4 text-center">Loading...</p>
              ) : (
                filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => setSelectedMentorId(mentor.id)}
                    className={`flex items-center p-3 cursor-pointer border-l-4 transition-colors ${
                      selectedMentorId === mentor.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/50"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <img
                      src={
                        mentor.profile?.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${mentor.profile?.name}`
                      }
                      alt={mentor.profile?.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <span>{mentor.profile?.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMatch}
            disabled={!selectedMentorId || !selectedMenteeId || isAssigning}
            className="flex justify-center items-center w-48 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAssigning ? <Spinner /> : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMentorModal;
