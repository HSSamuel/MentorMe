import React from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";
import { formatLastSeen } from "../utils/timeFormat"; // [Add] Import the helper

// A simple spinner component (kept for reference, though button moved)
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
    lastSeen?: string; // [Modify] Add lastSeen to mentor prop
  };
  // isAlreadyRequested: boolean; // [Remove] This prop is no longer needed here
}

const MentorCard = ({ mentor }: MentorCardProps) => {
  // [Modify] Removed isAlreadyRequested from props
  // Removed isRequested, isLoading, error states and handleRequestMentorship function as button logic moved

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
    // [Modify] Wrap the entire card in a Link component for navigation
    <Link
      to={`/mentor/${mentor.id}`} // Navigate to the mentor's profile page
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full cursor-pointer"
    >
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
            {mentor.lastSeen && ( // [Add] Display lastSeen if available
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {formatLastSeen(mentor.lastSeen)}
              </p>
            )}
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

      {/* [Remove] The button container section is removed from here */}
    </Link>
  );
};

export default MentorCard;
