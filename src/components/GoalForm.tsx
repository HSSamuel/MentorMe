import React, { useState } from "react";
import apiClient from "../api/axios";
import { Goal } from "../pages/GoalsPage";
import toast from "react-hot-toast";

interface GoalFormProps {
  onGoalCreated: (goal: Goal) => void;
  mentorships: any[];
}

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const GoalForm: React.FC<GoalFormProps> = ({ onGoalCreated, mentorships }) => {
  const [title, setTitle] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timeBound, setTimeBound] = useState("");
  const [selectedMentorship, setSelectedMentorship] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorship) {
      toast.error("Please select a mentorship to associate this goal with.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/goals", {
        title,
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
        mentorshipRequestId: selectedMentorship,
        category: "Skill Development",
      });
      onGoalCreated(response.data);
      toast.success("Goal created successfully!");
      // Reset form
      setTitle("");
      setSpecific("");
      setMeasurable("");
      setAchievable("");
      setRelevant("");
      setTimeBound("");
      setSelectedMentorship("");
    } catch (error: any) {
      // --- FIX: Log the detailed error from the server ---
      console.error(
        "Failed to create goal:",
        error.response?.data || error.message
      );
      // Display the specific validation error message from the backend
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        "Could not create goal. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInputClass =
    "mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500";
  const formLabelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg space-y-4"
    >
      <div>
        <label htmlFor="mentorship" className={formLabelClass}>
          Associate with Mentor
        </label>
        <select
          id="mentorship"
          value={selectedMentorship}
          onChange={(e) => setSelectedMentorship(e.target.value)}
          required
          className={formInputClass}
        >
          <option value="" disabled>
            -- Select a Mentor --
          </option>
          {mentorships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.mentor.profile.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className={formLabelClass}>
          Goal Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={formInputClass}
        />
      </div>
      <div>
        <label htmlFor="specific" className={formLabelClass}>
          Specific
        </label>
        <textarea
          id="specific"
          value={specific}
          onChange={(e) => setSpecific(e.target.value)}
          required
          rows={2}
          className={formInputClass}
          placeholder="What exactly do I want to accomplish?"
        />
      </div>
      <div>
        <label htmlFor="measurable" className={formLabelClass}>
          Measurable
        </label>
        <textarea
          id="measurable"
          value={measurable}
          onChange={(e) => setMeasurable(e.target.value)}
          required
          rows={2}
          className={formInputClass}
          placeholder="How will I track my progress?"
        />
      </div>
      <div>
        <label htmlFor="achievable" className={formLabelClass}>
          Achievable
        </label>
        <textarea
          id="achievable"
          value={achievable}
          onChange={(e) => setAchievable(e.target.value)}
          required
          rows={2}
          className={formInputClass}
          placeholder="Is this goal realistic?"
        />
      </div>
      <div>
        <label htmlFor="relevant" className={formLabelClass}>
          Relevant
        </label>
        <textarea
          id="relevant"
          value={relevant}
          onChange={(e) => setRelevant(e.target.value)}
          required
          rows={2}
          className={formInputClass}
          placeholder="Why is this goal important to me?"
        />
      </div>
      <div>
        <label htmlFor="timeBound" className={formLabelClass}>
          Time-bound
        </label>
        <textarea
          id="timeBound"
          value={timeBound}
          onChange={(e) => setTimeBound(e.target.value)}
          required
          rows={2}
          className={formInputClass}
          placeholder="What is the deadline?"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed flex justify-center items-center"
      >
        {isSubmitting ? <Spinner /> : "Set Goal"}
      </button>
    </form>
  );
};

export default GoalForm;
