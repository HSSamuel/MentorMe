import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // The login function will save the token and navigate to the dashboard
      login(token, "/dashboard");
    } else {
      // If no token is found, redirect to the login page with an error
      navigate("/login", {
        state: { error: "Authentication failed. Please try again." },
      });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-xl font-semibold">Finalizing login, please wait...</p>
    </div>
  );
};

export default AuthCallbackPage;
