import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../pages/DashboardPage";
import { AuthContext } from "../contexts/AuthContext";

const mockAdmin = {
  user: { role: "ADMIN" },
  stats: { totalUsers: 10, totalMatches: 5, totalSessions: 20 },
};

const mockMentor = {
  user: { role: "MENTOR" },
  stats: { menteeCount: 3, pendingRequests: 2, upcomingSessions: 1 },
};

const mockMentee = {
  user: { role: "MENTEE" },
  stats: { mentorCount: 1, pendingRequests: 0, upcomingSessions: 2 },
};

describe("DashboardPage", () => {
  it("renders admin dashboard correctly", () => {
    render(
      <AuthContext.Provider value={{ user: mockAdmin.user, isLoading: false }}>
        <DashboardPage />
      </AuthContext.Provider>
    );
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Total Users: 10")).toBeInTheDocument();
  });

  it("renders mentor dashboard correctly", () => {
    render(
      <AuthContext.Provider value={{ user: mockMentor.user, isLoading: false }}>
        <DashboardPage />
      </AuthContext.Provider>
    );
    expect(screen.getByText("Mentor Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Your Mentees: 3")).toBeInTheDocument();
  });

  it("renders mentee dashboard correctly", () => {
    render(
      <AuthContext.Provider value={{ user: mockMentee.user, isLoading: false }}>
        <DashboardPage />
      </AuthContext.Provider>
    );
    expect(screen.getByText("Mentee Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Your Mentors: 1")).toBeInTheDocument();
  });
});
