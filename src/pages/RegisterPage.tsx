import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

// SVG Icons for Social Buttons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.92C34.553 6.08 29.632 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306 14.691c-1.229 2.26-1.996 4.853-1.996 7.649c0 2.796.767 5.389 1.996 7.649l-5.34-4.148C.965 25.166 0 24.091 0 24s.965-1.166 1.011-1.299l5.295-4.01z"
    ></path>
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A8 8 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.018 35.846 44 30.221 44 24c0-1.341-.138-2.65-.389-3.917z"
    ></path>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35C.59 0 0 .59 0 1.325v21.35C0 23.41.59 24 1.325 24H12.82v-9.29H9.69v-3.62h3.13V8.41c0-3.1 1.89-4.79 4.66-4.79 1.33 0 2.46.1 2.79.14v3.24h-1.92c-1.5 0-1.8.72-1.8 1.77v2.31h3.59l-.47 3.62h-3.12V24h5.74c.73 0 1.32-.59 1.32-1.32V1.325C24 .59 23.405 0 22.675 0z" />
  </svg>
);

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"MENTEE" | "MENTOR">("MENTEE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If the user is already logged in, redirect them away from the register page
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await apiClient.post("/auth/register", { email, password, role });
      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    // Corrected URL construction
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  // While checking auth status, show a loading indicator
  if (isLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-900 to-blue-900">
      <div className="p-8 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => handleSocialLogin("google")}
            className="flex items-center justify-center gap-3 w-full px-4 py-2 border border-gray-600 rounded-lg text-white font-semibold bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            <GoogleIcon />
            Sign up with Google
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            className="flex items-center justify-center gap-3 w-full px-4 py-2 border-none rounded-lg text-white font-semibold bg-[#1877F2] hover:bg-[#166eab] transition-colors text-sm"
          >
            <FacebookIcon />
            Sign up with Facebook
          </button>
        </div>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
          <div className="flex flex-col">
            <label
              className="mb-1 font-semibold text-gray-300 text-sm"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <input
                type="checkbox"
                id="showPassword"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>
          </div>
          <div className="flex flex-col">
            <label
              className="mb-1 font-semibold text-gray-300 text-sm"
              htmlFor="role"
            >
              I am a:
            </label>
            <select
              id="role"
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white"
              value={role}
              onChange={(e) => setRole(e.target.value as "MENTEE" | "MENTOR")}
            >
              <option value="MENTEE">Mentee (Looking for guidance)</option>
              <option value="MENTOR">Mentor (Want to provide guidance)</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-center text-xs">{error}</p>}
          {success && (
            <p className="text-green-400 text-center text-xs">{success}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 mt-4 border-none rounded-lg bg-green-600 text-white font-semibold cursor-pointer transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-base"
          >
            Register with Email
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
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

export default RegisterPage;