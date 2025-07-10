import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url(/src/assets/Mentoring.jpg)" }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center bg-black bg-opacity-50">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
