import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";

// A simple spinner component
const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

interface MentorCardProps {
  mentor: {
    id: string;
    profile: {
      name: string;
      bio: string;
      skills: string[];
      goals: string;
      avatarUrl?: string;
    };
  };
  isAlreadyRequested: boolean;
}

const MentorCard = ({ mentor, isAlreadyRequested }: MentorCardProps) => {
  const [isRequested, setIsRequested] = useState(isAlreadyRequested);
  const [isLoading, setIsLoading] = useState(false); // State to handle loading
  const [error, setError] = useState("");

  useEffect(() => {
    setIsRequested(isAlreadyRequested);
  }, [isAlreadyRequested]);

  const handleRequestMentorship = async () => {
    setError("");
    setIsLoading(true); // Start loading
    try {
      await apiClient.post("/requests", { mentorId: mentor.id });
      setIsRequested(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.status === 409
          ? "You have already sent a request to this mentor."
          : "Failed to send request. Please try again.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const getAvatarUrl = () => {
    const { profile } = mentor;
    if (profile?.avatarUrl) {
      return profile.avatarUrl.startsWith("http")
        ? profile.avatarUrl
        : `${apiClient.defaults.baseURL}${profile.avatarUrl}`.replace(
            "/api",
            ""
          );
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.name
    )}&background=random&color=fff`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex items-center mb-4">
          <img
            src={getAvatarUrl()}
            alt={`Avatar of ${mentor.profile.name}`}
            className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-blue-200 dark:border-blue-700"
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {mentor.profile.name}
            </h3>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {mentor.profile.bio}
        </p>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-400 text-xs mb-2 uppercase">
            Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {mentor.profile.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleRequestMentorship}
          disabled={isRequested || isLoading} // Disable button if already requested or while loading
          className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex justify-center items-center ${
            isRequested
              ? "bg-green-500 cursor-not-allowed"
              : isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          }`}
        >
          {isLoading ? (
            <Spinner />
          ) : isRequested ? (
            "Request Sent ✓"
          ) : (
            "Request Mentorship"
          )}
        </button>
        {error && (
          <p className="text-red-500 text-xs text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default MentorCard;
