import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import {
  Star,
  Search,
  Eye,
  Trash2, // Import Trash2 icon for delete
  Info, // Import Info icon for details
  X,
} from "lucide-react";
import io from "socket.io-client";
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
  Column,
} from "react-table";
import toast from "react-hot-toast";

// --- Session interface ---
interface Session {
  id: string;
  mentor: { id: string; profile?: { name?: string } };
  mentee: { id: string; profile?: { name?: string } } | null;
  date: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  rating?: number;
  feedback?: string;
  isGroupSession?: boolean;
  topic?: string;
  participants?: any[];
  maxParticipants?: number;
  totalCount?: number;
}

// --- Reusable Confirmation Modal ---
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
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
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Feedback Modal (unchanged) ---
const ViewFeedbackModal = ({
  isOpen,
  onClose,
  session,
}: {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}) => {
  if (!isOpen || !session) return null;

  const StarRatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-6 h-6 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Session Feedback
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Rating Provided:
            </p>
            <div className="mt-1">
              {session.rating ? (
                <StarRatingDisplay rating={session.rating} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No rating was given.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Comments:
            </p>
            <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md whitespace-pre-wrap">
              {session.feedback || "No comments were provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminSessionsPage = () => {
  const { token } = useAuth();
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  // --- NEW: State for delete confirmation modal ---
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/sessions");
      if (Array.isArray(response.data.sessions)) {
        const processedSessions = response.data.sessions.map((s: any) => ({
          ...s,
          status: new Date(s.date) < new Date() ? "COMPLETED" : "UPCOMING",
        }));
        setAllSessions(processedSessions);
      }
      setTotalCount(response.data.totalCount);
    } catch (err) {
      setError("Failed to fetch sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (token) {
      const socket = io(import.meta.env.VITE_API_BASE_URL!, {
        auth: { token },
      });

      const handleSessionUpdate = (updatedSession: Session) => {
        const processedSession = {
          ...updatedSession,
          status:
            new Date(updatedSession.date) < new Date()
              ? "COMPLETED"
              : "UPCOMING",
        };
        setAllSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === processedSession.id ? processedSession : session
          )
        );
      };

      const handleNewSession = (newSession: Session) => {
        const processedSession = {
          ...newSession,
          status:
            new Date(newSession.date) < new Date() ? "COMPLETED" : "UPCOMING",
        };
        setAllSessions((prevSessions) => [processedSession, ...prevSessions]);
        setTotalCount((prev) => prev + 1);
      };

      socket.on("sessionUpdated", handleSessionUpdate);
      socket.on("newSession", handleNewSession);

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const handleViewFeedback = (session: Session) => {
    setSelectedSession(session);
    setFeedbackModalOpen(true);
  };

  // --- NEW: Functions to handle delete modal ---
  const openDeleteModal = (session: Session) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSessionToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await apiClient.delete(`/admin/sessions/${sessionToDelete.id}`);
      setAllSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setTotalCount((prev) => prev - 1);
      toast.success("Session deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete session.");
      console.error(err);
    } finally {
      closeDeleteModal();
    }
  };

  const columns = useMemo<Column<Session>[]>(
    () => [
      {
        Header: "Session Info",
        accessor: "topic",
        Cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 dark:text-white">
              {row.original.isGroupSession
                ? row.original.topic
                : "1-on-1 Session"}
            </span>
            <span className="text-xs text-gray-500">{row.original.id}</span>
          </div>
        ),
      },
      {
        Header: "Mentor",
        accessor: "mentor.profile.name",
        Cell: ({ row }) => {
          if (row.original.mentor && row.original.mentor.id) {
            return (
              <Link
                to={`/mentor/${row.original.mentor.id}`}
                className="text-blue-600 hover:underline"
              >
                {row.original.mentor.profile?.name || "N/A"}
              </Link>
            );
          }
          return <>{row.original.mentor?.profile?.name || "N/A (Invalid)"}</>;
        },
      },
      {
        Header: "Participants",
        accessor: "mentee.profile.name",
        Cell: ({ row }) => {
          if (row.original.isGroupSession) {
            return (
              <div className="flex items-center">
                {row.original.participants?.length || 0} /{" "}
                {row.original.maxParticipants}
              </div>
            );
          }
          if (row.original.mentee && row.original.mentee.id) {
            return (
              <Link
                to={`/mentor/${row.original.mentee.id}`}
                className="text-blue-600 hover:underline"
              >
                {row.original.mentee.profile?.name || "N/A"}
              </Link>
            );
          }
          return <>{row.original.mentee?.profile?.name || "N/A (Invalid)"}</>;
        },
      },
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }) => new Date(value).toLocaleString(),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === "COMPLETED"
                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: "Actions",
        accessor: "id",
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {/* --- UPDATED: New Action Buttons --- */}
            <Link
              to={`/session/${row.original.id}/insights`}
              className="p-1.5 text-gray-500 hover:text-green-600"
              title="View Details"
            >
              <Info size={16} />
            </Link>
            {(row.original.rating || row.original.feedback) && (
              <button
                onClick={() => handleViewFeedback(row.original)}
                className="p-1.5 text-gray-500 hover:text-blue-600"
                title="View Feedback"
              >
                <Eye size={16} />
              </button>
            )}
            <button
              onClick={() => openDeleteModal(row.original)}
              className="p-1.5 text-gray-500 hover:text-red-600"
              title="Delete Session"
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
    {
      columns,
      data: allSessions,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (isLoading)
    return <p className="p-8 text-center">Loading all sessions...</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Sessions ({totalCount})
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          />
        </div>
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
                      const { key, ...restColumnProps } = column.getHeaderProps(
                        column.getSortByToggleProps()
                      );
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
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
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
            <h3 className="text-xl font-semibold">No Sessions Found</h3>
            <p className="text-gray-500 mt-2">
              Your search did not match any sessions.
            </p>
          </div>
        )}
      </div>

      <div className="py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-x-2 items-center">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            Page <span className="font-medium">{pageIndex + 1}</span> of{" "}
            <span className="font-medium">{pageOptions.length}</span>
          </span>
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
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              First
            </button>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Next
            </button>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Last
            </button>
          </nav>
        </div>
      </div>

      <ViewFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        session={selectedSession}
      />
      {/* --- NEW: Delete Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteSession}
        title="Confirm Session Deletion"
      >
        <p>
          Are you sure you want to delete this session? This action cannot be
          undone.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default AdminSessionsPage;
