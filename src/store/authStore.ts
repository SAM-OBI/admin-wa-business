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
}

interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
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
      const { data } = response.data; // Backend sets HttpOnly cookie

      // Allow any authenticated user to access the admin dashboard
      set({ admin: data, isAuthenticated: true });
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.get('/auth/logout'); // Clears cookie on server
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({ admin: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    // Rely on cookie being present
    try {
      const response = await api.get('/auth/me');
      const admin = response.data.data;

      // Verify role is admin
      if (admin.role !== 'admin' && admin.role !== 'superadmin') {
         await api.get('/auth/logout'); // Force backend logout
         set({ admin: null, isAuthenticated: false, isLoading: false });
         return;
      }

      set({ admin, isAuthenticated: true, isLoading: false });
    } catch {
      // console.error("Check auth failed", error);
      set({ admin: null, isAuthenticated: false, isLoading: false });
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
