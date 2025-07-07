import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Note: 'toast' and 'useRef' are no longer needed here

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ("ADMIN" | "MENTOR" | "MENTEE")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while user data is being fetched
    return <div>Loading...</div>;
  }

  if (!user) {
    // If there is no user, redirect to the login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // The core redirect logic remains.
  // If the user's name is missing from their profile, they are redirected.
  if (!user.profile?.name && location.pathname !== "/profile/edit") {
    return <Navigate to="/profile/edit" replace />;
  }

  // If the user's role is not in the list of allowed roles, redirect
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, render the requested page
  return children;
};

export default ProtectedRoute;
