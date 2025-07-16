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
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <p className="text-center text-gray-500 dark:text-gray-400">
          You haven't set any goals yet. Add one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {goal.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                goal.status === "Completed"
                  ? "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                  : "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
              }`}
            >
              {goal.status}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Specific:
              </strong>{" "}
              {goal.specific}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Measurable:
              </strong>{" "}
              {goal.measurable}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Achievable:
              </strong>{" "}
              {goal.achievable}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Relevant:
              </strong>{" "}
              {goal.relevant}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Time-bound:
              </strong>{" "}
              {goal.timeBound}
            </p>
          </div>
          <div className="mt-4 flex gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={() => handleStatusChange(goal, "Completed")}
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Mark as Complete
            </button>
            <button
              onClick={() => handleStatusChange(goal, "InProgress")}
              className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Mark as In Progress
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline ml-auto"
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
