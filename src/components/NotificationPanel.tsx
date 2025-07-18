import React from "react";
import { Link } from "react-router-dom";

// Define the component's props, adding the new delete handlers
interface NotificationPanelProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void; // Add this prop
  onDeleteAll: () => void; // Add this prop
  onClose: () => void; // Add this prop to close the panel on action
}

const NotificationPanel = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onClose,
}: NotificationPanelProps) => {
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
    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20 border dark:border-gray-700">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-gray-100">
          Notifications
        </h3>
        {/* Container for action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-blue-500 hover:underline dark:text-blue-400"
          >
            Mark all as read
          </button>
          {/* --- "Delete All" button is added here --- */}
          {notifications.length > 0 && (
            <button
              onClick={onDeleteAll}
              className="text-sm text-red-500 hover:underline dark:text-red-400"
            >
              Delete All
            </button>
          )}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            // Each item is now a flex container
            <div
              key={notif.id}
              className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                !notif.isRead ? "bg-blue-50 dark:bg-blue-900/40" : ""
              }`}
            >
              <Link
                to={notif.link || "#"}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  onClose(); // Close panel on click
                }}
                className="flex-grow"
              >
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {notif.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {timeSince(notif.createdAt)}
                </p>
              </Link>
              {/* --- Individual "Delete" button is added here --- */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the link from being clicked
                  onDelete(notif.id);
                }}
                className="ml-2 text-gray-400 hover:text-red-500 font-bold text-lg p-1"
                title="Delete Notification"
              >
                &times;
              </button>
            </div>
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
