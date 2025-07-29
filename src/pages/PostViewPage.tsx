import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../api/axios";

const PostViewPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      apiClient.get(`/community/${postId}`).then((res) => {
        setPost(res.data);
        setIsLoading(false);
      });
    }
  }, [postId]);

  const handleAddComment = () => {
    apiClient
      .post(`/community/${postId}/comments`, { content: newComment })
      .then((res) => {
        setPost({ ...post, comments: [...post.comments, res.data] });
        setNewComment("");
      });
  };

  if (isLoading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        By {post.author.profile.name}
      </p>
      <div className="prose dark:prose-invert mb-8">
        <p>{post.content}</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      {post.comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2"
        >
          <p className="font-semibold">{comment.author.profile.name}</p>
          <p>{comment.content}</p>
        </div>
      ))}

      <div className="mt-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleAddComment}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Comment
        </button>
      </div>
    </div>
  );
};

export default PostViewPage;
