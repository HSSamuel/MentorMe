import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/axios";

const CommunityPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/community").then((res) => {
      setPosts(res.data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <p>Loading discussions...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <Link
          to="/community/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Start a Discussion
        </Link>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            to={`/community/${post.id}`}
            key={post.id}
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-sm text-gray-500">
              By {post.author.profile.name} -{" "}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-2 text-gray-600">
              {post._count.comments} comments
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
