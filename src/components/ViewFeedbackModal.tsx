import React from "react";
import { Star, X } from "lucide-react";

// A simple star rating display component
const StarRatingDisplay = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-6 h-6 ${
          i < rating ? "text-yellow-400" : "text-gray-300"
        }`}
        fill="currentColor"
      />
    ))}
  </div>
);

const ViewFeedbackModal = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Session Feedback
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Rating Provided:
            </p>
            <div className="mt-1">
              {session.rating ? (
                <StarRatingDisplay rating={session.rating} />
              ) : (
                <p>No rating was given.</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Comments:
            </p>
            <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {session.feedback || "No comments were provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFeedbackModal;
