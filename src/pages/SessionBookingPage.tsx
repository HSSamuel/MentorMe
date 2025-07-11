import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SessionBookingPage = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentorName, setMentorName] = useState("");

  useEffect(() => {
    const fetchPrerequisites = async () => {
      if (!mentorId) return;
      setIsLoading(true);
      try {
        // Fetch mentor details and available slots in parallel
        const [mentorRes, slotsRes] = await Promise.all([
          apiClient.get(`/users/mentor/${mentorId}`),
          apiClient.get(`/sessions/availability/${mentorId}`),
        ]);

        setMentorName(mentorRes.data.profile.name);

        // Format available slots into calendar events (assuming 1-hour sessions)
        const formattedEvents = slotsRes.data.map((slot: any) => ({
          title: "Available Slot",
          start: new Date(slot.time),
          end: new Date(new Date(slot.time).getTime() + 60 * 60 * 1000), // 1 hour duration
          resource: slot,
        }));
        setEvents(formattedEvents);
      } catch (err) {
        setError("Could not fetch available slots for this mentor.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrerequisites();
  }, [mentorId]);

  const handleSelectEvent = async (event: any) => {
    const slot = event.resource;
    if (
      !window.confirm(
        `Are you sure you want to book a session for ${new Date(
          slot.time
        ).toLocaleString()}?`
      )
    ) {
      return;
    }
    try {
      await apiClient.post("/sessions", {
        mentorId,
        sessionTime: slot.time,
      });
      alert("Session booked successfully!");
      navigate("/my-sessions");
    } catch (err) {
      setError("Failed to book session. The slot may have just been taken.");
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 py-10">
        Loading available slots...
      </p>
    );
  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Session</h1>
      <p className="text-lg text-gray-600 mb-6">
        Please choose an available time slot with{" "}
        <span className="font-semibold">{mentorName}</span>.
      </p>
      <div
        className="bg-white p-4 rounded-lg shadow-lg"
        style={{ height: "70vh" }}
      >
        {events.length > 0 ? (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            views={["month", "week", "day"]}
            selectable
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-xl">
              This mentor has no available slots. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionBookingPage;
