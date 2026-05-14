/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getDeviceId, syncClock, getSynchronizedTime } from "../utils/security";
import { VanguardSigningUtil } from "../utils/vanguard-signing.util";

const getBaseUrl = (): string => {
  try {
    const env = import.meta.env;
    if (env?.VITE_API_URL) return env.VITE_API_URL as string;
    // Always default to the canonical production URL — never the old Render URL
    return 'https://api.shopvia.ng/api/v1';
  } catch {
    return 'https://api.shopvia.ng/api/v1';
  }
};


const api = axios.create({
  baseURL: getBaseUrl() || "http://localhost:5000/api/v1",
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'x-xsrf-token',
  headers: {
    "Content-Type": "application/json",
    "X-Contract-Version": "1.0.0", // Sync with core contracts
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

// 🛡️ [Decommissioned] Queue logic migrated to AdminRefreshCoordinator (v105.5)
// interface QueuePromise { ... }

// 🛡️ [Decommissioned] Local refresh state managed by AdminRefreshCoordinator (v105.5)
// let isRefreshing = false;
// let failedQueue: QueuePromise[] = [];
// const processQueue = ...

interface ResponseData {
  message?: string;
  error?: string;
  code?: string;
  referenceId?: string;
}

// Map HTTP Status to Actionable User Messages
const getErrorMessage = (status: number, data: ResponseData | undefined): string => {
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
  // 1. Attach Forensic Tracing (Unique Correlation ID)
  const requestId = crypto.randomUUID();
  config.headers['X-Request-Id'] = requestId;

  // 2. Automatic Idempotency (v10.4): Prevent race conditions on state changes
  const method = config.method?.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method!)) {
    if (!config.headers['idempotency-key']) {
      config.headers['idempotency-key'] = `${method}-${crypto.randomUUID()}`;
    }
  }

  const token = sessionStorage.getItem('token');
  const isRefreshRequest = config.url?.includes('/auth/refresh');

  if (token && config.headers && !isRefreshRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🛡️ [VANGUARD] Institutional Coordination Phase (v32.1)
  config.headers['x-vanguard-timestamp'] = getSynchronizedTime();
  config.headers['x-vanguard-device-id'] = getDeviceId();
  config.headers['x-vanguard-nonce'] = crypto.randomUUID();

  // Diagnostic context for all requests
  config.headers['X-Request-Timestamp'] = new Date().toISOString();
  
  return config;
});

/**
 * 🛡️ [VANGUARD] SIGNATURE INTERCEPTOR
 */
api.interceptors.request.use(async (config) => {
    if (config.url?.includes('/auth/')) return config;

    const method = config.method?.toUpperCase() || 'GET';
    const baseUrl = config.baseURL || '';
    const url = config.url || '';
    const path = (baseUrl + url).replace(/\/+/g, '/').split('?')[0]; 
    
    const query = config.params || {};
    const timestamp = config.headers['x-vanguard-timestamp'] as string;
    const nonce = config.headers['x-vanguard-nonce'] as string;

    try {
        const bodyHash = await VanguardSigningUtil.computeBodyHash(config.data);
        const canonicalString = VanguardSigningUtil.generateCanonicalString({
            method,
            path,
            query,
            bodyHash,
            timestamp,
            nonce
        });

        config.headers['x-vanguard-signature'] = await VanguardSigningUtil.generateSignature(canonicalString);
        return config;
    } catch (err) {
        console.error('[VANGUARD_SIGNING_CRASH]', err);
        return config;
    }
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => {
    // 🛡️ [VANGUARD] Temporal Sync
    const serverDate = response.headers['date'];
    if (serverDate) {
      syncClock(new Date(serverDate).getTime());
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status ?? 0;
    const data = error.response?.data as ResponseData | undefined;
    
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

    // Handle 401 Unauthorized with unified coordination authority
    if (status === 401 && !isAuthCheck && !isOnLoginPage) {
      if (originalRequest._retryCount && originalRequest._retryCount > 0) {
        console.error(`[Admin:Auth] Loop detected for ${originalRequest.url}.`);
        return Promise.reject(error);
      }

      try {
        const { refreshCoordinator } = await import('./refreshCoordinator');
        const { accessToken } = await refreshCoordinator.refresh(`ADMIN_INTERCEPTOR:${originalRequest.url}`);
        
        if (accessToken) {
          sessionStorage.setItem('token', accessToken);
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[Admin:Auth] Global refresh failed. Terminating session.');
        sessionStorage.removeItem('token');
        if (!isOnLoginPage) window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
