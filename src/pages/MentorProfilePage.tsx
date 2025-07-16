import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Removed useNavigate, as it's not directly used for redirection within this component anymore.
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { formatLastSeen } from "../utils/timeFormat";

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
      <span className="text-gray-600 text-sm">({totalReviews} reviews)</span>
    </div>
  );
};

// [RENAMED]: Component from MentorProfilePage to UserProfilePage
const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState<any>(null); // [MODIFIED]: Renamed state to profileUser
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

  const checkIfAlreadyRequested = async () => {
    if (user && user.role === "MENTEE" && id) {
      try {
        const response = await apiClient.get(`/requests/status/${id}`);
        if (response.data.exists) {
          setIsRequested(true);
          setMentorshipRequestStatus(response.data.status);
        } else {
          setIsRequested(false);
          setMentorshipRequestStatus(null);
        }
      } catch (err) {
        console.warn("Could not check mentorship request status:", err);
        setIsRequested(false);
        setMentorshipRequestStatus(null);
      }
    } else if (user && user.role !== "MENTEE") {
      setIsRequested(true);
      setMentorshipRequestStatus("N/A");
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // [MODIFIED]: Call generic user profile endpoint
        const [userRes, reviewsRes] = await Promise.all([
          apiClient.get(`/users/${id}`), // [MODIFIED]: Changed API endpoint
          apiClient.get(`/reviews/mentor/${id}`), // Still assumes reviews are only for mentors
        ]);

        setProfileUser(userRes.data); // [MODIFIED]: Set to profileUser state
        // Only set reviews if the fetched user is a mentor
        if (userRes.data.role === "MENTOR") {
          setReviews(reviewsRes.data);
          if (reviewsRes.data.length > 0) {
            const totalRating = reviewsRes.data.reduce(
              (acc: number, review: any) => acc + review.rating,
              0
            );
            setAvgRating(totalRating / reviewsRes.data.length);
          }
        } else {
          setReviews([]); // Clear reviews if not a mentor
          setAvgRating(0);
        }

        if (user) {
          await checkIfAlreadyRequested();
        }
      } catch (err) {
        setError("User profile not found or an error occurred."); // [MODIFIED]: Error message
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [id, user]);

  const handleRequestMentorship = async () => {
    setRequestError("");
    setIsRequestLoading(true);
    try {
      await apiClient.post("/requests", { mentorId: profileUser.id }); // [MODIFIED]: Use profileUser.id
      setIsRequested(true);
      setMentorshipRequestStatus("PENDING");
    } catch (err: any) {
      const errorMessage =
        err.response?.status === 409
          ? "You have already sent a request to this mentor."
          : "Failed to send request. Please try again.";
      setRequestError(errorMessage);
      console.error(err);
    } finally {
      setIsRequestLoading(false);
    }
  };

  if (isLoading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading user profile... {/* [MODIFIED]: Loading message */}
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  if (!profileUser) {
    // [MODIFIED]: Check profileUser
    return (
      <p className="text-center text-gray-500 mt-10">
        This user could not be found. {/* [MODIFIED]: Not found message */}
      </p>
    );
  }

  const getAvatarUrl = () => {
    if (profileUser.profile?.avatarUrl) {
      // [MODIFIED]: Use profileUser.profile
      return profileUser.profile.avatarUrl.startsWith("http")
        ? profileUser.profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profileUser.profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profileUser.profile.name // [MODIFIED]: Use profileUser.profile.name
    )}&background=random&color=fff`;
  };

  let buttonText = "Request Mentorship";
  if (isRequested) {
    switch (mentorshipRequestStatus) {
      case "PENDING":
        buttonText = "Request Pending...";
        break;
      case "ACCEPTED":
        buttonText = "Mentorship Accepted!";
        break;
      case "REJECTED":
        buttonText = "Request Rejected";
        break;
      case "CANCELLED":
        buttonText = "Request Cancelled";
        break;
      default:
        buttonText = "Request Sent ✓";
    }
  }
  if (isRequestLoading) {
    buttonText = <Spinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-gray-900 rounded-lg shadow-xl dark:shadow-none overflow-hidden">
        {/* [MODIFIED] Added gradient for light mode and refined dark mode */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <img
              src={getAvatarUrl()}
              alt={`Avatar of ${profileUser.profile.name}`} // [MODIFIED]: Use profileUser.profile.name
              className="w-32 h-32 rounded-full object-cover flex-shrink-0 mb-6 md:mb-0 md:mr-8 border-2 border-blue-200 dark:border-blue-700"
            />
            <div className="flex-grow">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {profileUser.profile.name}{" "}
                {/* [MODIFIED]: Use profileUser.profile.name */}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {profileUser.role} {/* [ADD]: Display user's role */}
              </p>
              {profileUser.role === "MENTOR" &&
                reviews.length > 0 && ( // [MODIFIED]: Only show rating if mentor
                  <div className="mt-2 flex justify-center md:justify-start">
                    <StarRatingDisplay
                      rating={avgRating}
                      totalReviews={reviews.length}
                    />
                  </div>
                )}
              {profileUser.lastSeen && ( // [MODIFIED]: Use profileUser.lastSeen
                <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">
                  {" "}
                  {/* [MODIFIED] text-gray-300 for dark mode for better visibility */}
                  {formatLastSeen(profileUser.lastSeen)}{" "}
                  {/* [MODIFIED]: Use profileUser.lastSeen */}
                </p>
              )}
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-200">
                {profileUser.profile.bio}
              </p>{" "}
              {/* [MODIFIED] text-gray-200 for dark mode for better visibility */}
              {/* [MODIFIED START]: Conditional buttons/messages based on roles and self-view */}
              {user && user.id === id ? (
                // If viewing their own profile
                <Link
                  to="/profile/edit"
                  className="mt-6 inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit My Profile
                </Link>
              ) : (
                // If viewing another user's profile
                user &&
                user.role === "MENTEE" &&
                profileUser.role === "MENTOR" && (
                  // Only mentee can request mentor
                  <button
                    onClick={handleRequestMentorship}
                    disabled={isRequested || isRequestLoading}
                    className={`mt-6 inline-block px-8 py-3 text-lg font-semibold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex justify-center items-center ${
                      isRequested
                        ? mentorshipRequestStatus === "ACCEPTED"
                          ? "bg-green-600 cursor-not-allowed"
                          : "bg-blue-500 cursor-not-allowed"
                        : isRequestLoading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                    }`}
                  >
                    {buttonText}
                  </button>
                )
              )}
              {user && user.id !== id && profileUser.role === "MENTEE" && (
                // If logged-in user is not viewing their own profile and the viewed profile is a mentee
                <p className="mt-6 text-gray-600 dark:text-gray-300 text-sm">
                  This is a mentee profile.
                </p>
              )}
              {user &&
                user.id !== id &&
                user.role === "MENTOR" &&
                profileUser.role === "MENTOR" && (
                  // Mentor viewing another mentor
                  <p className="mt-6 text-gray-600 dark:text-gray-300 text-sm">
                    You are both mentors. Direct mentorship requests are
                    typically mentee-to-mentor.
                  </p>
                )}
              {!user && (
                // Not logged in
                <p className="mt-6 text-gray-600 dark:text-gray-300 text-sm">
                  Log in to interact with this user.
                </p>
              )}
              {requestError && (
                <p className="text-red-500 text-sm text-center mt-2">
                  {requestError}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 px-8 py-6">
          {" "}
          {/* [MODIFIED] Changed background for light/dark mode */}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {" "}
            {/* [MODIFIED] text color */}
            Skills & Expertise
          </h3>
          <div className="flex flex-wrap gap-3">
            {profileUser.profile.skills.map(
              (
                skill: string // [MODIFIED]: Use profileUser.profile.skills
              ) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section - Only show if the user is a MENTOR and has reviews */}
      {profileUser.role === "MENTOR" && (
        // [ADD]: Conditionally display reviews section
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            What Mentees Are Saying
          </h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"
                >
                  {" "}
                  {/* [MODIFIED] Changed background for dark mode */}
                  <div className="flex items-center mb-2">
                    <StarRatingDisplay
                      rating={review.rating}
                      totalReviews={0}
                    />
                    <p className="ml-4 font-bold text-gray-800 dark:text-gray-200">
                      {review.mentorshipRequest.mentee.profile.name}
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
  );
};

export default UserProfilePage;
