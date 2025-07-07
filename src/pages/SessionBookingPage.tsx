import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

const SessionBookingPage = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSlots = async () => {
      if (!mentorId) return;
      try {
        // Assuming this endpoint can generate bookable slots for a mentor
        const response = await apiClient.get(
          `/sessions/availability/${mentorId}`
        );
        setAvailableSlots(response.data);
      } catch (err) {
        setError("Could not fetch available slots.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, [mentorId]);

  const handleBookSession = async (slot: any) => {
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

  if (isLoading) return <p>Loading available slots...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Book a Session</h2>
      <p>Please choose an available time slot below.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {availableSlots.length > 0 ? (
          availableSlots.map((slot) => (
            <button key={slot.id} onClick={() => handleBookSession(slot)}>
              {new Date(slot.time).toLocaleString()}
            </button>
          ))
        ) : (
          <p>This mentor has no available slots. Please check back later.</p>
        )}
      </div>
    </div>
  );
};

export default SessionBookingPage;
