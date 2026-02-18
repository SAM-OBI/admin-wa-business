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
  timeout: 10000, // 10 seconds global timeout
});

interface ApiError {
  status: number;
  message: string;
  code: string;
  referenceId?: string;
}

export interface NormalizedAxiosError extends AxiosError {
  normalized: ApiError;
  errorMessage: string;
  errorCode: string;
}

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

// Map HTTP Status to Actionable User Messages
const getErrorMessage = (status: number, data: any): string => {
  if (data?.message) return data.message;
  
  switch (status) {
    case 400: return "The request was invalid. Please check your input.";
    case 401: return "Your session has expired. Please log in again.";
    case 403: return "Access Denied: You do not have permission for this action.";
    case 404: return "The requested resource was not found.";
    case 429: return "Too many requests. Please wait a moment.";
    case 500: return "Internal Server Error. Our team has been notified.";
    case 502: case 503: case 504: return "The server is temporarily unavailable. Retrying...";
    default: return "An unexpected error occurred. Please try again.";
  }
};

api.interceptors.request.use((config) => {
  // CLEANUP: Ensure no sensitive data remains in localStorage (Legacy check)
  const legacyKeys = ['token', 'auth_token', 'is_logged', 'is_logged_in'];
  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.warn(`[Axios Admin] Security: Removing legacy ${key} from localStorage`);
      localStorage.removeItem(key);
    }
  });

  const token = sessionStorage.getItem('token');
  const isRefreshRequest = config.url?.includes('/auth/refresh');

  if (token && config.headers && !isRefreshRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Diagnostic context for all requests
  config.headers['X-Request-Timestamp'] = new Date().toISOString();
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status ?? 0;
    const data = error.response?.data as any;
    
    // Standardize error message
    const errorMessage = getErrorMessage(status, data);
    const errorCode = data?.code || "UNKNOWN_ERROR";

    (error as NormalizedAxiosError).normalized = {
      status,
      message: errorMessage,
      code: errorCode,
      referenceId: data?.referenceId || `REQ-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
    };

    (error as NormalizedAxiosError).errorMessage = errorMessage;

    // Retry Strategy for Transient Errors (503, 504)
    const isTransient = [502, 503, 504].includes(status);
    const maxRetries = 2;
    originalRequest._retryCount = originalRequest._retryCount ?? 0;

    if (isTransient && originalRequest._retryCount < maxRetries) {
      originalRequest._retryCount++;
      const delay = originalRequest._retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    const isAuthCheck = originalRequest.url?.includes('/auth/me');
    const isOnLoginPage = window.location.pathname === "/login";

    // Handle 401 Unauthorized with token rotation
    if (status === 401 && !isAuthCheck && !isOnLoginPage) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.accessToken;
        sessionStorage.setItem('token', newToken);
        
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem('token');
        if (!isOnLoginPage) window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
