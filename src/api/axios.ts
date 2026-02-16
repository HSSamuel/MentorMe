import axios from "axios";

// Helper function to ensure the base URL always ends with /api
// This allows VITE_API_BASE_URL to be the root (e.g., https://...render.com)
// which fixes the Socket.IO connection issue.
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // Safety check: if env var is missing, default to localhost
  const rootUrl = envUrl || "http://localhost:5000";

  // If the URL already ends with /api, return it as is.
  // Otherwise, append /api to it.
  return rootUrl.endsWith("/api") ? rootUrl : `${rootUrl}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Check for a token in the Authorization header first (e.g., from a recent login)
    if (config.headers.Authorization) {
      return config;
    }

    // If no header, fall back to the cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refreshToken="))
      ?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401 Unauthorized error, the token is bad.
      // Clear the cookie and force a reload to the login page.
      document.cookie =
        "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

      window.location.href = "/login";
    }
    // For all other errors, just pass them along
    return Promise.reject(error);
  },
);

export default apiClient;
