import React, { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { Link } from "react-router-dom";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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

  const handleAddTimeSlot = (day: string) => {
    setAvailability([
      ...availability,
      { day, startTime: "10:00", endTime: "11:00" },
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

    for (const slot of availability) {
      if (slot.startTime >= slot.endTime) {
        setError(
          `Error in ${slot.day}'s time slot: End time must be after start time.`
        );
        return;
      }
    }

    try {
      await apiClient.post("/sessions/availability", { availability });
      setSuccess("Your availability has been updated successfully!");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to save availability. Please try again.";
      setError(errorMessage);
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500">Loading your schedule...</p>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          Set Your Weekly Availability
        </h1>
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-2 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700"
        >
          Save Availability
        </button>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg">
        {availability.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-700">
              Your calendar is empty
            </h3>
            <p className="text-gray-500 my-2">
              Add your available time slots to start receiving session requests.
            </p>
            <button
              onClick={() => handleAddTimeSlot("Monday")}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              + Add Your First Time Slot
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {daysOfWeek.map((day) => (
            <div key={day} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-lg text-center mb-4">{day}</h4>
              <div className="space-y-4">
                {availability
                  .filter((slot) => slot.day === day)
                  .map((slot, index) => {
                    const originalIndex = availability.findIndex(
                      (s) => s === slot
                    );
                    return (
                      <div
                        key={originalIndex}
                        className="p-3 bg-white rounded-lg shadow-sm border"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleInputChange(
                                originalIndex,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border rounded-md"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleInputChange(
                                originalIndex,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border rounded-md"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveTimeSlot(originalIndex)}
                          className="text-xs text-red-500 hover:underline mt-2"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                <button
                  onClick={() => handleAddTimeSlot(day)}
                  className="w-full py-2 text-sm text-blue-500 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  + Add Time
                </button>
              </div>
            </div>
          ))}
        </div>

        {availability.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            {success && (
              <p className="text-green-500 text-sm text-center mb-4">
                {success}
              </p>
            )}
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-8 py-3 border-none rounded-lg bg-blue-600 text-white text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700"
            >
              Save All Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetAvailabilityPage;
