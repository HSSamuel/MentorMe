import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { GoogleIcon } from "../components/SocialIcons";

// --- [NEW] LinkedIn Icon Component ---
const LinkedInIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

// A simple spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track submission
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true); // Start loading

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      await login(response.data.token, from);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setIsSubmitting(false); // Stop loading regardless of outcome
    }
  };

  const handleSocialLogin = (provider: "google" | "linkedin") => {
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  return (
    <div className="p-6 bg-yellow-970/60 backdrop-blur-sm rounded-lg shadow-xl w-fit max-w-xs m-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">Welcome Back</h2>
        <p className="text-gray-300 text-xs">Sign in to your account</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-1.5">
        <div className="flex flex-col">
          <label
            className="font-semibold text-gray-300 text-xs"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-white text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <label
              className="font-semibold text-gray-300 text-xs"
              htmlFor="password"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-200 hover:text-blue-300"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white text-sm"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <input
              type="checkbox"
              id="showPassword"
              className="h-3 w-3 text-blue-900 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="showPassword">Show Password</label>
          </div>
        </div>
        {error && <p className="text-red-400 text-center text-xs">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 mt-2 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm flex justify-center items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Spinner /> : "Sign In"}
        </button>
      </form>

      <div className="my-3 flex items-center">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleSocialLogin("google")}
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border border-gray-500 rounded-lg text-white font-semibold bg-gray-900 hover:bg-gray-700 transition-colors text-sm"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          onClick={() => handleSocialLogin("linkedin")}
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border-none rounded-lg text-white font-semibold bg-[#0077B5] hover:bg-[#005582] transition-colors text-sm"
        >
          <LinkedInIcon />
          Continue with LinkedIn
        </button>
      </div>

      <div className="text-center mt-3">
        <p className="text-xs text-gray-300">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
