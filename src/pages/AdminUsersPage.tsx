import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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

// --- Axios API Instance Configuration ---
const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000" // Your local backend URL
    : "https://mentorme-backend-b0u9.onrender.com"; // Your deployed backend URL

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- START: NEW MODAL COMPONENT FOR EDITING USER ROLES ---
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Edit Role for {user.profile.name}
        </h2>
        <div className="flex flex-col">
          <label
            htmlFor="role-select"
            className="mb-2 font-semibold text-gray-700"
          >
            User Role
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MENTOR">MENTOR</option>
            <option value="MENTEE">MENTEE</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
// --- END: NEW MODAL COMPONENT ---

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);

  // --- START: NEW STATE FOR THE EDIT MODAL ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("MENTEE");
  // --- END: NEW STATE ---

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/users");
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

  // --- START: NEW HANDLERS FOR THE EDIT MODAL ---
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
      const response = await api.put(`/api/admin/users/${userToEdit.id}/role`, {
        role: selectedRole,
      });

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
  // --- END: NEW HANDLERS ---

  if (loading) {
    return <div className="text-center p-10">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-600 bg-red-100 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">
                Name
              </th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">
                Email
              </th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">
                Role
              </th>
              <th className="text-center py-3 px-4 uppercase font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 border-b border-gray-200"
                >
                  <td className="py-3 px-4">{user.profile?.name || "N/A"}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-indigo-200 text-indigo-800"
                          : user.role === "MENTOR"
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="text-red-600 hover:underline"
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
          <strong>{userToAction?.profile?.name || userToAction?.email}</strong>?
          This action cannot be undone.
        </p>
      </ConfirmationModal>

      {/* --- ADDED: Render the new EditUserModal --- */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleUpdateRole}
        user={userToEdit}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />
    </div>
  );
};

export default AdminUsersPage;
