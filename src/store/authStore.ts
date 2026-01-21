import { create } from 'zustand';
import api from '../api/axios';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'gold';
    status: 'active' | 'inactive';
  };
  isTwoFactorEnabled?: boolean;
}

interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  verify2FA: (tempToken: string, totpCode: string) => Promise<any>;
  register: (data: { name: string; email: string; phone: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  isAuthenticated: !!(sessionStorage.getItem('token') || sessionStorage.getItem('is_logged_in')),
  isLoading: true,

  register: async (credentials) => {
    try {
      await api.post('/auth/register', credentials); 
    } catch (error: any) {
       console.error('Registration error:', error);
       throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      const requires2FA = response.data?.requires2FA || response.data?.data?.requires2FA;
      const tempToken = response.data?.tempToken || response.data?.data?.tempToken;

      if (requires2FA) {
        return { requires2FA: true, tempToken };
      }

      const { data, accessToken } = response.data; // Backend sets HttpOnly cookie and sends accessToken
      
      const token = accessToken || response.data.data?.accessToken;
      if (token) {
        sessionStorage.setItem('token', token);
      }

      // Allow any authenticated user to access the admin dashboard
      set({ admin: data, isAuthenticated: true });
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  verify2FA: async (tempToken: string, totpCode: string) => {
    try {
      const response = await api.post('/auth/login/verify-2fa', { tempToken, totpCode });
      const { data, accessToken } = response.data;

      const token = accessToken || response.data.data?.accessToken;
      if (token) {
        sessionStorage.setItem('token', token);
      }
      sessionStorage.setItem('is_logged_in', 'true');

      set({ admin: data, isAuthenticated: true });
      return response.data;
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.get('/auth/logout'); // Clears cookie on server
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('is_logged_in');
      set({ admin: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear state even if logout API fails
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('is_logged_in');
      set({ admin: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    // Rely on cookie being present
    // If authenticated already, just verify in background
    if (get().isAuthenticated) {
      try {
        const response = await api.get('/auth/me');
        set({ admin: response.data.data, isAuthenticated: true });
      } catch (error: any) {
        if (error.response?.status === 401) {
          set({ admin: null, isAuthenticated: false });
        }
      } finally {
        set({ isLoading: false });
      }
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      const admin = response.data.data;
      const token = response.data.accessToken || response.data.data?.accessToken;
      if (token) {
        sessionStorage.setItem('token', token);
      }

      // Verify role is admin (case-insensitive)
      const role = admin.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
         console.warn('[AuthStore Admin] Access denied: User is not an admin');
         await api.get('/auth/logout'); // Force backend logout
         set({ admin: null, isAuthenticated: false, isLoading: false });
         return;
      }

      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      // Clear state on 401, but keep it on other errors (like network timeout)
      if (error.response?.status === 401) {
        set({ admin: null, isAuthenticated: false });
      }
      console.error('[AuthStore Admin] Auth check failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    try {
      await api.post('/auth/forgotpassword', { email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    try {
      await api.put(`/auth/resetpassword/${token}`, { password });
    } catch (error) {
       console.error('Reset password error:', error);
       throw error;
    }
  }
}));
