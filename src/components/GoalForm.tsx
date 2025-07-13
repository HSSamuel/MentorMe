// src/components/GoalForm.tsx

import React, { useState } from "react";
import apiClient from "../api/axios";
import { Goal } from "../pages/GoalsPage"; // Import the Goal type

interface GoalFormProps {
  onGoalCreated: (goal: Goal) => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ onGoalCreated }) => {
  const [title, setTitle] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timeBound, setTimeBound] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/goals", {
        title,
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
        category: "Skill Development", // Example category
      });
      onGoalCreated(response.data);
      // Reset form
      setTitle("");
      setSpecific("");
      setMeasurable("");
      setAchievable("");
      setRelevant("");
      setTimeBound("");
    } catch (error) {
      console.error("Failed to create goal:", error);
      alert("Could not create goal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white shadow-md rounded-lg space-y-4"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Goal Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label
          htmlFor="specific"
          className="block text-sm font-medium text-gray-700"
        >
          Specific
        </label>
        <textarea
          id="specific"
          value={specific}
          onChange={(e) => setSpecific(e.target.value)}
          required
          rows={2}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="What exactly do I want to accomplish?"
        />
      </div>
      <div>
        <label
          htmlFor="measurable"
          className="block text-sm font-medium text-gray-700"
        >
          Measurable
        </label>
        <textarea
          id="measurable"
          value={measurable}
          onChange={(e) => setMeasurable(e.target.value)}
          required
          rows={2}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="How will I track my progress?"
        />
      </div>
      <div>
        <label
          htmlFor="achievable"
          className="block text-sm font-medium text-gray-700"
        >
          Achievable
        </label>
        <textarea
          id="achievable"
          value={achievable}
          onChange={(e) => setAchievable(e.target.value)}
          required
          rows={2}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="Is this goal realistic?"
        />
      </div>
      <div>
        <label
          htmlFor="relevant"
          className="block text-sm font-medium text-gray-700"
        >
          Relevant
        </label>
        <textarea
          id="relevant"
          value={relevant}
          onChange={(e) => setRelevant(e.target.value)}
          required
          rows={2}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="Why is this goal important to me?"
        />
      </div>
      <div>
        <label
          htmlFor="timeBound"
          className="block text-sm font-medium text-gray-700"
        >
          Time-bound
        </label>
        <textarea
          id="timeBound"
          value={timeBound}
          onChange={(e) => setTimeBound(e.target.value)}
          required
          rows={2}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          placeholder="What is the deadline?"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? "Saving..." : "Set Goal"}
      </button>
    </form>
  );
};

export default GoalForm;
