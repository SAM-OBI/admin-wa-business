import api from './axios';
export * from '../types';
import { 
  ApiResponse,
  TreasuryHealth 
} from '../types';
import { 
  TreasuryHealthSchema, 
  DashboardStatsSchema,
  ActivityListSchema 
} from '../schemas/admin.schema';

export const adminService = {
  // Stats
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/dashboard-stats');
    const validated = DashboardStatsSchema.parse(response.data.data);
    return { ...response.data, data: validated };
  },

  getRecentActivity: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/recent-activity');
    const validated = ActivityListSchema.parse(response.data.data);
    return { ...response.data, data: validated };
  },

  getTreasuryHealth: async (): Promise<ApiResponse<TreasuryHealth>> => {
    const response = await api.get('/admin/treasury-health');
    const validated = TreasuryHealthSchema.parse(response.data.data);
    return { ...response.data, data: validated };
  },

  // Users
  getUsers: async <T = any>(params?: any): Promise<ApiResponse<T>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  getUserById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id: string, currentStatus: boolean): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
    return response.data;
  },

  updateUserVerification: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/users/${id}/verification`, data);
    return response.data;
  },

  setLegalHold: async (id: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/admin/users/${id}/legal-hold`, { reason });
    return response.data;
  },

  removeLegalHold: async (id: string, justification: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/admin/users/${id}/legal-hold`, { data: { justification } });
    return response.data;
  },

  // Vendors
  getVendors: async <T = any>(params?: any): Promise<ApiResponse<T>> => {
    const response = await api.get('/admin/vendors', { params });
    return response.data;
  },

  getVendorById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/admin/vendors/${id}`);
    return response.data;
  },

  updateVendorVerification: async (id: string, status: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/vendors/${id}/verification`, { status, reason });
    return response.data;
  },

  suspendVendor: async (id: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/vendors/${id}/suspend`, { reason });
    return response.data;
  },

  activateVendor: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/vendors/${id}/activate`);
    return response.data;
  },

  // Products
  getProducts: async <T = any>(params?: any): Promise<ApiResponse<T>> => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  toggleProductStatus: async (id: string, currentStatus: string): Promise<ApiResponse<any>> => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const response = await api.patch(`/admin/products/${id}/status`, { status: newStatus });
    return response.data;
  },

  // Orders
  getOrders: async <T = any>(params?: any): Promise<ApiResponse<T>> => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  // Complaints
  getComplaints: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },

  resolveComplaint: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/complaints/${id}/resolve`);
    return response.data;
  },

  // Feedback
  getFeedbacks: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/feedback', { params });
    return response.data;
  },

  updateFeedbackStatus: async (id: string, status: string, adminNotes?: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/feedback/${id}`, { status, adminNotes });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  // Security
  getSecurityMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/security/metrics');
    return response.data;
  },

  getSecurityStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/security/stats');
    return response.data;
  },

  // 2FA
  setup2FA: async (): Promise<ApiResponse<any>> => {
    const response = await api.post('/admin/security/2fa/setup');
    return response.data;
  },

  verify2FA: async (token: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/admin/security/2fa/verify', { token });
    return response.data;
  },

  disable2FA: async (password: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/admin/security/2fa/disable', { password });
    return response.data;
  },

  // Reviews
  getReviews: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },

  // Notifications
  getNotifications: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  markNotificationRead: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<ApiResponse<any>> => {
    const response = await api.patch('/admin/notifications/read-all');
    return response.data;
  },

  // Marketing
  getMarketingDiscountCodes: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/marketing/discount-codes', { params });
    return response.data;
  },

  // Domains
  getDomains: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/domains', { params });
    return response.data;
  },

  manageDomain: async (id: string, action: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/admin/domains/${id}/${action}`);
    return response.data;
  },

  // Court Cases
  getCourtCases: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/court-cases', { params });
    return response.data;
  },
};
