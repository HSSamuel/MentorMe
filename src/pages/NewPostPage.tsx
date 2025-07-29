import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
import toast from "react-hot-toast";

const NewPostPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill out both the title and content for your post.");
      return;
    }

    setIsSubmitting(true);
    const promise = apiClient.post("/community", { title, content });

    toast.promise(promise, {
      loading: "Creating your post...",
      success: (response) => {
        // Navigate to the new post's page after it's created
        navigate(`/community/${response.data.id}`);
        return "Your post has been created!";
      },
      error: (err) => `Error: ${err.response?.data?.message || err.message}`,
    });

    promise.finally(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Start a New Discussion
        </h1>
        <form onSubmit={handleCreatePost} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the main topic of your post?"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Write the details of your post here. You can ask a question, share an experience, or start a conversation on any topic."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 border-none rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer transition-colors hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isSubmitting ? "Posting..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostPage;
