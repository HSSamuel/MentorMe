import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import AssignMentorModal from "../components/AssignMentorModal";
import toast from "react-hot-toast";

const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/admin/users");
        setUsers(response.data);
        setFilteredUsers(response.data);
        setMentors(response.data.filter((user: any) => user.role === "MENTOR"));
      } catch (err) {
        setError("Failed to fetch users.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const result = users.filter(
      (user) =>
        (user.profile?.name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) || user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(result);
  }, [searchQuery, users]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/role`, {
        role: newRole,
      });
      // Update the user in the main list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: response.data.role } : user
        )
      );
      toast.success("User role updated!");
    } catch (err) {
      toast.error("Failed to update role.");
      console.error(err);
    }
  };

  const handleOpenModal = (mentee: any) => {
    setSelectedMentee(mentee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMentee(null);
  };

  const handleAssignMentor = async (mentorId: string) => {
    if (!selectedMentee) return;
    try {
      await apiClient.post("/admin/assign", {
        menteeId: selectedMentee.id,
        mentorId,
      });
      toast.success("Mentor assigned successfully!");
      handleCloseModal();
    } catch (err) {
      toast.error("Failed to assign mentor.");
      console.error(err);
    }
  };

  if (isLoading)
    return <p className="text-center text-gray-500">Loading users...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Users</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-grow">
                <p className="text-lg font-semibold text-gray-800">
                  {user.profile?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="MENTEE">Mentee</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {user.role === "MENTEE" && (
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Assign Mentor
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && selectedMentee && (
        <AssignMentorModal
          mentors={mentors}
          onAssign={handleAssignMentor}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
