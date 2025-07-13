// src/components/GoalList.tsx

import React from "react";
import { Goal } from "../pages/GoalsPage";
import apiClient from "../api/axios";

interface GoalListProps {
  goals: Goal[];
  onUpdate: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const GoalList: React.FC<GoalListProps> = ({ goals, onUpdate, onDelete }) => {
  const handleStatusChange = async (goal: Goal, status: Goal["status"]) => {
    try {
      const response = await apiClient.put(`/goals/${goal.id}`, { status });
      onUpdate(response.data);
    } catch (error) {
      console.error("Failed to update goal status:", error);
    }
  };

  if (goals.length === 0) {
    return (
      <p className="text-center text-gray-500">
        You haven't set any goals yet. Add one to get started!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal.id} className="p-4 bg-white shadow-md rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{goal.title}</h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                goal.status === "Completed"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {goal.status}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>
              <strong>Specific:</strong> {goal.specific}
            </p>
            <p>
              <strong>Measurable:</strong> {goal.measurable}
            </p>
            <p>
              <strong>Achievable:</strong> {goal.achievable}
            </p>
            <p>
              <strong>Relevant:</strong> {goal.relevant}
            </p>
            <p>
              <strong>Time-bound:</strong> {goal.timeBound}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleStatusChange(goal, "Completed")}
              className="text-sm text-green-600"
            >
              Mark as Complete
            </button>
            <button
              onClick={() => handleStatusChange(goal, "InProgress")}
              className="text-sm text-yellow-600"
            >
              Mark as In Progress
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-sm text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GoalList;
