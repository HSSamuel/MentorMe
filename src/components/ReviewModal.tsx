import React, { useState } from 'react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reviewData: { rating: number; comment: string; }) => void;
    mentorName: string;
}

const StarRatingInput = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => (
    <div className="flex items-center justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setRating(star)}
          className={`text-4xl transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
);

const ReviewModal = ({ isOpen, onClose, onSubmit, mentorName }: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }
        onSubmit({ rating, comment });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg m-4">
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Leave a Review for {mentorName}
                </h3>
                <p className="text-center text-gray-500 mb-6">
                    Your feedback helps other mentees find the right mentor.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-center text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                        <StarRatingInput rating={rating} setRating={setRating} />
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Your Comments (Optional)</label>
                        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)}
                            className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Share your experience..."
                        />
                    </div>
                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            Submit Review
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
