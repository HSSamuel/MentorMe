import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

// Custom styling component to handle dark mode for the calendar
const CalendarStyles = () => (
  <style>{`
    .rbc-calendar {
      color: #374151; /* Default text color for light mode */
    }
    .dark .rbc-calendar {
      background-color: #1f2937; /* dark:bg-gray-800 */
      color: #d1d5db; /* dark:text-gray-300 */
    }
    .dark .rbc-toolbar {
      background-color: #1f2937;
      color: #d1d5db;
    }
    .dark .rbc-toolbar button {
      color: #d1d5db;
    }
    .dark .rbc-toolbar button:hover, .dark .rbc-toolbar button:active {
      background-color: #374151; /* dark:bg-gray-700 */
    }
    .dark .rbc-header {
      border-color: #4b5563; /* dark:border-gray-600 */
    }
    .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-day-view {
      border-color: #4b5563;
    }
    .dark .rbc-day-bg {
      border-color: #4b5563;
    }
    .dark .rbc-off-range-bg {
      background-color: #111827; /* dark:bg-gray-900 */
    }
    .dark .rbc-today {
      background-color: #374151; /* dark:bg-gray-700 */
    }
    .dark .rbc-event {
      background-color: #2563eb; /* bg-blue-600 */
      border-color: #1d4ed8; /* border-blue-700 */
      color: white;
    }
    .dark .rbc-slot-selection {
        background-color: rgba(37, 99, 235, 0.5); /* bg-blue-600 with opacity */
    }
  `}</style>
);

const SessionBookingPage = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const [mentor, setMentor] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMentorAndAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mentorRes, availabilityRes] = await Promise.all([
        // FIX: Corrected the API endpoint to remove the extra '/mentor'
        apiClient.get(`/users/${mentorId}`),
        apiClient.get(`/sessions/availability/${mentorId}`),
      ]);
      setMentor(mentorRes.data);
      const events = availabilityRes.data.map((slot: any) => ({
        start: new Date(slot.time),
        end: new Date(new Date(slot.time).getTime() + 60 * 60 * 1000), // Assuming 1-hour slots
        title: "Available Slot",
      }));
      setAvailableSlots(events);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Could not load mentor's availability.");
    } finally {
      setIsLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchMentorAndAvailability();
  }, [fetchMentorAndAvailability]);

  const handleSelectSlot = async ({ start }: { start: Date }) => {
    if (
      window.confirm(
        `Do you want to book a session with ${
          mentor.profile.name
        } at ${start.toLocaleString()}?`
      )
    ) {
      const promise = apiClient.post("/sessions", {
        mentorId,
        sessionTime: start.toISOString(),
      });

      toast.promise(promise, {
        loading: "Booking your session...",
        success: () => {
          // Refetch availability to remove the booked slot
          fetchMentorAndAvailability();
          return "Session booked successfully!";
        },
        error: "Failed to book session. The slot may no longer be available.",
      });
    }
  };

  if (isLoading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading schedule...
      </p>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CalendarStyles />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Book a Session with {mentor?.profile?.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please choose an available time slot below. All times are in your
          local timezone.
        </p>
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={availableSlots}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            onSelectEvent={handleSelectSlot}
            views={["month", "week", "day"]}
            selectable
          />
        </div>
      </div>
    </div>
  );
};

export default SessionBookingPage;
