import React from "react";

interface FilterSidebarProps {
  skills: string[];
  selectedSkill: string;
  onSkillChange: (skill: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minExperience: number;
  onMinExperienceChange: (experience: number) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

const FilterSidebar = ({
  skills,
  selectedSkill,
  onSkillChange,
  searchQuery,
  onSearchChange,
  minExperience,
  onMinExperienceChange,
  language,
  onLanguageChange,
}: FilterSidebarProps) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg sticky top-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h3>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="search-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Search by Name or Bio
            </label>
            <input
              id="search-filter"
              type="text"
              placeholder="e.g., John Doe"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="skill-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Skill
            </label>
            <select
              id="skill-filter"
              value={selectedSkill}
              onChange={(e) => onSkillChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Skills</option>
              {skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="experience-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Minimum Years of Experience
            </label>
            <input
              id="experience-filter"
              type="number"
              min="0"
              value={minExperience}
              onChange={(e) =>
                onMinExperienceChange(parseInt(e.target.value, 10))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="language-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Language
            </label>
            <input
              id="language-filter"
              type="text"
              placeholder="e.g., English"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
