import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

const ProfileCompleteness = ({
  name,
  bio,
  skills,
  goals,
}: {
  name: string;
  bio: string;
  skills: string[];
  goals: string;
}) => {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    let score = 0;
    if (name) score += 25;
    if (bio) score += 25;
    if (skills.length > 0) score += 25;
    if (goals) score += 25;
    setCompletion(score);
  }, [name, bio, skills, goals]);

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-blue-700 dark:text-blue-300">
          Profile Completeness
        </span>
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {completion}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${completion}%` }}
        ></div>
      </div>
    </div>
  );
};

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
        const url = user.profile.avatarUrl;
        if (url.startsWith("http")) {
          setPreview(url);
        } else {
          setPreview(`${apiClient.defaults.baseURL}${url}`.replace("/api", ""));
        }
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

    if (
      !formData.name.trim() ||
      !formData.bio.trim() ||
      !formData.goals.trim()
    ) {
      toast.error("Please fill out your Name, Bio, and Goals before saving.");
      return;
    }

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
    <div className="py-8 -m-8 px-8 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
      >
        {/* --- Left Column --- */}
        <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-lg shadow-lg text-center">
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
            <h2 className="mt-4 text-2xl font-bold text-white truncate">
              {formData.name}
            </h2>
            <p className="text-blue-200 truncate">{user?.email}</p>
            {user?.role === "MENTOR" && (
              <div className="mt-4 border-t border-blue-400 pt-4">
                <Link
                  to={`/mentor/${user?.id}`}
                  target="_blank"
                  className="inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/30"
                >
                  View Public Profile &rarr;
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Integrations
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Google Calendar
                </p>
                <p
                  className={`text-sm ${
                    isCalendarConnected
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isCalendarConnected ? "Connected" : "Not Connected"}
                </p>
              </div>
              {!isCalendarConnected && (
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Edit Your Profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            A complete profile helps you get better matches.
          </p>

          <ProfileCompleteness {...formData} />

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Short Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Tell us a bit about yourself, your experience, and what you can help with."
              />
            </div>
            <div>
              <label
                htmlFor="goals"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Your Goals
              </label>
              <input
                type="text"
                id="goals"
                placeholder="e.g., Improve product design skills, land a senior role"
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="w-full px-6 py-3 border-none rounded-lg bg-green-600 text-white text-lg font-semibold cursor-pointer transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditPage;
