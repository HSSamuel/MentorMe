import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/axios";
import { io, Socket } from "socket.io-client";
import NotificationPanel from "./NotificationPanel";
import toast from "react-hot-toast";

// It's good practice to define the shape of your data
interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  // Add any other properties a notification might have
}

const NotificationBell = () => {
  const { user, token } = useAuth();
  // State is correctly initialized as an empty array
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // This line is now safe because 'notifications' will always be an array.
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get("/notifications");
      // --- [THE FIX] ---
      // We check if the response data is an array before setting the state.
      // If it's not, we set an empty array to prevent the component from crashing.
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        console.error(
          "API response for notifications is not an array:",
          response.data
        );
        setNotifications([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]); // Also set to an empty array on error
    }
  };

  useEffect(() => {
    // --- [IMPROVEMENT] ---
    // Only fetch notifications and connect to the socket if the user token exists.
    if (token) {
      fetchNotifications();

      socketRef.current = io(import.meta.env.VITE_API_BASE_URL!, {
        auth: { token },
      });

      socketRef.current.on(
        "newNotification",
        (newNotification: Notification) => {
          setNotifications((prev) => [newNotification, ...prev]);
          toast.info(`New notification: ${newNotification.message}`);
        }
      );

      socketRef.current.on("goalCompleted", (data) => {
        fetchNotifications();
      });

      socketRef.current.on("availabilityUpdated", (data) => {
        fetchNotifications();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    } else {
      // If there's no token, ensure notifications are cleared out.
      setNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAll = async () => {
    setNotifications([]);
    try {
      await apiClient.delete(`/notifications`);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white opacity-80 hover:opacity-100 focus:outline-none transition-opacity"
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
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
