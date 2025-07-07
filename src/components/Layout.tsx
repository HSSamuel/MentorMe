import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* 2. Add the Toaster component here */}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Layout;
