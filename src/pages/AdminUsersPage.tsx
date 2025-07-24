import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axios";
import {
  User as UserIcon,
  Shield,
  Trash2,
  Edit,
  Search,
  Award,
  Eye,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

// Define the structure of your User object
interface Profile {
  name: string;
  bio?: string;
  avatarUrl?: string;
}
type UserRole = "ADMIN" | "MENTOR" | "MENTEE";
interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile;
}

const roleStyles = {
  MENTEE: {
    icon: <UserIcon size={14} className="mr-1.5" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    borderColor: "border-green-500",
  },
  MENTOR: {
    icon: <Award size={14} className="mr-1.5" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    borderColor: "border-blue-500",
  },
  ADMIN: {
    icon: <Shield size={14} className="mr-1.5" />,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    borderColor: "border-purple-500",
  },
};

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
  onSave: () => Promise<void>;
  user: User | null;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  if (!isOpen || !user) return null;
  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave();
    // No need to set isSaving back to false, as the modal will close.
  };
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
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex justify-center items-center w-36 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
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
  // --- [NEW] State to handle the refresh button's loading state ---
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    // Determine which loading state to set based on context
    if (!loading) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiClient.get("/admin/users?limit=1000");
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setError(null);
      if (!loading) {
        // Only show toast on manual refresh
        toast.success("User list updated!");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch users.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loading]); // 'loading' differentiates initial load from refresh

  useEffect(() => {
    fetchUsers();
  }, []); // Changed to run only once on initial mount

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
    try {
      await apiClient.delete(`/admin/users/${userToAction.id}`);
      setUsers((prevUsers) =>
        prevUsers.filter((u) => u.id !== userToAction.id)
      );
      toast.success("User deleted successfully.");
    } catch (err) {
      toast.error(`Failed to delete user ${userToAction.profile.name}.`);
      console.error(err);
    } finally {
      closeDeleteModal();
    }
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
        { role: selectedRole }
      );
      const updatedUser = response.data;
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      toast.success("Role updated successfully.");
      closeEditModal();
    } catch (err) {
      toast.error(`Failed to update role for ${userToEdit.profile.name}.`);
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading users...</div>;
  if (error)
    return (
      <div className="p-10 text-center text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-md">
        {error}
      </div>
    );

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto">
        {/* --- [ENHANCED] Header with new Refresh button --- */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <button
            onClick={fetchUsers}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mb-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full p-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const roleInfo = roleStyles[user.role] || roleStyles.MENTEE;
              return (
                <div
                  key={user.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col border-l-4 ${roleInfo.borderColor}`}
                >
                  <div className="p-5 flex-grow">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={
                          user.profile?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.profile?.name || user.email
                          )}&background=random`
                        }
                        alt={user.profile?.name || user.email}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-grow overflow-hidden">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {user.profile?.name || "N/A"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}
                    >
                      {roleInfo.icon}
                      {user.role}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end gap-2">
                    <Link
                      to={`/users/${user.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                    >
                      <Eye size={14} /> View
                    </Link>
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 transition-colors"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                No Users Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Your search did not match any users.
              </p>
            </div>
          )}
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
