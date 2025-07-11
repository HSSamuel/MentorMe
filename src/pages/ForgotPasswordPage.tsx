import React, { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = apiClient.post("/auth/forgot-password", { email });
    toast.promise(promise, {
      loading: "Sending reset link...",
      success: () => {
        setIsSubmitted(true);
        return "Reset link sent successfully.";
      },
      error: "Failed to send reset link. Please try again.",
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-8 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="text-gray-400">
            {isSubmitted
              ? "Check your email for a password reset link."
              : "Enter your email to receive a password reset link."}
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                className="mb-1 font-semibold text-gray-300 text-sm"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 mt-4 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700"
            >
              Send Reset Link
            </button>
          </form>
        ) : null}

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
