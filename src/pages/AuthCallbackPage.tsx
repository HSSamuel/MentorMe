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
      login(token, "/dashboard");
    } else {
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
