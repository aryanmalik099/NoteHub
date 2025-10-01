// src/api.js
import axios from 'axios';

// Create a new Axios instance with a base URL
const api = axios.create({
  // Use the environment variable for the live URL, fall back to local for development
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api',
});

// Axios Request Interceptor: This runs BEFORE each request is sent.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios Response Interceptor: This runs AFTER a response is received.
api.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // --- START OF FIX ---
    // Check for 401 error, ensure it's not a retry, AND ensure it wasn't a login attempt.
    // The originalRequest.url will be '/login' for login attempts.
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/login') {
    // --- END OF FIX ---
      
      originalRequest._retry = true; // Mark that we've tried to refresh

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Make a request to the /refresh endpoint
        const response = await api.post('/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        
        // Update the header of the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        // If the refresh token is also invalid, log the user out
        console.error("Session expired. Please log in again.");
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(refreshError);
      }
    }
    // For any other errors (including the login 401), just pass them along
    // to the component's local catch block.
    return Promise.reject(error);
  }
);

export default api;