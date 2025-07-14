import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

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
  id: number; // Use a unique ID for each block for better state management
  days: string[];
  startTime: string;
  endTime: string;
}

const SetAvailabilityPage = () => {
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching ---
  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/sessions/availability/me");
      if (response.data && response.data.length > 0) {
        // Group slots by time to create blocks
        const blocks = response.data.reduce((acc: any, slot: any) => {
          const key = `${slot.startTime}-${slot.endTime}`;
          if (!acc[key]) {
            acc[key] = {
              id: Math.random(),
              startTime: slot.startTime,
              endTime: slot.endTime,
              days: [],
            };
          }
          acc[key].days.push(slot.day);
          return acc;
        }, {});
        setAvailability(Object.values(blocks));
      } else {
        // If there is no availability, clear the local state
        setAvailability([]);
      }
    } catch (err) {
      console.log("No existing availability found or error fetching.");
      setAvailability([]); // Clear on error as well
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // --- State Handlers ---
  const handleAddBlock = () => {
    setAvailability([
      ...availability,
      {
        id: Date.now(),
        days: [],
        startTime: "09:00",
        endTime: "17:00",
      },
    ]);
  };

  const handleRemoveBlock = (id: number) => {
    setAvailability(availability.filter((block) => block.id !== id));
  };

  const handleBlockChange = (
    id: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setAvailability(
      availability.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      )
    );
  };

  const handleDayToggle = (id: number, day: string) => {
    setAvailability(
      availability.map((block) => {
        if (block.id === id) {
          const days = block.days.includes(day)
            ? block.days.filter((d) => d !== day)
            : [...block.days, day];
          return { ...block, days };
        }
        return block;
      })
    );
  };

  // --- Submission and Deletion Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const flatAvailability = availability.flatMap((block) =>
      block.days.map((day) => ({
        day,
        startTime: block.startTime,
        endTime: block.endTime,
      }))
    );

    for (const slot of flatAvailability) {
      if (slot.startTime >= slot.endTime) {
        toast.error(
          `Error in a time slot for ${slot.day}: End time must be after start time.`
        );
        return;
      }
    }

    const promise = apiClient.post("/sessions/availability", {
      availability: flatAvailability,
    });

    toast.promise(promise, {
      loading: "Saving availability...",
      success: (res) => {
        // Re-fetch the availability to show the saved state
        fetchAvailability();
        return "Availability updated successfully!";
      },
      error: (err) =>
        err.response?.data?.message ||
        "Failed to save availability. Please try again.",
    });
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear your entire weekly availability?"
      )
    ) {
      const promise = apiClient.post("/sessions/availability", {
        availability: [], // Send an empty array to clear
      });

      toast.promise(promise, {
        loading: "Clearing your availability...",
        success: () => {
          setAvailability([]); // Clear state locally
          return "Your availability has been cleared.";
        },
        error: "Failed to clear availability.",
      });
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500">Loading your schedule...</p>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Form for setting availability */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Set Your Weekly Availability
        </h1>
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-2 border-none rounded-lg bg-blue-600 text-white font-semibold cursor-pointer transition-colors hover:bg-blue-700"
        >
          Save Availability
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-8 rounded-lg shadow-lg space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define blocks of time when you are typically available for mentorship
          sessions each week. You can add multiple blocks to accommodate breaks.
        </p>

        {availability.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <button
              onClick={handleAddBlock}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              + Add Your First Time Slot
            </button>
          </div>
        )}

        {availability.map((block) => (
          <div
            key={block.id}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600"
          >
            {/* Time Inputs */}
            <div className="flex items-center gap-4 mb-4">
              <input
                type="time"
                value={block.startTime}
                onChange={(e) =>
                  handleBlockChange(block.id, "startTime", e.target.value)
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <span className="font-semibold dark:text-gray-300">-</span>
              <input
                type="time"
                value={block.endTime}
                onChange={(e) =>
                  handleBlockChange(block.id, "endTime", e.target.value)
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <button
                onClick={() => handleRemoveBlock(block.id)}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove time block"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            {/* Day Toggles */}
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(block.id, day)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    block.days.includes(day)
                      ? "bg-blue-600 text-white shadow"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        ))}

        {availability.length > 0 && (
          <>
            <button
              onClick={handleAddBlock}
              className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50"
            >
              + Add another time block
            </button>
            <div className="text-center mt-4">
              <button
                onClick={handleClearAll}
                className="text-sm text-red-500 hover:underline"
              >
                Clear All Availability
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetAvailabilityPage;
