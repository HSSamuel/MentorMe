import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";

// Define the structure of your User object to match the backend response
interface Profile {
  name: string;
  bio?: string;
  avatarUrl?: string;
}

// Define a specific type for user roles for better type safety
type UserRole = "ADMIN" | "MENTOR" | "MENTEE";

interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile;
}

// --- Reusable Modal Component for Deleting Users ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="text-gray-600 dark:text-gray-300">{children}</div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Modal Component for Editing User Roles ---
const EditUserModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  selectedRole,
  setSelectedRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user: User | null;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Role for {user.profile.name}
        </h2>
        <div className="flex flex-col">
          <label
            htmlFor="role-select"
            className="mb-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            User Role
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MENTOR">MENTOR</option>
            <option value="MENTEE">MENTEE</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("MENTEE");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/users");
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Unauthorized: Please log in again.");
      } else {
        setError("Failed to fetch users. Please try again later.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const results = users.filter(
      (user) =>
        (user.profile?.name?.toLowerCase() || "n/a").includes(
          searchTerm.toLowerCase()
        ) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const openDeleteModal = (user: User) => {
    setUserToAction(user);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToAction(null);
    setIsModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!userToAction) return;
    console.log(`Simulating deletion of user: ${userToAction.id}`);
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToAction.id));
    closeDeleteModal();
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setSelectedRole(user.role);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setUserToEdit(null);
  };

  const handleUpdateRole = async () => {
    if (!userToEdit) return;

    try {
      const response = await apiClient.put(
        `/admin/users/${userToEdit.id}/role`,
        {
          role: selectedRole,
        }
      );

      const updatedUser = response.data;

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );

      closeEditModal();
    } catch (err) {
      setError(`Failed to update role for ${userToEdit.profile.name}.`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/50 min-h-screen">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          User Management
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                  Email
                </th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                  Role
                </th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="py-3 px-4">{user.profile?.name || "N/A"}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : user.role === "MENTOR"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-purple-600 dark:text-purple-400 hover:underline mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
          title="Confirm User Deletion"
        >
          <p>
            Are you sure you want to delete this user:{" "}
            <strong>
              {userToAction?.profile?.name || userToAction?.email}
            </strong>
            ? This action cannot be undone.
          </p>
        </ConfirmationModal>

        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={handleUpdateRole}
          user={userToEdit}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />
      </div>
    </div>
  );
};

export default AdminUsersPage;
