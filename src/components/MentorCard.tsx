import React, { useState } from "react";
import apiClient from "../api/axios";

interface MentorCardProps {
  mentor: {
    id: string;
    profile: {
      name: string;
      bio: string;
      skills: string[];
      goals: string;
    };
  };
}

const MentorCard = ({ mentor }: MentorCardProps) => {
  const [isRequested, setIsRequested] = useState(false);
  const [error, setError] = useState("");

  const handleRequestMentorship = async () => {
    setError("");
    try {
      await apiClient.post("/requests", { mentorId: mentor.id });
      setIsRequested(true);
    } catch (err) {
      setError("Failed to send request. You may have already sent one.");
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {mentor.profile.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {mentor.profile.bio}
        </p>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 text-xs mb-2">SKILLS</h4>
          <div className="flex flex-wrap gap-2">
            {mentor.profile.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleRequestMentorship}
          disabled={isRequested}
          className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRequested
              ? "bg-green-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          }`}
        >
          {isRequested ? "Request Sent ✓" : "Request Mentorship"}
        </button>
        {error && (
          <p className="text-red-500 text-xs text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default MentorCard;
