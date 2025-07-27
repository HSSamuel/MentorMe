import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/axios";
import MentorCard from "../components/MentorCard";
import FilterSidebar from "../components/FilterSidebar";
import { StatCardSkeleton } from "../components/StatCardSkeleton"; // Using a skeleton for loading

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

  // --- NEW STATE TO MANAGE VIEW ---
  const [viewMode, setViewMode] = useState<"recommended" | "browse">(
    "recommended"
  );

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

      // --- Conditional mentor fetching based on viewMode ---
      if (viewMode === "recommended") {
        // --- THIS IS THE FIX ---
        // Updated the endpoint to match the backend controller
        const mentorsRes = await apiClient.get("/users/mentors/recommended");
        // --------------------
        setMentors(mentorsRes.data);
        setFilteredMentors(mentorsRes.data); // Directly set the mentors list
        setTotalPages(1); // Recommendations are a single page
        setCurrentPage(1);
      } else {
        // 'browse' mode
        const mentorsRes = await apiClient.get(
          `/users/mentors?page=${currentPage}&limit=9`
        );
        setMentors(mentorsRes.data.mentors);
        setFilteredMentors(mentorsRes.data.mentors); // Initially same as fetched mentors
        setTotalPages(mentorsRes.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMentors([]); // Reset on error
      setFilteredMentors([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, currentPage]); // Dependency array now includes viewMode

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- EXISTING FILTERING LOGIC ---
  // This effect now only runs when in 'browse' mode and filters change.
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
      // When in recommended view, always show the full recommended list
      setFilteredMentors(mentors);
    }
  }, [selectedSkill, searchQuery, minExperience, language, mentors, viewMode]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* --- CONDITIONAL RENDERING OF SIDEBAR --- */}
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
        {/* --- NEW VIEW MODE TOGGLE BUTTONS --- */}
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
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {viewMode === "recommended"
            ? "Top Mentor Matches"
            : "Find Your Mentor"}
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
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
            {/* --- CONDITIONAL RENDERING OF PAGINATION --- */}
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
      </div>
    </div>
  );
};

export default MentorListPage;
