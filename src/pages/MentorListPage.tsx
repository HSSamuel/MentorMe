import React, { useEffect, useState } from "react";
import apiClient from "../api/axios";
import MentorCard from "../components/MentorCard";
import FilterSidebar from "../components/FilterSidebar";

const MentorListPage = () => {
  const [mentors, setMentors] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedSkill, setSelectedSkill] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [minExperience, setMinExperience] = useState(0);
  const [language, setLanguage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const mentorsRes = await apiClient.get("/users/mentors");
        const skillsRes = await apiClient.get("/users/skills");
        setMentors(mentorsRes.data);
        setFilteredMentors(mentorsRes.data); // Initially show all
        setAllSkills(skillsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
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
  }, [selectedSkill, searchQuery, mentors, minExperience, language]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
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
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Find Your Mentor
        </h1>
        {isLoading ? (
          <p className="text-gray-500">Loading mentors...</p>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMentors.map((mentor: any) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">
              No Mentors Found
            </h3>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorListPage;
