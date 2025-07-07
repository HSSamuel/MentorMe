import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { io, Socket } from "socket.io-client";
import NotificationPanel from "./NotificationPanel";

const NotificationBell = () => {
  // Custom hook to get the current user and their authentication token.
  const { user, token } = useAuth();
  // State to hold the list of notifications.
  const [notifications, setNotifications] = useState<any[]>([]);
  // State to control the visibility of the notification panel.
  const [isOpen, setIsOpen] = useState(false);
  // Ref to hold the WebSocket connection instance.
  const socketRef = useRef<Socket | null>(null);
  // Ref to the main div of the component, used to detect outside clicks.
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Calculate the number of unread notifications.
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Function to fetch all notifications from the backend API.
  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // This effect runs once to fetch initial notifications and set up the WebSocket connection.
  useEffect(() => {
    fetchNotifications();

    // Only establish a socket connection if the user is authenticated.
    if (token) {
      // Connect to the backend WebSocket server, passing the auth token for authentication.
      socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
      });

      // Listen for 'newNotification' events from the server.
      socketRef.current.on("newNotification", (newNotification) => {
        // When a new notification arrives, add it to the top of the list.
        setNotifications((prev) => [newNotification, ...prev]);
      });

      // Cleanup function: disconnect the socket when the component is unmounted.
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [token]);

  // This effect adds a click listener to the document to close the notification panel
  // when the user clicks outside of it.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    // Add the event listener when the component mounts.
    document.addEventListener("mousedown", handleClickOutside);
    // Remove the event listener when the component unmounts.
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Function to mark a single notification as read.
  const handleMarkAsRead = async (id: string) => {
    try {
      // Send a request to the backend to update the notification's status.
      await apiClient.put(`/notifications/${id}/read`);
      // Update the local state to reflect the change immediately.
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Function to mark all notifications as read.
  const handleMarkAllAsRead = async () => {
    try {
      // Send a request to the backend to update all notifications.
      await apiClient.put("/notifications/read-all");
      // Update the local state to mark all notifications as read.
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* The bell icon button that toggles the notification panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* A red dot that appears when there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {/* The notification panel, which is only rendered if 'isOpen' is true */}
      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
};

export default NotificationBell;
