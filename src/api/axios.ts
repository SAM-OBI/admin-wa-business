/// <reference types="vite/client" />
import axios from "axios";

const getBaseUrl = () => {
  if ((import.meta as any).env.VITE_API_URL) return (import.meta as any).env.VITE_API_URL;
  return (import.meta as any).env.PROD ? 'https://whatsapp-b2b.onrender.com/api' : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl() || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => config);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
