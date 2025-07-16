import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// A simple spinner component for the button
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any) => Promise<void>; // Expecting an async function
  goal?: any | null;
}

const GoalModal = ({ isOpen, onClose, onSave, goal }: GoalModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timeBound, setTimeBound] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || "");
      setSpecific(goal.specific || "");
      setMeasurable(goal.measurable || "");
      setAchievable(goal.achievable || "");
      setRelevant(goal.relevant || "");
      setTimeBound(goal.timeBound || "");
    } else {
      // Reset all fields for a new goal
      setTitle("");
      setDescription("");
      setSpecific("");
      setMeasurable("");
      setAchievable("");
      setRelevant("");
      setTimeBound("");
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

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
          <div className="flex justify-end gap-4 pt-2">
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
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
