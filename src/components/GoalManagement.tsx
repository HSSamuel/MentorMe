import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import GoalList from "./GoalList";
import GoalModal from "./GoalModal";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const GoalManagement = ({
  mentorshipId,
  onAddGoal,
  onEditGoal,
}: {
  mentorshipId?: string;
  onAddGoal?: () => void;
  onEditGoal?: (goal: any) => void;
}) => {
  const { user } = useAuth();
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [selectedMentorshipId, setSelectedMentorshipId] = useState<
    string | null
  >(null);
  const [isInternalModalOpen, setInternalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoalsAndMentorships = useCallback(async () => {
    if (mentorshipId) {
      setIsLoading(true);
      try {
        const goalsRes = await apiClient.get(
          `/goals/mentorship/${mentorshipId}`
        );
        setAllGoals(goalsRes.data);
        setFilteredGoals(goalsRes.data);
      } catch (error) {
        console.error("Failed to fetch goals:", error);
        toast.error("Could not load your goals.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const [goalsRes, connectionsRes] = await Promise.all([
        apiClient.get("/goals"),
        apiClient.get("/users/connections"),
      ]);

      setAllGoals(goalsRes.data);
      setMentorships(connectionsRes.data);

      if (connectionsRes.data.length > 0) {
        setSelectedMentorshipId(connectionsRes.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch goals or mentorships:", error);
      toast.error("Could not load your goals.");
    } finally {
      setIsLoading(false);
    }
  }, [mentorshipId]);

  useEffect(() => {
    fetchGoalsAndMentorships();
  }, [fetchGoalsAndMentorships]);

  useEffect(() => {
    if (mentorshipId) {
      setFilteredGoals(
        allGoals.filter((goal) => goal.mentorshipRequestId === mentorshipId)
      );
      return;
    }

    if (selectedMentorshipId) {
      const relevantGoals = allGoals.filter(
        (goal) =>
          goal.mentorshipRequest?.mentorId === selectedMentorshipId ||
          goal.mentorshipRequest?.menteeId === selectedMentorshipId
      );
      setFilteredGoals(relevantGoals);
    } else {
      setFilteredGoals(mentorships.length === 0 ? allGoals : []);
    }
  }, [selectedMentorshipId, allGoals, mentorships, mentorshipId]);

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
        const finalMentorshipUserId = mentorshipId || selectedMentorshipId;
        const selectedConnection = mentorships.find(
          (m) => m.id === finalMentorshipUserId
        );
        const mentorshipRequestId = selectedConnection?.mentorshipRequestId;

        if (!mentorshipRequestId) {
          toast.error(
            "Could not find the associated mentorship to save this goal."
          );
          return;
        }

        const { data: newGoal } = await apiClient.post("/goals", {
          ...goalData,
          mentorshipRequestId: mentorshipRequestId,
        });
        setAllGoals([...allGoals, newGoal]);
        toast.success("Goal added!");
      }
      setInternalModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal:", error);
      toast.error("Failed to save goal.");
    }
  };

  // --- [FIX] This new function will handle updates from the GoalList component ---
  const handleGoalUpdate = (updatedGoal: any) => {
    setAllGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    toast.success("Goal status updated!");
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
        <button
          onClick={() => {
            if (onAddGoal) {
              onAddGoal();
            } else {
              setEditingGoal(null);
              setInternalModalOpen(true);
            }
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add New Goal
        </button>
      </div>

      {!mentorshipId && mentorships.length > 0 && (
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
      )}

      {/* --- [FIX] Pass the correct 'onUpdate' prop to the GoalList --- */}
      <GoalList
        goals={filteredGoals}
        onUpdate={handleGoalUpdate}
        onEdit={(goal) => {
          if (onEditGoal) {
            onEditGoal(goal);
          } else {
            setEditingGoal(goal);
            setInternalModalOpen(true);
          }
        }}
        onDelete={handleDeleteGoal}
      />

      <GoalModal
        isOpen={isInternalModalOpen}
        onClose={() => {
          setInternalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        goal={editingGoal}
        mentorshipId={selectedMentorshipId}
      />
    </div>
  );
};

export default GoalManagement;
