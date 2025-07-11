import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
  }
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
  }
);

export default apiClient;
