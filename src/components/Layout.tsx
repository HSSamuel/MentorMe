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
          className="min-h-screen flex flex-col items-center justify-center -mt-16 pt-16 px-4"
          style={backgroundStyle}
        >
          {/* The overlay is now also theme-aware */}
          <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"></div>
          <div className="z-10">{children}</div>
        </div>
      );
    }
    // Removed bg-gray-50 as it's now handled by the body tag in index.css
    return <div className="p-4 sm:p-6 lg:p-8">{children}</div>;
  };

  return (
    <div className="min-h-screen">
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
