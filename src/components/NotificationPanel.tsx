import React from "react";
import { Link } from "react-router-dom";

const NotificationPanel = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}) => {
  const timeSince = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    // FIX: Reduced width for mobile (w-72) and larger screens (sm:w-80).
    // Also added dark mode classes for background and borders.
    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20 border dark:border-gray-700">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-gray-100">
          Notifications
        </h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-sm text-blue-500 hover:underline dark:text-blue-400"
        >
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <Link
              to={notif.link || "#"}
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              // FIX: Added dark mode styles for hover, borders, and unread items.
              className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700/50 ${
                !notif.isRead ? "bg-blue-50 dark:bg-blue-900/40" : ""
              }`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {notif.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {timeSince(notif.createdAt)}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            You have no notifications.
          </p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
