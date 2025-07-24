import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Bell,
  BarChart2,
} from "lucide-react";
import AdminChart from "../components/AdminChart"; // We will create this component next

// A reusable component for the statistic cards
const StatCard = ({ icon, title, value, color }) => (
  <div className={`p-6 rounded-xl shadow-lg ${color}`}>
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-white bg-opacity-30">{icon}</div>
      <div className="ml-4">
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/admin/dashboard");
        setDashboardData(response.data);
      } catch (err) {
        setError("Failed to fetch dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading)
    return <p className="p-8 text-center">Loading Admin Dashboard...</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!dashboardData)
    return <p className="p-8 text-center">No data available.</p>;

  const { stats, charts, recentActivity } = dashboardData;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Admin Dashboard
      </h1>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 mb-8">
        <StatCard
          icon={<Users size={32} className="text-white" />}
          title="Total Users"
          value={stats.totalUsers}
          color="bg-gradient-to-tr from-blue-500 to-blue-400"
        />
        <StatCard
          icon={<UserCheck size={32} className="text-white" />}
          title="Total Mentors"
          value={stats.totalMentors}
          color="bg-gradient-to-tr from-teal-500 to-teal-400"
        />
        <StatCard
          icon={<UserCheck size={32} className="text-white" />}
          title="Total Mentees"
          value={stats.totalMentees}
          color="bg-gradient-to-tr from-green-500 to-green-400"
        />
        <StatCard
          icon={<CheckCircle size={32} className="text-white" />}
          title="Active Matches"
          value={stats.totalMatches}
          color="bg-gradient-to-tr from-purple-500 to-purple-400"
        />
        <StatCard
          icon={<Clock size={32} className="text-white" />}
          title="Total Sessions"
          value={stats.totalSessions}
          color="bg-gradient-to-tr from-pink-500 to-pink-400"
        />
        <StatCard
          icon={<Bell size={32} className="text-white" />}
          title="Pending Requests"
          value={stats.pendingRequests}
          color="bg-gradient-to-tr from-yellow-500 to-yellow-400"
        />
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            New Users (Last 12 Months)
          </h2>
          <AdminChart type="bar" data={charts.users} label="New Users" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Sessions Held (Last 12 Months)
          </h2>
          <AdminChart type="line" data={charts.sessions} label="Sessions" />
        </div>
      </div>

      {/* --- Recent Activity --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Recent Activity
        </h2>
        <ul className="divide-y dark:divide-gray-700">
          {recentActivity.map((activity) => (
            <li key={activity.data.id} className="py-3">
              {activity.type === "NEW_USER" && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">
                    {activity.data.profile.name}
                  </span>{" "}
                  joined as a new {activity.data.role.toLowerCase()}.
                </p>
              )}
              {activity.type === "NEW_MATCH" && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  A new mentorship started between{" "}
                  <span className="font-semibold">
                    {activity.data.mentor.profile.name}
                  </span>{" "}
                  (Mentor) and{" "}
                  <span className="font-semibold">
                    {activity.data.mentee.profile.name}
                  </span>{" "}
                  (Mentee).
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(activity.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
