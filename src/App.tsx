import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import MentorListPage from "./pages/MentorListPage";
import MentorRequestsPage from "./pages/MentorRequestsPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import MyMentorsPage from "./pages/MyMentorsPage";
import SetAvailabilityPage from "./pages/SetAvailabilityPage";
import SessionBookingPage from "./pages/SessionBookingPage";
import SessionsListPage from "./pages/SessionsListPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminMatchesPage from "./pages/AdminMatchesPage";
import AdminSessionsPage from "./pages/AdminSessionsPage";
import DashboardPage from "./pages/DashboardPage";
import MessagesPage from "./pages/MessagesPage";
import MentorProfilePage from "./pages/MentorProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GoalsPage from "./pages/GoalsPage";
// Note: The following imports are redundant but kept as requested.
import {
  BrowserRouter as Router,
  Routes as RouterRoutes,
  Route as RouterRoute,
  Link,
} from "react-router-dom";

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Main Application Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/mentor/:id" element={<MentorProfilePage />} />

        {/* Protected Routes */}
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfileEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* --- NEW: Added the route for the Goals Page --- */}
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentors"
          element={
            <ProtectedRoute allowedRoles={["MENTEE"]}>
              <MentorListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={["MENTOR"]}>
              <MentorRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute allowedRoles={["MENTEE"]}>
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-mentors"
          element={
            <ProtectedRoute allowedRoles={["MENTEE"]}>
              <MyMentorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute allowedRoles={["MENTOR"]}>
              <SetAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-session/:mentorId"
          element={
            <ProtectedRoute allowedRoles={["MENTEE"]}>
              <SessionBookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-sessions"
          element={
            <ProtectedRoute>
              <SessionsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matches"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminSessionsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
