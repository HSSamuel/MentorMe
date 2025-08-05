import React, { useState, useEffect, useMemo, useCallback } from "react";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
  Column,
} from "react-table";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Search,
  Edit,
  Trash2,
  User as UserIcon,
  Shield,
  Award,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";

// --- Types ---
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
  createdAt: string;
  lastSeen: string;
  profile: Profile;
}

// --- NEW: Spinner Component ---
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const roleStyles = {
  MENTEE: {
    icon: <UserIcon size={14} className="mr-1.5" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  MENTOR: {
    icon: <Award size={14} className="mr-1.5" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  ADMIN: {
    icon: <Shield size={14} className="mr-1.5" />,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
};

// --- Reusable Modal Components ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  isDeleting: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="text-gray-600 dark:text-gray-300">{children}</div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex justify-center items-center w-28 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
          >
            {isDeleting ? <Spinner /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditUserModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  selectedRole,
  setSelectedRole,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  user: User | null;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  isSaving: boolean;
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Role for {user.profile?.name || user.email}
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
            className="p-3 border rounded-lg dark:bg-gray-700"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MENTOR">MENTOR</option>
            <option value="MENTEE">MENTEE</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex justify-center items-center w-36 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("MENTEE");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!loading) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await apiClient.get("/admin/users?limit=1000");
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      setError(null);
      if (!loading) {
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
  }, [loading]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    setIsDeleting(true);
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
      setIsDeleting(false);
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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        Header: "User",
        accessor: (row) => row.profile?.name || row.email,
        Cell: ({ row }) => (
          <div className="flex items-center">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={
                row.original.profile?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  row.original.profile?.name || row.original.email
                )}`
              }
              alt=""
            />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {row.original.profile?.name || "N/A"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        Header: "Role",
        accessor: "role",
        Cell: ({ value }) => {
          const roleInfo = roleStyles[value] || roleStyles.MENTEE;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}
            >
              {roleInfo.icon}
              {value}
            </span>
          );
        },
      },
      {
        Header: "Date Joined",
        accessor: "createdAt",
        Cell: ({ value }) => format(new Date(value), "MMM d, yyyy"),
      },
      {
        Header: "Actions",
        accessor: "id",
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/mentor/${row.original.id}`}
              target="_blank"
              className="p-1.5 text-gray-500 hover:text-blue-600"
              title="View Profile"
            >
              <Eye size={16} />
            </Link>
            <button
              onClick={() => openEditModal(row.original)}
              className="p-1.5 text-gray-500 hover:text-purple-600"
              title="Edit Role"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => openDeleteModal(row.original)}
              className="p-1.5 text-gray-500 hover:text-red-600"
              title="Delete User"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable(
    { columns, data: users, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setGlobalFilter(searchTerm);
  }, [searchTerm, setGlobalFilter]);

  if (loading) return <div className="p-10 text-center">Loading users...</div>;
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <button
            onClick={() => fetchUsers()}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* --- UPDATE: Added dark mode classes and corrected icon positioning --- */}
        <div className="mb-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full p-3 pl-12 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                {headerGroups.map((headerGroup) => {
                  const { key, ...restHeaderGroupProps } =
                    headerGroup.getHeaderGroupProps();
                  return (
                    <tr key={key} {...restHeaderGroupProps}>
                      {headerGroup.headers.map((column) => {
                        const { key, ...restColumnProps } =
                          column.getHeaderProps(column.getSortByToggleProps());
                        return (
                          <th
                            key={key}
                            {...restColumnProps}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          >
                            {column.render("Header")}
                            <span className="ml-1">
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? "🔽"
                                  : "🔼"
                                : ""}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody
                {...getTableBodyProps()}
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                {page.map((row) => {
                  prepareRow(row);
                  const { key, ...restRowProps } = row.getRowProps();
                  return (
                    <tr
                      key={key}
                      {...restRowProps}
                      className="hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {row.cells.map((cell) => {
                        const { key, ...restCellProps } = cell.getCellProps();
                        return (
                          <td
                            key={key}
                            {...restCellProps}
                            className="px-6 py-4 whitespace-nowrap text-sm"
                          >
                            {cell.render("Cell")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {page.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">No Users Found</h3>
              <p className="text-gray-500 mt-2">
                Your search did not match any users.
              </p>
            </div>
          )}
        </div>

        <div className="py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            Page <strong>{pageIndex + 1}</strong> of{" "}
            <strong>{pageOptions.length}</strong>
          </span>
          <div className="flex gap-x-2 items-center">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
              className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {[10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border"
              >
                First
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className="relative inline-flex items-center px-2 py-2 border"
              >
                Prev
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 border"
              >
                Next
              </button>
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border"
              >
                Last
              </button>
            </nav>
          </div>
        </div>

        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
          title="Confirm User Deletion"
          isDeleting={isDeleting}
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
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};

export default AdminUsersPage;
