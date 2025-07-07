import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

const availableSkills = [
  "Virtual Assistant",
  "UI/UX Designer",
  "Software Development",
  "Video Editing",
  "Cybersecurity",
  "DevOps & Automation",
  "AI/ML",
  "Data Science",
  "Digital Marketing",
  "Graphic Design",
  "Project Management",
  "Content Creation",
  "Internet of Things (IoT)",
  "Cloud Computing",
  "Quantum Computing",
];

const ProfileEditPage = () => {
  const { user, refetchUser, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
    goals: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const isCalendarConnected = !!user?.googleAccessToken;

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.name || "",
        bio: user.profile.bio || "",
        skills: user.profile.skills || [],
        goals: user.profile.goals || "",
      });
      if (user.profile.avatarUrl) {
        setPreview(
          `${apiClient.defaults.baseURL}${user.profile.avatarUrl}`.replace(
            "/api",
            ""
          )
        );
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSkillChange = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = new FormData();
    submissionData.append("name", formData.name);
    submissionData.append("bio", formData.bio);
    submissionData.append("goals", formData.goals);
    formData.skills.forEach((skill) => submissionData.append("skills", skill));
    if (avatarFile) {
      submissionData.append("avatar", avatarFile);
    }
    const promise = apiClient.put("/users/me/profile", submissionData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.promise(promise, {
      loading: "Saving your profile...",
      success: () => {
        refetchUser();
        setTimeout(() => navigate("/dashboard"), 1000);
        return "Profile updated successfully!";
      },
      error: (err) => `Error: ${err.response?.data?.message || err.message}`,
    });
  };

  const handleConnectCalendar = () => {
    window.location.href = `${apiClient.defaults.baseURL}/calendar/google?token=${token}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
    >
      {/* --- Start of Beautified Left Column --- */}
      <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="relative w-32 h-32 mx-auto group">
            <img
              src={
                preview ||
                `https://ui-avatars.com/api/?name=${
                  formData.name || "User"
                }&background=random&color=fff&size=128`
              }
              alt="Profile Preview"
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800 truncate">
            {formData.name}
          </h2>
          <p className="text-gray-500 truncate">{user?.email}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Integrations
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Google Calendar</p>
              <p
                className={`text-sm ${
                  isCalendarConnected ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isCalendarConnected ? "Connected" : "Not Connected"}
              </p>
            </div>
            {!isCalendarConnected && (
              <button
                type="button"
                onClick={handleConnectCalendar}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
      {/* --- End of Beautified Left Column --- */}

      {/* Right Column: Profile Details Form */}
      <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Your Profile
        </h2>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700"
            >
              Short Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>
          <div>
            <label
              htmlFor="goals"
              className="block text-sm font-medium text-gray-700"
            >
              Your Goals
            </label>
            <input
              type="text"
              id="goals"
              placeholder="e.g., Improve product design skills"
              value={formData.goals}
              onChange={(e) =>
                setFormData({ ...formData, goals: e.target.value })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleSkillChange(skill)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="w-full px-6 py-3 border-none rounded-lg bg-blue-600 text-white text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProfileEditPage;
