// src/pages/GoalsPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios"; // Your pre-configured axios instance
import GoalForm from "../components/GoalForm"; // We will create this next
import GoalList from "../components/GoalList"; // We will also create this

// --- TypeScript Type for a Goal ---
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/goals");
      setGoals(response.data);
    } catch (err) {
      setError("Failed to fetch your goals. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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
    // Optimistic UI update, can add error handling here
    apiClient.delete(`/goals/${goalId}`).catch((err) => {
      console.error("Failed to delete goal on server:", err);
      // Optionally revert state or show an error message
      fetchGoals();
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        My S.M.A.R.T. Goals
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Goal Creation Form Section --- */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Add a New Goal</h2>
          <GoalForm onGoalCreated={handleGoalCreated} />
        </div>

        {/* --- Goal List Section --- */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Current Goals</h2>
          {isLoading && <p>Loading goals...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
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
