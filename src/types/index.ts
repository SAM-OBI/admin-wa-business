export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'gold';
export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'locked' | 'failed';

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

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
    status: VerificationStatus;
    bvnVerified: boolean;
    ninVerified: boolean;
    votersVerified: boolean;
    attempts?: number;
    failureReason?: string;
  };
  accountStatus?: {
    status: AccountStatus;
    reason?: string;
  };
  governmentId?: {
    bvn?: string;
    nin?: string;
    votersCard?: string;
  };
  createdAt: string;
}

export interface UserDetails extends User {
  accountAge: number;
  orderStats?: {
    totalOrders: number;
    totalSpent: number;
    completedOrders: number;
  };
  reviewStats?: {
    totalReviews: number;
    averageRating: number;
  };
  addresses?: Address[];
  recentOrders?: any[];
  recentReviews?: any[];
  complaints?: any[];
  legalHold?: boolean;
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
    status: VerificationStatus;
    rejectionReason?: string;
    verifiedAt?: string;
    method?: string;
    idNumber?: string;
    documentUrl?: string;
    attempts?: number;
    failureReason?: string;
  };
  accountStatus?: {
    status: AccountStatus;
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
  subscription?: {
    plan: SubscriptionPlan;
    status: 'active' | 'inactive';
    productUsage: number;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
  };
  recentComplaints?: any[];
  governmentIdUrl?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string | { name: string };
  storeName: string;
  status: 'active' | 'inactive';
  stock: number;
  images?: string[];
  description?: string;
  rating: number;
  soldCount: number;
  createdAt: string;
}

export interface ProductDetails extends Product {
  salesStats?: {
    totalSold: number;
    totalRevenue: number;
  };
  reviewCount: number;
  averageRating: number;
  longDescription?: string;
  vendor?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  reviews?: any[];
}

export interface Order {
  _id: string;
  orderId?: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  store: {
    name?: string;
    storeName?: string;
  };
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
  products: Array<{
    product: {
      _id: string;
      name: string;
      images?: string[];
    };
    quantity: number;
    price: number;
  }>;
  timeline?: Array<{
    description: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export type OrderListItem = Order;

export interface Complaint {
  _id: string;
  orderId: string;
  userId: string;
  user: {
     name: string;
     email?: string;
  };
  title: string;
  subject?: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved' | 'investigating' | 'escalated';
  createdAt: string;
}

export interface CourtCase {
  _id: string;
  caseId: string;
  caseNumber: string;
  type: string;
  status: string;
  plaintiff: string;
  defendant: string;
  filingDate: string;
  involvedParties: string[];
  createdAt: string;
}

export interface Review {
  _id: string;
  comment: string;
  rating: number;
  status: 'published' | 'pending';
  productName: string;
  userName: string;
  createdAt: string;
}

export interface TreasuryHealth {
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  liquidityScore: number;
  totalEscrowValue: number;
  totalWalletLiability: number;
  exposureRatio: number;
}

export type PaginatedResponse<T, Key extends string> = {
  [K in Key]: T;
} & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  [key: string]: any;
}
