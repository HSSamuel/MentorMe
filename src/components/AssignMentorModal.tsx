import React, { useState } from "react";

interface AssignMentorModalProps {
  mentors: any[];
  onAssign: (mentorId: string) => void;
  onClose: () => void;
}

const AssignMentorModal = ({
  mentors,
  onAssign,
  onClose,
}: AssignMentorModalProps) => {
  const [selectedMentor, setSelectedMentor] = useState("");

  const handleAssign = () => {
    if (selectedMentor) {
      onAssign(selectedMentor);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md m-4">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Assign a Mentor
        </h3>
        <div className="mb-6">
          <label
            htmlFor="mentor-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select a Mentor from the list
          </label>
          <select
            id="mentor-select"
            value={selectedMentor}
            onChange={(e) => setSelectedMentor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">-- Please select a mentor --</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.profile?.name || mentor.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedMentor}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMentorModal;
