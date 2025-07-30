import React, { useState, useEffect, useMemo, useCallback } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Book,
  Video,
  Mic,
  Rss,
  Tag,
  Search,
  Star,
  Youtube,
} from "lucide-react";
import toast from "react-hot-toast";

// --- Types and Helper Components ---
interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: "ARTICLE" | "VIDEO" | "COURSE" | "BOOK" | "PODCAST" | "OTHER";
  tags: string[];
  imageUrl?: string;
  matchScore?: number; // For AI recommendations
}

const ResourceCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
    <div className="w-full h-40 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
    <div className="p-6">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);

const ResourceCard = ({ resource }: { resource: Resource }) => {
  const getIcon = () => {
    switch (resource.type) {
      case "ARTICLE":
        return <Book size={16} className="mr-2" />;
      case "VIDEO":
        return <Video size={16} className="mr-2" />;
      case "PODCAST":
        return <Mic size={16} className="mr-2" />;
      case "COURSE":
        return <Rss size={16} className="mr-2" />;
      case "BOOK":
        return <Book size={16} className="mr-2" />;
      default:
        return <Tag size={16} className="mr-2" />;
    }
  };

  return (
    <a
      href={resource.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col group"
    >
      <div className="relative">
        <img
          src={
            resource.imageUrl ||
            `https://source.unsplash.com/random/400x225?query=${
              resource.tags[0] || "learning"
            }`
          }
          alt={resource.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300"></div>
        {resource.matchScore && (
          <div className="absolute top-2 right-2 flex items-center bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            <Star size={12} className="mr-1" /> Match
          </div>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          {getIcon()}
          {resource.type}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex-grow">
          {resource.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {resource.description.substring(0, 100)}...
        </p>
        <div className="flex flex-wrap gap-2">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};

const LibraryPage = () => {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [discoveredVideos, setDiscoveredVideos] = useState<Resource[]>([]);
  const [discoveredBooks, setDiscoveredBooks] = useState<Resource[]>([]); // --- NEW: State for books ---
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "recommended" | "youtube" | "books"
  >("recommended");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLibraryData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const initialSearchQuery =
        user.profile?.skills?.[0] || "career development";
      setSearchTerm(initialSearchQuery);

      const [recommendedRes, youtubeRes, booksRes] = await Promise.all([
        apiClient.get("/resources/recommended"),
        apiClient.get(
          `/discover/youtube?query=${encodeURIComponent(initialSearchQuery)}`
        ),
        apiClient.get(
          `/discover/books?query=${encodeURIComponent(initialSearchQuery)}`
        ),
      ]);

      setRecommended(recommendedRes.data);
      setDiscoveredVideos(youtubeRes.data);
      setDiscoveredBooks(booksRes.data);
    } catch (error) {
      console.error("Failed to fetch library data:", error);
      toast.error("Could not load library content.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  const handleDiscoverSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setIsDiscoverLoading(true);
    try {
      // Fetch from both sources when searching
      const [youtubeRes, booksRes] = await Promise.all([
        apiClient.get(
          `/discover/youtube?query=${encodeURIComponent(searchTerm)}`
        ),
        apiClient.get(
          `/discover/books?query=${encodeURIComponent(searchTerm)}`
        ),
      ]);
      setDiscoveredVideos(youtubeRes.data);
      setDiscoveredBooks(booksRes.data);
    } catch (error) {
      toast.error("Failed to discover new resources.");
    } finally {
      setIsDiscoverLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    let resourcesToShow: Resource[] = [];
    let emptyStateMessage = {
      title: "No Resources Found",
      subtitle: "Try a different search.",
    };

    if (activeTab === "recommended") {
      resourcesToShow = recommended;
      emptyStateMessage = {
        title: "No Recommendations Yet",
        subtitle: "Complete your profile to get personalized recommendations.",
      };
    } else if (activeTab === "youtube") {
      resourcesToShow = discoveredVideos;
      emptyStateMessage = {
        title: "No Videos Found",
        subtitle: "Try a different search term to discover new videos.",
      };
    } else if (activeTab === "books") {
      resourcesToShow = discoveredBooks;
      emptyStateMessage = {
        title: "No Books Found",
        subtitle: "Try a different search term to discover new books.",
      };
    }

    if (isDiscoverLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    return resourcesToShow.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resourcesToShow.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    ) : (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold">{emptyStateMessage.title}</h3>
        <p className="text-gray-500 mt-2">{emptyStateMessage.subtitle}</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
        Resource Library
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Curated articles, videos, and tools to help you on your journey.
      </p>

      <div className="mb-8 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-center flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("recommended")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "recommended"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Star size={16} className="inline-block mr-2" />
          Recommended For You
        </button>
        <button
          onClick={() => setActiveTab("youtube")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "youtube"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Youtube size={16} className="inline-block mr-2" />
          Discover Videos
        </button>
        {/* --- NEW: Button for Discover Books tab --- */}
        <button
          onClick={() => setActiveTab("books")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "books"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Book size={16} className="inline-block mr-2" />
          Discover Books
        </button>
      </div>

      {/* --- UPDATE: Search bar is now always visible for discover tabs --- */}
      {(activeTab === "youtube" || activeTab === "books") && (
        <form
          onSubmit={handleDiscoverSearch}
          className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search for ${
                activeTab === "youtube" ? "videos" : "books"
              }...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      )}

      {renderContent()}
    </div>
  );
};

export default LibraryPage;
