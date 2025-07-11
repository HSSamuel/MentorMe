import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const promise = apiClient.post("/auth/reset-password", {
      token,
      password,
    });

    toast.promise(promise, {
      loading: "Resetting password...",
      success: () => {
        navigate("/login");
        return "Password has been reset successfully. Please log in.";
      },
      error: (err) =>
        err.response?.data?.message ||
        "Failed to reset password. The link may have expired.",
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-8 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Reset Your Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label
              className="mb-1 font-semibold text-gray-300 text-sm"
              htmlFor="password"
            >
              New Password
            </label>
            <input
              id="password"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              className="mb-1 font-semibold text-gray-300 text-sm"
              htmlFor="confirmPassword"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 mt-4 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
