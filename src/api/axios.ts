/// <reference types="vite/client" />
import axios from "axios";

const getBaseUrl = () => {
  if ((import.meta as any).env.VITE_API_URL) return (import.meta as any).env.VITE_API_URL;
  return (import.meta as any).env.PROD ? 'https://whatsapp-b2b.onrender.com/api' : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl() || "http://localhost:5000/api",
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN', // The name of the cookie to use as a value for xsrf token
  xsrfHeaderName: 'X-XSRF-TOKEN', // The name of the http header that carries the xsrf token value
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => config);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect if:
    // 1. It's an IP verification request (403 with requiresIPVerification flag)
    // 2. It's the auth/me check endpoint
    // 3. We're already on the login page
    const isIPVerification = error.response?.status === 403 && error.response?.data?.requiresIPVerification;
    const isAuthCheck = error.config?.url?.includes('/auth/me');
    const isOnLoginPage = window.location.pathname === "/login";

    if (!isIPVerification && !isAuthCheck && !isOnLoginPage && 
        (error.response?.status === 401)) {
      // Only redirect on 401 (Unauthorized), not 403 (Forbidden)
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;
