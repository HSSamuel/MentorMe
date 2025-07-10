import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import StatCardSkeleton from "../components/StatCardSkeleton";

// Icon components
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

const mentorTips = [
  "The best mentorships are built on clear, regular communication. Don't be afraid to reach out!",
  "Setting clear goals at the start of a mentorship can lead to a 70% higher success rate.",
  "Remember to provide feedback after each session. It's the fastest way to improve.",
  "Don't be afraid to ask questions! Every expert was once a beginner.",
];

const DashboardPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextSession, setNextSession] = useState<any>(null);
  const [tipOfTheDay, setTipOfTheDay] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthLoading || !user) {
        return;
      }

      setIsLoading(true);
      try {
        let statsPromise, sessionsPromise;

        if (user.role === "ADMIN") {
          statsPromise = apiClient.get("/admin/stats");
        } else if (user.role === "MENTOR") {
          statsPromise = apiClient.get(`/users/mentor/${user.id}/stats`);
          sessionsPromise = apiClient.get("/sessions/mentor");
        } else {
          statsPromise = apiClient.get("/users/mentee/stats");
          sessionsPromise = apiClient.get("/sessions/mentee");
        }

        const responses = await Promise.all(
          [statsPromise, sessionsPromise].filter(Boolean)
        );

        const statsResponse = responses[0];
        const sessionsResponse = responses[1];

        setStats(statsResponse.data);

        if (sessionsResponse?.data?.length > 0) {
          const upcoming = sessionsResponse.data
            .filter((s: any) => new Date(s.date) > new Date())
            .sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          if (upcoming.length > 0) {
            setNextSession(upcoming[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    setTipOfTheDay(mentorTips[Math.floor(Math.random() * mentorTips.length)]);
  }, [user, isAuthLoading]);

  const getAvatarUrl = () => {
    if (!user || !user.profile?.avatarUrl) {
      return `https://ui-avatars.com/api/?name=${
        user?.profile?.name || user?.email || "User"
      }&background=random&color=fff`;
    }
    const url = user.profile.avatarUrl;
    if (url.startsWith("http")) {
      return url;
    }
    return `${apiClient.defaults.baseURL}${url}`.replace("/api", "");
  };

  const StatCard = ({
    title,
    value,
    icon,
    linkTo,
    color,
    isHighlighted = false,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    linkTo?: string;
    color: string;
    isHighlighted?: boolean;
  }) => (
    <div
      className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 flex items-center space-x-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        isHighlighted ? "ring-4 ring-yellow-400" : ""
      }`}
    >
      <div className={`p-4 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {linkTo && (
          <Link
            to={linkTo}
            className="text-sm text-indigo-500 hover:underline mt-1"
          >
            View details &rarr;
          </Link>
        )}
      </div>
    </div>
  );

  const GetStartedGuide = () => (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-8 my-8 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Welcome to MentorMe!
      </h2>
      <p className="text-gray-600 mb-6">
        Let's get you started on your mentorship journey.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          to="/profile/edit"
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all"
        >
          Complete Your Profile
        </Link>
        {user?.role === "MENTOR" && (
          <Link
            to="/availability"
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
          >
            Set Your Availability
          </Link>
        )}
        {user?.role === "MENTEE" && (
          <Link
            to="/mentors"
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
          >
            Find a Mentor
          </Link>
        )}
      </div>
    </div>
  );

  const NextSessionCard = () => (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-8 my-8">
      <h3 className="text-xl font-bold mb-2">Next Upcoming Session</h3>
      <p className="text-lg">
        With{" "}
        {user?.role === "MENTOR"
          ? nextSession.mentee.profile.name
          : nextSession.mentor.profile.name}
      </p>
      <p className="text-2xl font-semibold my-2">
        {new Date(nextSession.date).toLocaleString([], {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>
      <Link
        to="/my-sessions"
        className="mt-4 inline-block px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100"
      >
        View Session Details
      </Link>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={<UsersIcon />}
        linkTo="/admin/users"
        color="bg-gradient-to-br from-blue-400 to-indigo-500"
      />
      <StatCard
        title="Total Mentors"
        value={stats.totalMentors}
        icon={<UsersIcon />}
        color="bg-gradient-to-br from-blue-400 to-indigo-500"
      />
      <StatCard
        title="Total Mentees"
        value={stats.totalMentees}
        icon={<UsersIcon />}
        color="bg-gradient-to-br from-blue-400 to-indigo-500"
      />
      <StatCard
        title="Total Matches"
        value={stats.totalMatches}
        icon={<HandshakeIcon />}
        linkTo="/admin/matches"
        color="bg-gradient-to-br from-green-400 to-blue-500"
      />
      <StatCard
        title="Total Sessions"
        value={stats.totalSessions}
        icon={<CalendarIcon />}
        linkTo="/admin/sessions"
        color="bg-gradient-to-br from-purple-400 to-pink-500"
      />
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<InboxInIcon />}
        linkTo="/admin/matches"
        color="bg-gradient-to-br from-yellow-400 to-orange-500"
        isHighlighted={stats.pendingRequests > 0}
      />
    </div>
  );

  const renderMentorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Your Mentees"
        value={stats.menteeCount}
        icon={<UsersIcon />}
        color="bg-gradient-to-br from-blue-400 to-indigo-500"
      />
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<InboxInIcon />}
        linkTo="/requests"
        color="bg-gradient-to-br from-green-400 to-blue-500"
        isHighlighted={stats.pendingRequests > 0}
      />
      <StatCard
        title="Upcoming Sessions"
        value={stats.upcomingSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
        color="bg-gradient-to-br from-purple-400 to-pink-500"
      />
      <StatCard
        title="Completed Sessions"
        value={stats.completedSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
        color="bg-gradient-to-br from-purple-400 to-pink-500"
      />
      <StatCard
        title="Average Rating"
        value={`${stats.averageRating.toFixed(1)} ★`}
        icon={<HandshakeIcon />}
        color="bg-gradient-to-br from-yellow-400 to-orange-500"
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
        color="bg-gradient-to-br from-blue-400 to-indigo-500"
      />
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<InboxInIcon />}
        linkTo="/my-requests"
        color="bg-gradient-to-br from-green-400 to-blue-500"
      />
      <StatCard
        title="Upcoming Sessions"
        value={stats.upcomingSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
        color="bg-gradient-to-br from-purple-400 to-pink-500"
      />
      <StatCard
        title="Completed Sessions"
        value={stats.completedSessions}
        icon={<CalendarIcon />}
        linkTo="/my-sessions"
        color="bg-gradient-to-br from-purple-400 to-pink-500"
      />
    </div>
  );

  const renderLoading = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
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

  const formatRole = (role: string) => {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isAuthLoading ? (
        renderLoading()
      ) : user ? (
        <>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {isLoading && renderLoading()}{" "}
                <span className="animate-rolling-color">
                  {user.profile?.name || user.email.split("@")[0]}!
                </span>
              </h1>

              {user.role && (
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                  You are logged in as a {formatRole(user.role)}
                </span>
              )}

              <p className="text-gray-600 mt-2">
                Here's a summary of your activity on the platform.
              </p>
            </div>
            <img
              src={getAvatarUrl()}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-white/50"
            />
          </div>

          {isLoading && !stats ? renderLoading() : null}
          {!isLoading && !stats && !isAuthLoading ? renderError() : null}

          {!isLoading &&
            stats &&
            stats.menteeCount === 0 &&
            stats.pendingRequests === 0 &&
            stats.upcomingSessions === 0 && <GetStartedGuide />}

          {!isLoading && nextSession && <NextSessionCard />}

          {!isLoading && stats && (
            <div className="mt-8">
              {user.role === "ADMIN" && renderAdminDashboard()}
              {user.role === "MENTOR" && renderMentorDashboard()}
              {user.role === "MENTEE" && renderMenteeDashboard()}
            </div>
          )}

          <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <h4 className="font-semibold text-gray-600">
              Mentor Tip of the Day
            </h4>
            <p className="text-gray-800 italic">"{tipOfTheDay}"</p>
          </div>
        </>
      ) : (
        renderError()
      )}
    </div>
  );
};

export default DashboardPage;
