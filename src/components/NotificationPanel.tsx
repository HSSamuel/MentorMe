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
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-20">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Notifications</h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-sm text-blue-500 hover:underline"
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
              className={`block p-4 hover:bg-gray-50 border-b border-gray-100 ${
                !notif.isRead ? "bg-blue-50" : ""
              }`}
            >
              <p className="text-sm text-gray-700">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {timeSince(notif.createdAt)}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            You have no notifications.
          </p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
