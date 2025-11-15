import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast"; // --- ADDED THIS IMPORT ---

// A loader for Suspense fallback
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
const MentorProfilePage = React.lazy(() => import("./pages/MentorProfilePage"));
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
const AdminDashboardPage = React.lazy(
  () => import("./pages/AdminDashboardPage")
);
const CommunityPage = React.lazy(() => import("./pages/CommunityPage"));
const PostViewPage = React.lazy(() => import("./pages/PostViewPage"));
const NewPostPage = React.lazy(() => import("./pages/NewPostPage"));
const LibraryPage = React.lazy(() => import("./pages/LibraryPage"));
const AdminResourcesPage = React.lazy(
  () => import("./pages/AdminResourcesPage")
);

function App() {
  return (
    <Layout>
      {/* --- ADDED THIS ENTIRE TOASTER COMPONENT --- */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Define default options
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },

          // --- Styles for specific toast types ---

          // Success Toast (like your image)
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981", // Green icon color
              secondary: "#FFFFFF", // White checkmark
            },
            style: {
              background: "#F0FDF4", // Light green background
              color: "#14532D", // Dark green text
              border: "1px solid #10B981",
            },
          },

          // Error Toast
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444", // Red icon color
              secondary: "#FFFFFF", // White 'X'
            },
            style: {
              background: "#FEF2F2", // Light red background
              color: "#7F1D1D", // Dark red text
              border: "1px solid #EF4444",
            },
          },
        }}
      />
      {/* --- END OF ADDED CODE --- */}

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

          {/* FIX: Use a single, semantic route for mentor profiles. This replaces the old /users and /mentor routes. */}
          <Route
            path="/mentor/:mentorId"
            element={
              <ProtectedRoute>
                <MentorProfilePage />
              </ProtectedRoute>
            }
          />

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
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsListPage />
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

          {/* Community Forum Routes */}
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/new"
            element={
              <ProtectedRoute>
                <NewPostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/:postId"
            element={
              <ProtectedRoute>
                <PostViewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminResourcesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
