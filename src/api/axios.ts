/// <reference types="vite/client" />
import axios from 'axios';

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL;
};

const api = axios.create({
  baseURL: getBaseUrl() || 'http://localhost:5000/api',
  withCredentials: true, // Important for cookies!
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests (Cookie handled automatically)
api.interceptors.request.use((config) => {
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // localStorage.removeItem('adminToken'); // No need to remove token
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
