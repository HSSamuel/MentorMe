import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/axios";
import MentorCard from "../components/MentorCard";
import FilterSidebar from "../components/FilterSidebar";
import { StatCardSkeleton } from "../components/StatCardSkeleton";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// --- NEW: Group Session Card Component ---
const GroupSessionCard = ({
  session,
  onJoin,
}: {
  session: any;
  onJoin: (sessionId: string) => void;
}) => {
  const { user } = useAuth();
  const isAlreadyJoined = session.participants?.some(
    (p: any) => p.menteeId === user?.id
  );
  const isFull =
    session.maxParticipants &&
    session._count.participants >= session.maxParticipants;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {session.topic}
        </h3>
        <div className="flex items-center mb-4">
          <img
            src={
              session.mentor.profile?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${session.mentor.profile?.name}&background=random&color=fff`
            }
            alt={session.mentor.profile?.name}
            className="w-8 h-8 rounded-full mr-3 object-cover"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hosted by{" "}
            <Link
              to={`/mentor/${session.mentor.id}`}
              className="text-blue-600 hover:underline"
            >
              {session.mentor.profile?.name}
            </Link>
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {new Date(session.date).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
          </svg>
          <span>
            {session._count.participants} / {session.maxParticipants} spots
            filled
          </span>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-4">
        <button
          onClick={() => onJoin(session.id)}
          disabled={isAlreadyJoined || isFull}
          className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isAlreadyJoined
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : isFull
              ? "bg-red-400 text-white cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isAlreadyJoined
            ? "Already Joined"
            : isFull
            ? "Session Full"
            : "Join the Circle"}
        </button>
      </div>
    </div>
  );
};

const MentorListPage = () => {
  // --- EXISTING STATE ---
  const [mentors, setMentors] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestedMentorIds, setRequestedMentorIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [language, setLanguage] = useState("");

  // --- UPDATED STATE TO MANAGE VIEW ---
  const [viewMode, setViewMode] = useState<
    "recommended" | "browse" | "circles"
  >("recommended");
  const [groupSessions, setGroupSessions] = useState<any[]>([]); // New state for group sessions

  // --- MODIFIED DATA FETCHING LOGIC ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch skills and sent requests regardless of the mode.
      const [skillsRes, requestsRes] = await Promise.all([
        apiClient.get("/users/skills"),
        apiClient.get("/requests/sent"),
      ]);
      setAllSkills(skillsRes.data);
      const requestedIds = new Set(
        requestsRes.data.map((req: any) => req.mentorId)
      );
      setRequestedMentorIds(requestedIds);

      // --- Conditional data fetching based on viewMode ---
      if (viewMode === "recommended") {
        const mentorsRes = await apiClient.get("/users/mentors/recommended");
        setMentors(mentorsRes.data);
        setFilteredMentors(mentorsRes.data);
        setTotalPages(1);
        setCurrentPage(1);
      } else if (viewMode === "browse") {
        const mentorsRes = await apiClient.get(
          `/users/mentors?page=${currentPage}&limit=9`
        );
        setMentors(mentorsRes.data.mentors);
        setFilteredMentors(mentorsRes.data.mentors);
        setTotalPages(mentorsRes.data.totalPages);
      } else if (viewMode === "circles") {
        const groupSessionsRes = await apiClient.get("/sessions/group");
        setGroupSessions(groupSessionsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMentors([]);
      setFilteredMentors([]);
      setGroupSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- EXISTING FILTERING LOGIC ---
  useEffect(() => {
    if (viewMode === "browse") {
      let result = mentors;
      if (selectedSkill) {
        result = result.filter((m: any) =>
          m.profile.skills.includes(selectedSkill)
        );
      }
      if (searchQuery) {
        result = result.filter(
          (m: any) =>
            m.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.profile.bio.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (minExperience > 0) {
        result = result.filter(
          (m: any) => m.profile.yearsOfExperience >= minExperience
        );
      }
      if (language) {
        result = result.filter((m: any) =>
          m.profile.languages?.includes(language)
        );
      }
      setFilteredMentors(result);
    } else {
      setFilteredMentors(mentors);
    }
  }, [selectedSkill, searchQuery, minExperience, language, mentors, viewMode]);

  // --- NEW: Handler for joining a group session ---
  const handleJoinCircle = async (sessionId: string) => {
    const promise = apiClient.post(`/sessions/${sessionId}/join`);
    toast.promise(promise, {
      loading: "Joining the circle...",
      success: () => {
        fetchData(); // Refresh the list of sessions
        return "Successfully joined the circle!";
      },
      error: (err) =>
        err.response?.data?.message || "Failed to join the circle.",
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {viewMode === "browse" && (
        <FilterSidebar
          skills={allSkills}
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          minExperience={minExperience}
          onMinExperienceChange={setMinExperience}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
      <div className="flex-1">
        {/* --- UPDATED VIEW MODE TOGGLE BUTTONS --- */}
        <div className="flex justify-center mb-6 border-b border-gray-200">
          <button
            onClick={() => setViewMode("recommended")}
            className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              viewMode === "recommended"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            ✨ Recommended For You
          </button>
          <button
            onClick={() => setViewMode("browse")}
            className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              viewMode === "browse"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            }`}
          >
            🔍 Browse All Mentors
          </button>
          <button
            onClick={() => setViewMode("circles")}
            className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              viewMode === "circles"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-500 hover:text-green-500"
            }`}
          >
            🧑‍🤝‍🧑 Mentoring Circles
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {viewMode === "recommended"
            ? "Top Mentor Matches"
            : viewMode === "browse"
            ? "Find Your Mentor"
            : "Join a Mentoring Circle"}
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <>
            {/* --- Conditional Rendering based on viewMode --- */}
            {viewMode === "circles" ? (
              groupSessions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {groupSessions.map((session: any) => (
                    <GroupSessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinCircle}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800">
                    No Upcoming Circles
                  </h3>
                  <p className="text-gray-500 mt-2">
                    There are no group sessions scheduled at the moment. Check
                    back soon!
                  </p>
                </div>
              )
            ) : filteredMentors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMentors.map((mentor: any) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      isAlreadyRequested={requestedMentorIds.has(mentor.id)}
                    />
                  ))}
                </div>
                {viewMode === "browse" && totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 gap-4">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800">
                  No Mentors Found
                </h3>
                <p className="text-gray-500 mt-2">
                  {viewMode === "recommended"
                    ? "Update your profile skills and goals for better matches."
                    : "Try adjusting your filters or check back later."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MentorListPage;
