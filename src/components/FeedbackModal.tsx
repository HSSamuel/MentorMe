import React, { useState } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

interface FeedbackModalProps {
  session: any;
  onClose: () => void;
  onFeedbackSubmitted: (updatedSession: any) => void;
}

const FeedbackModal = ({
  session,
  onClose,
  onFeedbackSubmitted,
}: FeedbackModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (user?.role === "MENTEE" && rating === 0) {
      setError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      const payload = {
        comment,
        ...(user?.role === "MENTEE" && { rating }),
      };

      const response = await apiClient.put(
        `/sessions/${session.id}/feedback`,
        payload
      );
      onFeedbackSubmitted(response.data);
      onClose();
    } catch (err) {
      setError("Failed to submit feedback.");
    }
  };

  const StarRating = () => (
    <div className="flex items-center justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setRating(star)}
          className={`text-4xl transition-colors ${
            star <= rating
              ? "text-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg m-4">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Share Your Feedback
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Session with{" "}
          {user?.role === "MENTOR"
            ? session.mentee.profile.name
            : session.mentor.profile.name}{" "}
          on {new Date(session.date).toLocaleDateString()}
        </p>
        <form onSubmit={handleSubmit}>
          {user?.role === "MENTEE" && (
            <div className="mb-6">
              <label className="block text-center text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <StarRating />
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Share your thoughts on the session..."
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
