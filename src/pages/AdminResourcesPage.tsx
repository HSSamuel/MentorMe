import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../api/axios";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Search } from "lucide-react";

// --- Types ---
interface Resource {
  id: string;
  title: string;
  description: string;
  link: string;
  type: "ARTICLE" | "VIDEO" | "COURSE" | "BOOK" | "PODCAST" | "OTHER";
  tags: string[];
  imageUrl?: string;
}

const resourceTypes = [
  "ARTICLE",
  "VIDEO",
  "COURSE",
  "BOOK",
  "PODCAST",
  "OTHER",
];

// --- Reusable Modal for Create/Edit ---
const ResourceModal = ({
  isOpen,
  onClose,
  onSave,
  resource,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resourceData: Partial<Resource>) => void;
  resource: Partial<Resource> | null;
}) => {
  const [formData, setFormData] = useState<Partial<Resource>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Pre-fill form if we are editing an existing resource
    setFormData(resource || { type: "ARTICLE", tags: [] });
  }, [resource]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store tags as a comma-separated string in the form, convert to array on save
    setFormData((prev) => ({
      ...prev,
      tags: e.target.value.split(",") as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        tags: Array.isArray(formData.tags)
          ? formData.tags
          : (formData.tags as any)
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean),
      };
      await onSave(finalData);
    } catch (error) {
      // Error is handled by the parent component's onSave function
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {resource?.id ? "Edit Resource" : "Add New Resource"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={formData.title || ""}
            onChange={handleChange}
            placeholder="Title"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700"
          />
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Description"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 h-24"
          />
          <input
            name="link"
            type="url"
            value={formData.link || ""}
            onChange={handleChange}
            placeholder="https://example.com"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700"
          />
          <input
            name="imageUrl"
            value={formData.imageUrl || ""}
            onChange={handleChange}
            placeholder="Image URL (Optional)"
            className="w-full p-2 border rounded-md dark:bg-gray-700"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="type"
              value={formData.type || "ARTICLE"}
              onChange={handleChange}
              className="w-full p-2 border rounded-md dark:bg-gray-700"
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              name="tags"
              value={(formData.tags as any)?.join(", ") || ""}
              onChange={handleTagsChange}
              placeholder="Tags (comma-separated)"
              className="w-full p-2 border rounded-md dark:bg-gray-700"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? "Saving..." : "Save Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<Partial<Resource> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/resources");
      setResources(response.data);
    } catch (error) {
      toast.error("Failed to fetch resources.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSave = async (resourceData: Partial<Resource>) => {
    const promise = resourceData.id
      ? apiClient.put(`/resources/${resourceData.id}`, resourceData)
      : apiClient.post("/resources", resourceData);

    await toast.promise(promise, {
      loading: "Saving resource...",
      success: () => {
        fetchResources(); // Refresh the list
        setIsModalOpen(false);
        setEditingResource(null);
        return `Resource ${
          resourceData.id ? "updated" : "created"
        } successfully!`;
      },
      error: `Failed to ${resourceData.id ? "update" : "create"} resource.`,
    });
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      await toast.promise(apiClient.delete(`/resources/${resourceId}`), {
        loading: "Deleting resource...",
        success: () => {
          fetchResources(); // Refresh the list
          return "Resource deleted successfully!";
        },
        error: "Failed to delete resource.",
      });
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(
      (res) =>
        res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Manage Resources
        </h1>
        <button
          onClick={() => {
            setEditingResource(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Add New Resource
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Link</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {resource.title}
                    </td>
                    <td className="px-6 py-4">{resource.type}</td>
                    <td className="px-6 py-4">
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    </td>
                    <td className="px-6 py-4 flex gap-4">
                      <button
                        onClick={() => {
                          setEditingResource(resource);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        resource={editingResource}
      />
    </div>
  );
};

export default AdminResourcesPage;
