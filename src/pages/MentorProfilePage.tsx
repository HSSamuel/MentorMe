import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

// A simple component to display a star rating
const StarRatingDisplay = ({
  rating,
  totalReviews,
}: {
  rating: number;
  totalReviews: number;
}) => {
  const fullStars = Math.round(rating);
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${
              i < fullStars ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-gray-600 text-sm">({totalReviews} reviews)</span>
    </div>
  );
};

const MentorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch mentor profile and reviews in parallel
        const [mentorRes, reviewsRes] = await Promise.all([
          apiClient.get(`/users/mentor/${id}`),
          apiClient.get(`/reviews/mentor/${id}`),
        ]);

        setMentor(mentorRes.data);
        setReviews(reviewsRes.data);

        if (reviewsRes.data.length > 0) {
          const totalRating = reviewsRes.data.reduce(
            (acc: number, review: any) => acc + review.rating,
            0
          );
          setAvgRating(totalRating / reviewsRes.data.length);
        }
      } catch (err) {
        setError("Mentor not found or an error occurred.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

  if (isLoading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading mentor profile...
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  if (!mentor) {
    return (
      <p className="text-center text-gray-500 mt-10">
        This mentor could not be found.
      </p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <div className="w-32 h-32 rounded-full bg-gray-300 flex-shrink-0 mb-6 md:mb-0 md:mr-8 flex items-center justify-center">
              <span className="text-5xl text-gray-500">
                {mentor.profile.name.charAt(0)}
              </span>
            </div>
            <div className="flex-grow">
              <h1 className="text-4xl font-bold text-gray-900">
                {mentor.profile.name}
              </h1>
              {reviews.length > 0 && (
                <div className="mt-2 flex justify-center md:justify-start">
                  <StarRatingDisplay
                    rating={avgRating}
                    totalReviews={reviews.length}
                  />
                </div>
              )}
              <p className="mt-4 text-lg text-gray-600">{mentor.profile.bio}</p>
              {user && user.role === "MENTEE" && (
                <Link
                  to="/mentors"
                  className="mt-6 inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Request Mentorship
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Skills & Expertise
          </h3>
          <div className="flex flex-wrap gap-3">
            {mentor.profile.skills.map((skill: string) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          What Mentees Are Saying
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="flex items-center mb-2">
                  <StarRatingDisplay rating={review.rating} totalReviews={0} />
                  <p className="ml-4 font-bold text-gray-800">
                    {review.mentorshipRequest.mentee.profile.name}
                  </p>
                </div>
                <p className="text-gray-600 italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            This mentor doesn't have any reviews yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MentorProfilePage;
