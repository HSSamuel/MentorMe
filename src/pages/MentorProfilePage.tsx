import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { formatLastSeen } from "../utils/timeFormat";
import {
  Award,
  User,
  Star,
  MessageSquare,
  CalendarPlus,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";

// A simple spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

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
      {totalReviews > 0 && (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          ({totalReviews} reviews)
        </span>
      )}
    </div>
  );
};

const MentorProfilePage = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRequested, setIsRequested] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [mentorshipRequestStatus, setMentorshipRequestStatus] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      // --- DEBUGGING: Log the mentorId when the component mounts ---
      console.log("Fetching profile for mentorId:", mentorId);

      if (!mentorId) {
        setError("No mentor ID provided in the URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(""); // Reset error state on new fetch

      try {
        const userResPromise = apiClient.get(`/users/${mentorId}`);
        const reviewsResPromise = apiClient.get(`/reviews/mentor/${mentorId}`);

        // --- DEBUGGING: Use Promise.allSettled to see all responses ---
        const results = await Promise.allSettled([
          userResPromise,
          reviewsResPromise,
        ]);

        let userResult, reviewsResult;

        if (results[0].status === "fulfilled") {
          userResult = results[0].value;
          setProfileUser(userResult.data);
        } else {
          // --- DEBUGGING: Log the specific error for the user request ---
          console.error("Error fetching user profile:", results[0].reason);
          throw new Error("Failed to fetch user profile.");
        }

        if (results[1].status === "fulfilled") {
          reviewsResult = results[1].value;
          if (userResult.data.role === "MENTOR") {
            setReviews(reviewsResult.data);
            if (reviewsResult.data.length > 0) {
              const totalRating = reviewsResult.data.reduce(
                (acc: number, review: any) => acc + review.rating,
                0
              );
              setAvgRating(totalRating / reviewsResult.data.length);
            }
          }
        } else {
          // --- DEBUGGING: Log the specific error for the reviews request ---
          console.warn("Could not fetch reviews:", results[1].reason);
          // This is not a critical error, so we don't throw
        }
      } catch (err: any) {
        // --- DEBUGGING: Set a more informative error message ---
        setError(err.message || "An unexpected error occurred.");
        console.error("Full error object:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [mentorId]); 

  const handleRequestMentorship = async () => {
    setRequestError("");
    setIsRequestLoading(true);
    try {
      await apiClient.post("/requests", { mentorId: profileUser.id });
      setIsRequested(true);
      setMentorshipRequestStatus("PENDING");
      toast.success("Mentorship request sent successfully!");
    } catch (err: any) {
      const errorMessage =
        err.response?.status === 409
          ? "You have already sent a request to this mentor."
          : "Failed to send request. Please try again.";
      setRequestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRequestLoading(false);
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 mt-10">Loading user profile...</p>
    );
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!profileUser)
    return (
      <p className="text-center text-gray-500 mt-10">
        This user could not be found.
      </p>
    );

  const getAvatarUrl = () => {
    if (profileUser.profile?.avatarUrl) {
      return profileUser.profile.avatarUrl.startsWith("http")
        ? profileUser.profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profileUser.profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profileUser.profile?.name || profileUser.email
    )}&background=random&color=fff&size=128`;
  };

  let buttonTextContent = "Request Mentorship";
  if (isRequested) {
    switch (mentorshipRequestStatus) {
      case "PENDING":
        buttonTextContent = "Request Pending...";
        break;
      case "ACCEPTED":
        buttonTextContent = "Mentorship Accepted!";
        break;
      case "REJECTED":
        buttonTextContent = "Request Rejected";
        break;
      case "CANCELLED":
        buttonTextContent = "Request Cancelled";
        break;
      default:
        buttonTextContent = "Request Sent ✓";
    }
  }
  const buttonText = isRequestLoading ? <Spinner /> : buttonTextContent;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <img
              src={getAvatarUrl()}
              alt={`Avatar of ${
                profileUser.profile?.name || profileUser.email
              }`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 shadow-lg"
            />
          </div>
          <div className="pt-20 pb-8 px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profileUser.profile?.name || profileUser.email}
            </h1>
            <span
              className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                profileUser.role === "MENTOR"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {profileUser.role === "MENTOR" ? (
                <Award size={16} className="mr-1.5" />
              ) : (
                <User size={16} className="mr-1.5" />
              )}
              {profileUser.role}
            </span>
            {profileUser.role === "MENTOR" && reviews.length > 0 && (
              <div className="mt-3 flex justify-center">
                <StarRatingDisplay
                  rating={avgRating}
                  totalReviews={reviews.length}
                />
              </div>
            )}
            {profileUser.lastSeen && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                {formatLastSeen(profileUser.lastSeen)}
              </p>
            )}
          </div>

          {/* --- UPDATE: Added 'text-center' to this container --- */}
          <div className="border-t dark:border-gray-700 px-8 py-6 space-y-6 text-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                About Me
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {profileUser.profile?.bio || "No bio provided."}
              </p>
            </div>

            {profileUser.profile?.skills &&
              profileUser.profile.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Skills & Expertise
                  </h3>
                  {/* --- UPDATE: Added 'justify-center' to center the skill tags --- */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profileUser.profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            {user && user.id === mentorId ? (
              <Link
                to="/profile/edit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition-all"
              >
                <Edit size={20} /> Edit My Profile
              </Link>
            ) : user &&
              user.role === "MENTEE" &&
              profileUser.role === "MENTOR" ? (
              <>
                <button
                  onClick={handleRequestMentorship}
                  disabled={isRequested || isRequestLoading}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all ${
                    isRequested
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  }`}
                >
                  <MessageSquare size={20} /> {buttonText}
                </button>
                <Link
                  to={`/book-session/${mentorId}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-md transition-all"
                >
                  <CalendarPlus size={20} /> Book a Session
                </Link>
              </>
            ) : null}
          </div>
          {requestError && (
            <p className="text-red-500 text-sm text-center py-2">
              {requestError}
            </p>
          )}
        </div>

        {profileUser.role === "MENTOR" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What Mentees Are Saying
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                  >
                    <div className="flex items-center mb-2">
                      <StarRatingDisplay
                        rating={review.rating}
                        totalReviews={0}
                      />
                      <p className="ml-4 font-bold text-gray-800 dark:text-gray-200">
                        {review.mentorshipRequest?.mentee?.profile?.name ||
                          "A Mentee"}
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                This mentor doesn't have any reviews yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorProfilePage;
