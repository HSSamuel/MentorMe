import React, { ReactNode } from "react";
import MentoringImage from "../assets/Mentoring.jpg"; // Import the image directly

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${MentoringImage})` }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center bg-black bg-opacity-50">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
