import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface AvailabilityBlock {
  day: string;
  startTime: string;
  endTime: string;
}

const SetAvailabilityPage = () => {
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/sessions/availability/me");
        if (response.data && response.data.length > 0) {
          setAvailability(response.data);
        }
      } catch (err) {
        console.log("No existing availability found or error fetching.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleAddTimeSlot = () => {
    setAvailability([
      ...availability,
      { day: "Monday", startTime: "10:00", endTime: "11:00" },
    ]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    index: number,
    field: keyof AvailabilityBlock,
    value: string
  ) => {
    const updatedAvailability = [...availability];
    updatedAvailability[index] = {
      ...updatedAvailability[index],
      [field]: value,
    };
    setAvailability(updatedAvailability);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/sessions/availability", { availability });
      setSuccess("Your availability has been updated successfully!");
    } catch (err) {
      setError("Failed to save availability. Please check your time slots.");
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500">Loading your schedule...</p>
    );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Set Your Weekly Availability
      </h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {availability.map((slot, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-4 border border-gray-200 rounded-lg"
              >
                <select
                  value={slot.day}
                  onChange={(e) =>
                    handleInputChange(index, "day", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) =>
                    handleInputChange(index, "startTime", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) =>
                    handleInputChange(index, "endTime", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTimeSlot(index)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-lg hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddTimeSlot}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-lg hover:bg-blue-200 transition-colors"
          >
            + Add Time Slot
          </button>

          <div className="mt-8 border-t border-gray-200 pt-6">
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            {success && (
              <p className="text-green-500 text-sm text-center mb-4">
                {success}
              </p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 border-none rounded-lg bg-blue-600 text-white text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700"
            >
              Save Availability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetAvailabilityPage;
