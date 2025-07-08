import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import apiClient from "../api/axios";

const Navbar = () => {
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const baseLinkClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const inactiveLinkClasses =
    "text-gray-500 hover:bg-gray-100 hover:text-gray-900";
  const activeLinkClasses = "bg-gray-900 text-white";

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

  const renderNavLinks = (isMobile = false) => {
    if (isLoading || !user) {
      return null;
    }

    const mobileLinkClass =
      "block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50";
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
        <NavLink to="/messages" className={linkClass}>
          Messages
        </NavLink>
      </>
    );
  };

  const renderLoggedOutLinks = () => {
    // ... (This function remains the same)
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink
              to="/dashboard"
              className="text-2xl font-bold text-gray-900"
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
                <NotificationBell />
                <div className="relative ml-3" ref={profileRef}>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={
                          user.profile?.avatarUrl
                            ? `${apiClient.defaults.baseURL}${user.profile.avatarUrl}`.replace(
                                "/api",
                                ""
                              )
                            : `https://ui-avatars.com/api/?name=${
                                user.profile?.name || user.email
                              }&background=random&color=fff`
                        }
                        alt="User profile"
                      />
                    </button>
                  </div>
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Link
                        to="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              renderLoggedOutLinks()
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 focus:outline-none"
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
            )}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {renderNavLinks(true)}
          </div>
          {user && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={
                    user.profile?.avatarUrl
                      ? `${apiClient.defaults.baseURL}${user.profile.avatarUrl}`.replace(
                          "/api",
                          ""
                        )
                      : `https://ui-avatars.com/api/?name=${
                          user.profile?.name || user.email
                        }&background=random&color=fff`
                  }
                  alt="User profile"
                />
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-800">
                    {user.profile?.name || user.email.split("@")[0]}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-500">
                    {user.email}
                  </div>
                </div>
                <div className="ml-auto">
                  <NotificationBell />
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/profile/edit"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-red-500 hover:text-white"
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
