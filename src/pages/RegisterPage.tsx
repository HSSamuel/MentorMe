import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { GoogleIcon, FacebookIcon } from "../components/SocialIcons";

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

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"MENTEE" | "MENTOR">("MENTEE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track submission
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true); // Start loading

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsSubmitting(false); // Stop loading
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
    } finally {
      setIsSubmitting(false); // Stop loading regardless of outcome
    }
  };

  const handleSocialLogin = (provider: "google" | "linkedin") => {
    window.location.href = `${apiClient.defaults.baseURL}/auth/${provider}`;
  };

  if (isLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-yellow-970/60 backdrop-blur-sm rounded-lg shadow-xl w-fit max-w-xs m-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">Create Your Account</h2>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <button
          onClick={() => handleSocialLogin("google")}
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border border-gray-600 rounded-lg text-white font-semibold bg-gray-900 hover:bg-gray-600 transition-colors text-sm"
        >
          <GoogleIcon />
          Sign up with Google
        </button>
        <button
          onClick={() => handleSocialLogin("linkedin")}
          className="flex items-center justify-center gap-3 w-full px-4 py-1.5 border-none rounded-lg text-white font-semibold bg-[#0077B5] hover:bg-[#005582] transition-colors text-sm"
        >
          <LinkedInIcon />
          Sign up with LinkedIn
        </button>
      </div>

      <div className="my-3 flex items-center">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-1.5">
        <div className="flex flex-col">
          <label
            className="font-semibold text-gray-300 text-xs"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="flex flex-col">
          <label
            className="font-semibold text-gray-300 text-xs"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-white text-sm"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
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
        <div className="flex flex-col">
          <label className="font-semibold text-gray-200 text-sm mb-2">
            I am a:
          </label>
          <div className="role-selector">
            <input
              type="radio"
              id="role-mentee"
              name="role"
              value="MENTEE"
              checked={role === "MENTEE"}
              onChange={() => setRole("MENTEE")}
            />
            <label htmlFor="role-mentee" className="role-option">
              <span className="role-title">Mentee</span>
              {/* Added parentheses for consistency with the original design */}
              <span className="role-description">(Looking for guidance)</span>
            </label>

            <input
              type="radio"
              id="role-mentor"
              name="role"
              value="MENTOR"
              checked={role === "MENTOR"}
              onChange={() => setRole("MENTOR")}
            />
            <label htmlFor="role-mentor" className="role-option">
              <span className="role-title">Mentor</span>
              <span className="role-description">
                (Want to provide guidance)
              </span>
            </label>
          </div>
        </div>
        {error && <p className="text-red-400 text-center text-xs">{error}</p>}
        {success && (
          <p className="text-green-400 text-center text-xs">{success}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting} // Disable button when submitting
          className="w-full px-4 py-2 mt-2 border-none rounded-lg bg-green-600 text-white font-semibold cursor-pointer transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm flex justify-center items-center disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Spinner /> : "Register"}
        </button>
      </form>
      <div className="text-center mt-3">
        <p className="text-xs text-gray-400">
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
  );
};

export default RegisterPage;
