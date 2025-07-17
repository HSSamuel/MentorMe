import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axios";

// Define the structure of the mentor object
interface Mentor {
  id: string;
  profile: {
    name: string;
    bio: string;
    skills: string[];
    avatarUrl?: string;
  };
}

const MentorCard = ({ mentor }: { mentor: Mentor }) => {
  // Function to construct the avatar URL
  const getAvatarUrl = () => {
    if (!mentor.profile?.avatarUrl) {
      return `https://ui-avatars.com/api/?name=${
        mentor.profile?.name || "Mentor"
      }&background=random&color=fff`;
    }
    const url = mentor.profile.avatarUrl;
    // Check if the URL is absolute or needs the base URL
    if (url.startsWith("http")) {
      return url;
    }
    // Construct the full URL if it's a relative path
    return `${apiClient.defaults.baseURL}${url}`.replace("/api", "");
  };

  return (
    <div className="group relative block h-full bg-white dark:bg-gray-800 before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-dashed before:border-gray-900 dark:before:border-gray-100">
      <div className="h-full rounded-xl border-2 border-gray-900 dark:border-gray-100 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/50 dark:via-purple-900/50 dark:to-pink-900/50 p-6 transition group-hover:-translate-y-2 group-hover:-translate-x-2">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <img
            src={getAvatarUrl()}
            alt={mentor.profile.name}
            className="h-24 w-24 rounded-full object-cover shadow-lg mb-4 ring-4 ring-white dark:ring-gray-700"
          />
          {/* Mentor Name */}
          <h5 className="text-xl font-bold text-gray-900 dark:text-white">
            {mentor.profile.name}
          </h5>
          {/* Mentor Bio */}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {mentor.profile.bio.substring(0, 100)}...
          </p>
        </div>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {mentor.profile.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-block rounded-full bg-white/70 dark:bg-gray-700/50 px-3 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* View Profile Button */}
        <div className="mt-6 text-center">
          <Link
            to={`/users/${mentor.id}`}
            className="inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-400"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
