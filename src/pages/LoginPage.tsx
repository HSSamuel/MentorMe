import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { GoogleIcon, FacebookIcon } from "../components/SocialIcons";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      await login(response.data.token, from);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  return (
    <div className="p-6 bg-gray-800 bg-opacity-70 rounded-lg shadow-xl w-full max-w-xs m-4">
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
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white text-sm"
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
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white text-sm"
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
              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="showPassword">Show Password</label>
          </div>
        </div>
        {error && <p className="text-red-400 text-center text-xs">{error}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 mt-2 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
        >
          Sign In
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
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border border-gray-600 rounded-lg text-white font-semibold bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          onClick={() => handleSocialLogin("facebook")}
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border-none rounded-lg text-white font-semibold bg-[#1877F2] hover:bg-[#166eab] transition-colors text-sm"
        >
          <FacebookIcon />
          Continue with Facebook
        </button>
      </div>

      <div className="text-center mt-3">
        <p className="text-xs text-gray-400">
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
