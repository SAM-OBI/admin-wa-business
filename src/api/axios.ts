/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const getBaseUrl = () => {
  if ((import.meta as any).env.VITE_API_URL) return (import.meta as any).env.VITE_API_URL;
  return (import.meta as any).env.PROD ? 'https://whatsapp-b2b.onrender.com/api' : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl() || "http://localhost:5000/api",
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'x-xsrf-token',
  headers: {
    "Content-Type": "application/json",
  },
});

// Refresh token state management
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  // If we had a token in sessionStorage, we would attach it here
  // But admin seems to rely primarily on cookies.
  // However, we'll check for it just in case some parts of the system use it.
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data as any;

    // Handle 401 Unauthorized - Attempt silent token refresh
    if (status === 401 && !originalRequest._retry) {
      // Don't refresh if:
      // 1. It's the auth/me check endpoint on initial load (avoid loops)
      // 2. We're already on the login page
      const isAuthCheck = originalRequest.url?.includes('/auth/me');
      const isOnLoginPage = window.location.pathname === "/login";
      
      if (isOnLoginPage) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      console.log('[Axios Admin] Session expired. Attempting silent refresh...');

      return new Promise((resolve, reject) => {
        api.post('/auth/refresh')
          .then((response) => {
            console.log('[Axios Admin] Refresh successful');
            const newToken = response.data?.data?.accessToken || response.data?.accessToken;
            if (newToken) {
              sessionStorage.setItem('token', newToken);
            }
            processQueue(null, newToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            console.error('[Axios Admin] Refresh failed:', err);
            processQueue(err, null);
            
            // Clear logical session
            sessionStorage.removeItem('is_logged_in');
            sessionStorage.removeItem('token');
            
            // Redirect to login if not already there
            if (window.location.pathname !== "/login") {
              window.location.href = "/login?expired=true";
            }
            
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // Original redirection logic for other cases (like 403 or 401 where retry failed)
    const isIPVerification = status === 403 && data?.requiresIPVerification;
    const isAuthCheck = originalRequest.url?.includes('/auth/me');
    const isOnLoginPage = window.location.pathname === "/login";

    if (!isIPVerification && !isAuthCheck && !isOnLoginPage && status === 401) {
       // This handles the case where the refresh itself failed or it wasn't a refreshable 401
       window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;
