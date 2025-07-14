import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import NotificationBell from "./NotificationBell";
import apiClient from "../api/axios";
import logo from "../assets/logo.png";
import { io, Socket } from "socket.io-client"; // Import socket.io-client

// Sun and Moon icons for the toggle button
const SunIcon = () => (
  <svg
    className="w-6 h-6 text-yellow-300"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm-7.071 0a1 1 0 001.414 1.414l.707-.707a1 1 0 10-1.414-1.414l-.707.707zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm14 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4.95.464A1 1 0 005.657 1.88l.707.707a1 1 0 001.414-1.414L7.071.464A1 1 0 005.657.464zm12.071 0a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"></path>
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-6 h-6 text-blue-300"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
  </svg>
);

const Navbar = ({ isAuthPage }: { isAuthPage: boolean }) => {
  const { user, logout, isLoading, token, refetchUser } = useAuth(); // Add refetchUser
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const baseLinkClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out";
  const inactiveLinkClasses =
    "text-blue-100 hover:bg-blue-600 hover:text-white";
  const activeLinkClasses = "bg-blue-800 text-white font-semibold";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Add this useEffect to handle the real-time avatar update
  useEffect(() => {
    if (token && user) {
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });

      socketRef.current.on(
        "avatarUpdated",
        ({ userId: updatedUserId }: { userId: string }) => {
          if (user?.id === updatedUserId) {
            // Refetch user data to get the new avatar URL
            refetchUser();
          }
        }
      );

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token, user, refetchUser]);

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

  const renderNavLinks = (isMobile = false) => {
    if (isLoading || !user) {
      return null;
    }
    const mobileLinkClass =
      "block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700";
    const desktopLinkClass = getNavLinkClass;

    const linkClass = isMobile ? () => mobileLinkClass : desktopLinkClass;

    return (
      <>
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        {user.role === "MENTEE" && (
          <>
            <NavLink to="/mentors" className={linkClass}>
              Find a Mentor
            </NavLink>
            <NavLink to="/my-mentors" className={linkClass}>
              My Mentors
            </NavLink>
            <NavLink to="/my-requests" className={linkClass}>
              My Requests
            </NavLink>
          </>
        )}
        {user.role === "MENTOR" && (
          <>
            <NavLink to="/requests" className={linkClass}>
              Requests
            </NavLink>
            <NavLink to="/availability" className={linkClass}>
              Availability
            </NavLink>
          </>
        )}
        {user.role === "ADMIN" && (
          <>
            <NavLink to="/admin/users" className={linkClass}>
              Users
            </NavLink>
            <NavLink to="/admin/matches" className={linkClass}>
              Matches
            </NavLink>
            <NavLink to="/admin/sessions" className={linkClass}>
              Sessions
            </NavLink>
          </>
        )}
        <NavLink to="/my-sessions" className={linkClass}>
          My Sessions
        </NavLink>
        <NavLink to="/goals" className={linkClass}>
          Goals
        </NavLink>
        <NavLink to="/messages" className={linkClass}>
          Messages
        </NavLink>
      </>
    );
  };

  const renderLoggedOutLinks = () => {
    return null;
  };

  return (
    <nav
      className={`sticky top-0 z-40 ${
        isAuthPage ? "bg-transparent" : "bg-blue-700 dark:bg-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAuthPage ? (
          <div className="flex items-center justify-center h-16">
            <img src={logo} alt="MentorMe Logo" className="h-8 w-auto mr-3" />
            <h1 className="text-2xl font-bold text-white">
              Welcome to MentorMe
            </h1>
          </div>
        ) : (
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <NavLink
                to="/dashboard"
                className="text-2xl font-bold text-white"
              >
                MentorMe
              </NavLink>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {renderNavLinks()}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              {user ? (
                <div className="ml-4 flex items-center md:ml-6">
                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-blue-200 hover:bg-blue-600 focus:outline-none"
                    aria-label="Toggle dark mode"
                  >
                    {theme === "light" ? <MoonIcon /> : <SunIcon />}
                  </button>
                  <NotificationBell />
                  <div className="relative ml-3" ref={profileRef}>
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 dark:focus:ring-offset-gray-800 focus:ring-white"
                      >
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={getAvatarUrl()}
                          alt="User profile"
                        />
                      </button>
                    </div>
                    <div
                      className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none transition ease-out duration-100 ${
                        isProfileOpen
                          ? "transform opacity-100 scale-100"
                          : "transform opacity-0 scale-95"
                      }`}
                    >
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                renderLoggedOutLinks()
              )}
            </div>
            <div className="-mr-2 flex items-center md:hidden">
              {user && (
                <>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-blue-200 hover:bg-blue-700 focus:outline-none"
                    aria-label="Toggle dark mode"
                  >
                    {theme === "light" ? <MoonIcon /> : <SunIcon />}
                  </button>
                  <NotificationBell />
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    type="button"
                    className="ml-2 bg-blue-800 dark:bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 dark:hover:bg-gray-700 focus:outline-none"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="block h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900">
            {renderNavLinks(true)}
          </div>
          {user && (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center px-5">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={getAvatarUrl()}
                  alt="User profile"
                />
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-800 dark:text-white">
                    {user.profile?.name || user.email.split("@")[0]}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-500 dark:text-gray-400">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/profile/edit"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
