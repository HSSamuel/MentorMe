import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";

// Icon components (Heroicons, embedded as SVGs for simplicity)
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 13a5.995 5.995 0 01-3 5.197"
    />
  </svg>
);

const HandshakeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.433 13.646l2.147-6.15m0 0l-2.147 6.15m6.211 3.243l-2.147-6.15M12 5.882l2.147 6.15"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const InboxInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let response;
        if (user.role === "ADMIN") {
          response = await apiClient.get("/admin/stats");
        } else if (user.role === "MENTOR") {
          response = await apiClient.get(`/users/mentor/${user.id}/stats`);
        } else {
          response = await apiClient.get("/users/mentee/stats");
        }
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const StatCard = ({
    title,
    value,
    icon,
    linkTo,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    linkTo?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-6">
      <div className="p-4 bg-blue-500 rounded-full">{icon}</div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {linkTo && (
          <Link
            to={linkTo}
            className="text-sm text-blue-500 hover:underline mt-1"
          >
            View details &rarr;
          </Link>
        )}
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={<UsersIcon />}
        linkTo="/admin/users"
      />
      <StatCard
        title="Total Matches"
        value={stats.totalMatches}
        icon={<HandshakeIcon />}
        linkTo="/admin/matches"
      />
      <StatCard
        title="Total Sessions"
        value={stats.totalSessions}
        icon={<CalendarIcon />}
        linkTo="/admin/sessions"
      />
    </div>
  );

  const renderMentorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Your Mentees"
        value={stats.menteeCount}
        icon={<UsersIcon />}
      />
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<InboxInIcon />}
        linkTo="/requests"
      />
      <StatCard
        title="Upcoming Sessions"
        value={stats.upcomingSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
      />
    </div>
  );

  const renderMenteeDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Your Mentors"
        value={stats.mentorCount}
        icon={<UsersIcon />}
        linkTo="/my-mentors"
      />
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<InboxInIcon />}
        linkTo="/my-requests"
      />
      <StatCard
        title="Upcoming Sessions"
        value={stats.upcomingSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
      />
    </div>
  );

  const renderLoading = () => (
    <div className="text-center py-10">
      <p className="text-gray-500">Loading dashboard data...</p>
    </div>
  );

  const renderError = () => (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">
        Could not load dashboard data. Please try again later.
      </span>
    </div>
  );

  // Helper function to format the role string for display
  const formatRole = (role: string) => {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.profile?.name || user?.email.split("@")[0]}!
      </h1>

      {/* Role indicator badge */}
      {user?.role && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full mb-6">
          You are logged in as a {formatRole(user.role)}
        </span>
      )}

      <p className="text-gray-600 mb-8">
        Here's a summary of your activity on the platform.
      </p>

      {isLoading && renderLoading()}
      {!isLoading && !stats && renderError()}
      {!isLoading && stats && (
        <>
          {user?.role === "ADMIN" && renderAdminDashboard()}
          {user?.role === "MENTOR" && renderMentorDashboard()}
          {user?.role === "MENTEE" && renderMenteeDashboard()}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
