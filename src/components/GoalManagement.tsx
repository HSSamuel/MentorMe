import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import GoalList from "./GoalList";
import GoalModal from "./GoalModal";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const GoalManagement = () => {
  const { user } = useAuth();
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [selectedMentorshipId, setSelectedMentorshipId] = useState<
    string | null
  >(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  const fetchGoalsAndMentorships = useCallback(async () => {
    setIsLoading(true);
    try {
      // --- FIX: Fetch all goals and all connections separately ---
      const [goalsRes, connectionsRes] = await Promise.all([
        apiClient.get("/goals"),
        apiClient.get("/users/connections"),
      ]);

      setAllGoals(goalsRes.data);
      setMentorships(connectionsRes.data);

      // If there are connections, select the first one by default
      if (connectionsRes.data.length > 0) {
        setSelectedMentorshipId(connectionsRes.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch goals or mentorships:", error);
      toast.error("Could not load your goals.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoalsAndMentorships();
  }, [fetchGoalsAndMentorships]);

  // This effect runs when the selected mentorship changes, filtering the goals
  useEffect(() => {
    if (selectedMentorshipId) {
      const relevantGoals = allGoals.filter(
        (goal) =>
          goal.mentorshipRequest?.mentorId === selectedMentorshipId ||
          goal.mentorshipRequest?.menteeId === selectedMentorshipId
      );
      setFilteredGoals(relevantGoals);
    } else if (mentorships.length === 0) {
      // If there are no mentorships, show all goals (or none if there are none)
      setFilteredGoals(allGoals);
    } else {
      // Handle the case where a mentorship is deselected but others exist
      setFilteredGoals([]);
    }
  }, [selectedMentorshipId, allGoals, mentorships]);

  const handleSaveGoal = async (goalData: any) => {
    try {
      if (editingGoal) {
        const { data: updatedGoal } = await apiClient.put(
          `/goals/${editingGoal.id}`,
          goalData
        );
        setAllGoals(
          allGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
        );
        toast.success("Goal updated!");
      } else {
        // Find the correct mentorship request ID based on the selected connection
        const selectedConnection = mentorships.find(
          (m) => m.id === selectedMentorshipId
        );
        const mentorshipRequestId = selectedConnection?.mentorshipRequestId;

        if (!mentorshipRequestId) {
          toast.error("Could not find the associated mentorship.");
          return;
        }

        const { data: newGoal } = await apiClient.post("/goals", {
          ...goalData,
          mentorshipRequestId: mentorshipRequestId,
        });
        setAllGoals([...allGoals, newGoal]);
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
      setAllGoals(
        allGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
      );
    } catch (error) {
      console.error("Failed to update goal status:", error);
      toast.error("Could not update goal status.");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await apiClient.delete(`/goals/${goalId}`);
        setAllGoals(allGoals.filter((g) => g.id !== goalId));
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
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">
          Our Goals
        </h3>
        {mentorships.length > 0 && (
          <button
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add New Goal
          </button>
        )}
      </div>

      {mentorships.length > 0 ? (
        <>
          <div className="mb-4">
            <label htmlFor="mentorship-select" className="sr-only">
              Select a mentorship
            </label>
            <select
              id="mentorship-select"
              value={selectedMentorshipId || ""}
              onChange={(e) => setSelectedMentorshipId(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              {mentorships.map((m) => (
                <option key={m.id} value={m.id}>
                  Goals with {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
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
                          : "text-gray-800 dark:text-gray-100"
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No goals set for this mentorship yet.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          You need an active mentorship to set goals.
        </p>
      )}

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
