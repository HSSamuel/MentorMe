import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    const handleLogin = async () => {
      if (token) {
        try {
          await login(token, "/dashboard");
        } catch (e) {
          setError("Failed to log in. Please try again.");
          setTimeout(() => navigate("/login"), 3000);
        }
      } else {
        setError("Authentication failed. No token provided.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleLogin();
  }, [searchParams, login, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
      {error ? (
        <>
          <p className="text-xl font-semibold text-red-500">{error}</p>
          <p className="text-gray-500">Redirecting you to the login page...</p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold">
            Finalizing login, please wait...
          </p>
          {/* You can add a spinner or loading animation here */}
        </>
      )}
    </div>
  );
};

export default AuthCallbackPage;
