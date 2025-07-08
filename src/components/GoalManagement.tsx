import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import GoalModal from "./GoalModal"; // We will create this next

const GoalManagement = ({ mentorshipId }: { mentorshipId: string }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/goals/${mentorshipId}`);
      setGoals(response.data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mentorshipId) {
      fetchGoals();
    }
  }, [mentorshipId]);

  const handleSaveGoal = async (goalData: any) => {
    try {
      if (editingGoal) {
        // Update existing goal
        const { data: updatedGoal } = await apiClient.put(
          `/goals/${editingGoal.id}`,
          goalData
        );
        setGoals(goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
        toast.success("Goal updated!");
      } else {
        // Create new goal
        const { data: newGoal } = await apiClient.post("/goals", {
          ...goalData,
          mentorshipRequestId: mentorshipId,
        });
        setGoals([...goals, newGoal]);
        toast.success("Goal added!");
      }
      setIsModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal:", error);
      toast.error("Failed to save goal.");
    }
  };

  const handleToggleComplete = async (goal: any) => {
    try {
      const { data: updatedGoal } = await apiClient.put(`/goals/${goal.id}`, {
        isCompleted: !goal.isCompleted,
      });
      setGoals(goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    } catch (error) {
      console.error("Failed to update goal status:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await apiClient.delete(`/goals/${goalId}`);
        setGoals(goals.filter((g) => g.id !== goalId));
        toast.success("Goal deleted.");
      } catch (error) {
        console.error("Failed to delete goal:", error);
        toast.error("Failed to delete goal.");
      }
    }
  };

  if (isLoading) return <p className="text-gray-500">Loading goals...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-700">Our Goals</h3>
        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Add New Goal
        </button>
      </div>
      <div className="space-y-3">
        {goals.length > 0 ? (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={goal.isCompleted}
                  onChange={() => handleToggleComplete(goal)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <p
                  className={`ml-4 ${
                    goal.isCompleted
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {goal.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingGoal(goal);
                    setIsModalOpen(true);
                  }}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            No goals set yet. Add one to get started!
          </p>
        )}
      </div>
      {isModalOpen && (
        <GoalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
          }}
          onSave={handleSaveGoal}
          goal={editingGoal}
        />
      )}
    </div>
  );
};

export default GoalManagement;
