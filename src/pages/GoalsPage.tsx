import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";
import GoalForm from "../components/GoalForm";
import GoalList from "../components/GoalList";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: "InProgress" | "Completed" | "OnHold";
  dueDate?: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

const GoalsPage = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeMentorships, setActiveMentorships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    if (user?.role !== "MENTEE") {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [goalsRes, requestsRes] = await Promise.all([
        apiClient.get("/goals"),
        apiClient.get("/requests/sent"),
      ]);
      setGoals(goalsRes.data);
      const accepted = requestsRes.data.filter(
        (req: any) => req.status === "ACCEPTED"
      );
      setActiveMentorships(accepted);
    } catch (err) {
      setError("Failed to fetch your data. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleGoalCreated = (newGoal: Goal) => {
    setGoals((prevGoals) => [newGoal, ...prevGoals]);
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
  };

  const handleGoalDeleted = (goalId: string) => {
    setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId));
    apiClient.delete(`/goals/${goalId}`).catch((err) => {
      console.error("Failed to delete goal on server:", err);
      fetchPageData();
    });
  };

  if (isLoading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
    );
  }

  if (user?.role === "MENTOR") {
    return (
      <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Viewing Your Mentees' Goals
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          This page is for mentees to set their personal goals. You can view and
          manage the goals of your mentees from your dashboard.
        </p>
        <Link
          to="/my-sessions"
          className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to My Mentees
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        My S.M.A.R.T. Goals
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Add a New Goal
          </h2>
          <GoalForm
            onGoalCreated={handleGoalCreated}
            mentorships={activeMentorships}
          />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
            Current Goals
          </h2>
          {error && <p className="text-red-500">{error}</p>}
          {!error && (
            <GoalList
              goals={goals}
              onUpdate={handleGoalUpdated}
              onDelete={handleGoalDeleted}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
