import React from "react";
export const StatCardSkeleton = () => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 flex items-center space-x-6 animate-pulse">
      <div className="p-4 rounded-full bg-gray-300 h-16 w-16"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default StatCardSkeleton;
