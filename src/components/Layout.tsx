import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import { Toaster } from "react-hot-toast";
import AIChatAssistant from "./AIChatAssistant";
import { useLocation } from "react-router-dom";
import MentoringImage from "../assets/Mentoring.jpg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  // Add the new routes to the authPaths array
  const authPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const isAuthPage = authPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  const backgroundStyle = isAuthPage
    ? {
        backgroundImage: `url(${MentoringImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const PageWrapper = ({ children }: { children: ReactNode }) => {
    if (isAuthPage) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center -mt-16 pt-16"
          style={backgroundStyle}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="z-10">{children}</div>
        </div>
      );
    }
    return <div className="bg-gray-50">{children}</div>;
  };

  return (
    <div className="min-h-screen">
      {/* Pass the isAuthPage prop to the Navbar */}
      <Navbar isAuthPage={isAuthPage} />
      <main>
        <PageWrapper>{children}</PageWrapper>
      </main>
      <Toaster position="bottom-right" />
      <AIChatAssistant />
    </div>
  );
};

export default Layout;
