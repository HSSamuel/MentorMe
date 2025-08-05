import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import apiClient from "../api/axios"; // Make sure apiClient is imported

// A simple spinner component for the buttons
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// --- [NEW] AI Magic Wand Icon ---
const MagicWandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 4V2" />
    <path d="M15 16v-2" />
    <path d="M8 9h2" />
    <path d="M20 9h2" />
    <path d="M17.8 11.8 19 13" />
    <path d="M15 9a3 3 0 0 0-3-3" />
    <path d="M12 12a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3H9" />
    <path d="m5 7-1.8-1.8" />
  </svg>
);

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => Promise<void>;
  goal?: any | null;
}

const GoalModal = ({ isOpen, onClose, onSave, goal }: GoalModalProps) => {
  // --- [NEW] State for the initial, simple goal ---
  const [initialGoal, setInitialGoal] = useState("");
  // --- [NEW] State to control the view of the modal ---
  const [isRefined, setIsRefined] = useState(false);
  // --- [NEW] State for the AI refinement loading spinner ---
  const [isRefining, setIsRefining] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timeBound, setTimeBound] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // If editing an existing goal, populate all fields and show the refined view
        setTitle(goal.title);
        setDescription(goal.description || "");
        setSpecific(goal.specific || "");
        setMeasurable(goal.measurable || "");
        setAchievable(goal.achievable || "");
        setRelevant(goal.relevant || "");
        setTimeBound(goal.timeBound || "");
        setIsRefined(true); // Show the full S.M.A.R.T. form
      } else {
        // If adding a new goal, reset everything to the initial state
        setTitle("");
        setDescription("");
        setSpecific("");
        setMeasurable("");
        setAchievable("");
        setRelevant("");
        setTimeBound("");
        setInitialGoal("");
        setIsRefined(false); // Show the simple input field first
      }
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  // --- [NEW] Function to call the AI and refine the goal ---
  const handleAiRefine = async () => {
    if (!initialGoal.trim()) {
      toast.error("Please enter a goal to get started.");
      return;
    }
    setIsRefining(true);
    try {
      const response = await apiClient.post("/ai/refine-goal", {
        goal: initialGoal,
      });
      const { title, specific, measurable, achievable, relevant, timeBound } =
        response.data;

      // Populate the form with the AI's suggestions
      setTitle(title);
      setSpecific(specific);
      setMeasurable(measurable);
      setAchievable(achievable);
      setRelevant(relevant);
      setTimeBound(timeBound);

      setIsRefined(true); // Switch to the detailed S.M.A.R.T. view
    } catch (error) {
      console.error("Failed to refine goal with AI:", error);
      toast.error("Could not refine goal. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title ||
      !specific ||
      !measurable ||
      !achievable ||
      !relevant ||
      !timeBound
    ) {
      toast.error("Please fill out the Title and all S.M.A.R.T. goal fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        title,
        description,
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
      });
    } catch (error) {
      // Error is handled by the parent component's toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInputClass =
    "mt-1 block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const formLabelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
          {goal ? "Edit Goal" : "Add New Goal"}
        </h3>

        {/* --- [NEW] Conditional rendering for AI vs. S.M.A.R.T. form --- */}
        {!isRefined ? (
          <div className="space-y-4">
            <label htmlFor="initial-goal" className={formLabelClass}>
              What is your goal?
            </label>
            <textarea
              id="initial-goal"
              value={initialGoal}
              onChange={(e) => setInitialGoal(e.target.value)}
              className={formInputClass}
              rows={3}
              placeholder="e.g., 'Become a software engineer' or 'Get better at public speaking'"
            />
            <button
              type="button"
              onClick={handleAiRefine}
              disabled={isRefining}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-70"
            >
              {isRefining ? (
                <Spinner />
              ) : (
                <>
                  <MagicWandIcon /> Refine with AI ✨
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="title" className={formLabelClass}>
                Goal Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={formInputClass}
              />
            </div>
            <div>
              <label htmlFor="description" className={formLabelClass}>
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={formInputClass}
                rows={2}
              />
            </div>
            <div>
              <label htmlFor="specific" className={formLabelClass}>
                Specific
              </label>
              <input
                type="text"
                id="specific"
                value={specific}
                onChange={(e) => setSpecific(e.target.value)}
                required
                className={formInputClass}
                placeholder="What exactly do I want to accomplish?"
              />
            </div>
            <div>
              <label htmlFor="measurable" className={formLabelClass}>
                Measurable
              </label>
              <input
                type="text"
                id="measurable"
                value={measurable}
                onChange={(e) => setMeasurable(e.target.value)}
                required
                className={formInputClass}
                placeholder="How will I track my progress?"
              />
            </div>
            <div>
              <label htmlFor="achievable" className={formLabelClass}>
                Achievable
              </label>
              <input
                type="text"
                id="achievable"
                value={achievable}
                onChange={(e) => setAchievable(e.target.value)}
                required
                className={formInputClass}
                placeholder="Is this goal realistic?"
              />
            </div>
            <div>
              <label htmlFor="relevant" className={formLabelClass}>
                Relevant
              </label>
              <input
                type="text"
                id="relevant"
                value={relevant}
                onChange={(e) => setRelevant(e.target.value)}
                required
                className={formInputClass}
                placeholder="Why is this goal important to me?"
              />
            </div>
            <div>
              <label htmlFor="timeBound" className={formLabelClass}>
                Time-bound
              </label>
              <input
                type="text"
                id="timeBound"
                value={timeBound}
                onChange={(e) => setTimeBound(e.target.value)}
                required
                className={formInputClass}
                placeholder="What is the deadline?"
              />
            </div>
            <div className="flex justify-between items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsRefined(false)}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline"
              >
                &larr; Start Over
              </button>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center w-28"
                >
                  {isSubmitting ? <Spinner /> : goal ? "Save" : "Add Goal"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GoalModal;
