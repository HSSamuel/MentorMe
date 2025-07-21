import React, { Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// A more visually appealing loader for the Suspense fallback
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen w-full">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Lazily import all the page components
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ProfileEditPage = React.lazy(() => import("./pages/ProfileEditPage"));
const MentorListPage = React.lazy(() => import("./pages/MentorListPage"));
const MentorRequestsPage = React.lazy(
  () => import("./pages/MentorRequestsPage")
);
const MyRequestsPage = React.lazy(() => import("./pages/MyRequestsPage"));
const MyMentorsPage = React.lazy(() => import("./pages/MyMentorsPage"));
const SetAvailabilityPage = React.lazy(
  () => import("./pages/SetAvailabilityPage")
);
const SessionBookingPage = React.lazy(
  () => import("./pages/SessionBookingPage")
);
const SessionsListPage = React.lazy(() => import("./pages/SessionsListPage"));
const AdminUsersPage = React.lazy(() => import("./pages/AdminUsersPage"));
const AdminMatchesPage = React.lazy(() => import("./pages/AdminMatchesPage"));
const AdminSessionsPage = React.lazy(() => import("./pages/AdminSessionsPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const MessagesPage = React.lazy(() => import("./pages/MessagesPage"));
const UserProfilePage = React.lazy(() => import("./pages/MentorProfilePage"));
const AuthCallbackPage = React.lazy(() => import("./pages/AuthCallbackPage"));
const ForgotPasswordPage = React.lazy(
  () => import("./pages/ForgotPasswordPage")
);
const VideoCallPage = React.lazy(() => import("./pages/VideoCallPage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const GoalsPage = React.lazy(() => import("./pages/GoalsPage"));
const SessionInsightsPage = React.lazy(
  () => import("./pages/SessionInsightsPage")
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />

          {/* Main Application Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/users/:id" element={<UserProfilePage />} />

          {/* Protected Routes */}
          <Route
            path="/mentor/:id"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
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
          {/* --- [FIXED] Path updated to match the application's navigation links --- */}
          <Route
            path="/my-sessions"
            element={
              <ProtectedRoute>
                <SessionsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId/call"
            element={
              <ProtectedRoute>
                <VideoCallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId/insights"
            element={
              <ProtectedRoute>
                <SessionInsightsPage />
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
      </Suspense>
    </Layout>
  );
}

export default App;
