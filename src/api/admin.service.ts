import api from './axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  verification?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    bvnVerified: boolean;
    ninVerified: boolean;
    votersVerified: boolean;
  };
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'gold';
    status: 'active' | 'inactive';
    productUsage: number;
    startDate?: string;
    endDate?: string;
  };
  accountStatus?: {
    status: 'active' | 'restricted' | 'suspended' | 'banned';
    reason?: string;
  };
  addresses?: Array<{
    street: string;
    city: string;
    state: string;
    country: string;
    isDefault: boolean;
  }>;
  createdAt: string;
}

export interface UserDetails extends User {
  accountAge: number;
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
    completedOrders: number;
  };
  recentOrders?: any[];
  reviewStats?: {
    totalReviews: number;
    averageRating: number;
  };
  recentReviews?: any[];
  complaints?: any[];
}

export interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  storeName?: string;
  storeId?: string;
  verification?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
    verifiedAt?: string;
    method?: string;
    idNumber?: string;
    documentUrl?: string;
    governmentIdNumber?: string; // Legacy/Alternative
    governmentIdType?: string; // Legacy/Alternative
  };
  governmentIdUrl?: string; // Root level fallback
  accountStatus?: {
    status: 'active' | 'restricted' | 'suspended' | 'banned';
    reason?: string;
    suspendedAt?: string;
  };
  riskProfile?: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    flags: Array<{
      type: string;
      date: string;
      description: string;
      resolved: boolean;
    }>;
  };
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'gold';
    status: 'active' | 'inactive';
    productUsage: number;
    startDate?: string;
    endDate?: string;
    autoRenew?: boolean;
    rolloverLimit?: number;
  };
  createdAt: string;
}

export interface VendorDetails extends Vendor {
  store?: any;
  productCount?: number;
  orderStats?: {
    totalOrders: number;
    totalRevenue: number;
    completedOrders: number;
  };
  recentComplaints?: any[];
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  storeName: string;
  status: 'active' | 'inactive';
  stock: number;
  images?: string[];
  description?: string;
  longDescription?: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
}

export interface ProductDetails extends Product {
  vendor?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  reviews?: Array<{
    _id: string;
    user: { name: string };
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  averageRating: number;
  salesStats?: {
    totalSold: number;
    totalRevenue: number;
  };
  recentOrders?: any[];
}

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  user: User;
}

export interface CourtCase {
  _id: string;
  caseNumber: string;
  status: 'open' | 'closed';
  plaintiff: string;
  defendant: string;
  filingDate: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  productName: string;
  userName: string;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface OrderProduct {
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
  };
  quantity: number;
  price: number;
}

// Type for orders in list view - user data might be partial
export interface OrderListItem {
  _id: string;
  orderId?: string; // Human readable ID
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  store: {
    name?: string;
    storeName?: string;
  };
  products?: OrderProduct[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

// Type for full order details - all required data is present
export interface Order {
  _id: string;
  orderId?: string; // Human readable ID
  user: {
    name: string;
    email: string;
    phone: string;
  };
  store: {
    name: string;
    storeName?: string;
  } | {
    name?: string;
    storeName: string;
  };
  products: OrderProduct[];
  totalAmount: number;
  status: string;
  paymentInfo?: {
    status: string;
    method?: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  createdAt: string;
  timeline?: Array<{
    status: string;
    timestamp: string | Date;
    description: string;
  }>;
}

export const adminService = {
  // Stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  // Users
  getUsers: async (params?: any) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  toggleUserStatus: async (id: string, currentStatus: boolean) => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
    return response.data;
  },

  // Vendors
  getVendors: async (params?: any) => {
    const response = await api.get('/admin/vendors', { params });
    return response.data;
  },
  getVendorById: async (id: string) => {
    const response = await api.get(`/admin/vendors/${id}`);
    return response.data;
  },
  updateVendorVerification: async (id: string, status: string, reason?: string) => {
    const response = await api.patch(`/admin/vendors/${id}/verification`, { status, reason });
    return response.data;
  },
  suspendVendor: async (id: string, reason: string) => {
    const response = await api.patch(`/admin/vendors/${id}/suspend`, { reason });
    return response.data;
  },
  activateVendor: async (id: string) => {
    const response = await api.patch(`/admin/vendors/${id}/activate`);
    return response.data;
  },

  // Products
  getProducts: async (params?: any) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },
  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },
  toggleProductStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const response = await api.patch(`/admin/products/${id}/status`, { status: newStatus });
    return response.data;
  },

  // Orders
  getOrders: async (params?: any) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  // Complaints
  getComplaints: async (params?: any) => {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },
  resolveComplaint: async (id: string) => {
    const response = await api.patch(`/admin/complaints/${id}/resolve`);
    return response.data;
  },

  // Court Cases
  getCourtCases: async (params?: any) => {
    const response = await api.get('/admin/court-cases', { params });
    return response.data;
  },

  // Reviews
  getReviews: async (params?: any) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: any) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};
