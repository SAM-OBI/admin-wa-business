export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'gold';
export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'locked' | 'failed';
export type OnboardingState = 'INITIATED' | 'ACCOUNT_CREATED' | 'EMAIL_QUEUED' | 'EMAIL_SENT' | 'EMAIL_FAILED' | 'KYC_PENDING' | 'ACTIVE' | 'SUSPENDED';
export type OnboardingPersona = 'MERCHANT_ELITE' | 'GLOBAL_BUYER' | 'STOREFRONT_BUYER';

export interface Reputation {
  score: number;
  level: 'new' | 'low' | 'medium' | 'high' | 'excellent';
  lastRecalculated: string;
  isProvisional: boolean;
}

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
  reputation?: Reputation;
  accountStatus?: {
    status: AccountStatus;
    reason?: string;
  };
  governmentId?: {
    bvn?: string;
    nin?: string;
    votersCard?: string;
  };
  onboardingState?: OnboardingState;
  onboardingPersona?: OnboardingPersona;
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
  // 🛡️ [FIX] manualReviewDeadline/slaStatus/assignedAdminId/cacNumber used to
  // live on this interface as if they were part of personal identity
  // verification — they're not. This `verification` object mirrors
  // User.verification (BVN/NIN identity KYC) exactly; those four fields
  // actually belong to Store.verifications[type='cac'] (a different model
  // entirely, see CacVerification.tsx in the vendor app and
  // reviewCacVerification on the backend), and having them typed here is
  // almost certainly what led the original CAC panel code to read
  // `vendor.verification?.cacNumber` — a field the backend never populates
  // at that path, since it doesn't exist there. CAC status now has its own
  // top-level field on Vendor below (`cacStatus`), sourced from the real
  // canonical location.
  verification?: {
    status: VerificationStatus;
    rejectionReason?: string;
    verifiedAt?: string;
    method?: string;
    idNumber?: string;
    documentUrl?: string;
    attempts?: number;
    failureReason?: string;
    recoveryState?: {
      probationEndsAt: string;
      isRecovering: boolean;
      originalScore: number;
    };
    enforcementCategory?: string;
  };
  // CAC/business-registration verification status — Store.verifications[type='cac'].status,
  // projected minimally by the backend (not the full verifications array;
  // see admin.service.ts::getAllVendors). Distinct from `verification`
  // above, which is personal identity KYC only.
  cacStatus?: VerificationStatus;
  reputation?: Reputation;
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
  activityScore?: number;
  sellerLevel?: number;
  isFeatured?: boolean;
  onboardingState?: OnboardingState;
  onboardingPersona?: OnboardingPersona;
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
  blogCount?: number;
  flaggedBlogReports?: number;
  recentBlogs?: any[];
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
    // 🛡️ [#8D] Buyer-supplied, informational only — never financial authority.
    buyerReportedAmountKobo?: number;
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
    priceSnapshot: {
      unitPriceKobo: number;
    };
  }>;
  timeline?: Array<{
    description: string;
    timestamp: string;
  }>;
  createdAt: string;
  // 🛡️ [#8C/#8D] Free-cancellation window + DT/vendor-action audit fields.
  // Backend-authoritative — this dashboard only ever displays them.
  freeCancellationDeadline?: string;
  vendorFirstActionAt?: string;
  directTransferFundsReceivedAt?: string;
  cancellationReason?: string;
}

export type OrderListItem = Order;

export interface Complaint {
  _id: string;
  orderId: string;
  userId: string;
  // 🛡️ [BATCH-10] The real populated field on both getAllComplaints and
  // getComplaintDetails is `complainant`, not `user` — this type declared a
  // field name that was never actually sent, and Complaints.tsx's list
  // render crashed on every row as a result.
  complainant: {
     name: string;
     email?: string;
  };
  title: string;
  subject?: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  // 🛡️ [BATCH-11] Canonicalized to the real, uppercase backend enum
  // (OPEN|INVESTIGATING|RESOLVED|DISMISSED) — no separate ESCALATED value;
  // an escalated complaint is RESOLVED with a non-null `courtCase` ref.
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  // 🛡️ [#8D] Both already sent by the backend (complaint.controller.ts /
  // admin.helpers.ts::getComplaintDetails) but never declared/rendered here.
  type?: string;
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    paymentInfo?: { method?: string; status?: string };
  };
}

// 🛡️ [#8D] GET /admin/orders/:orderId/audit-trail response shape —
// admin.service.ts::getOrderAuditTrail's read-only aggregation.
export interface OrderAuditTrail {
  order: Order;
  complaints: Complaint[];
  refundCase: {
    _id: string;
    status: string;
    settlementStatus: string;
    reasonCode: string;
    description: string;
    refundAmount: number;
    gatewayReference?: string;
    createdAt: string;
  } | null;
  refundIntents: Array<{
    _id: string;
    status: string;
    amount: number;
    reason: string;
    resolutionType?: string;
    createdAt: string;
  }>;
  dispute: {
    _id: string;
    status: string;
    reason: string;
    createdAt: string;
  } | null;
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
  // 🛡️ [REVIEWS-CONTRACT] 'published' was never a real backend value —
  // the actual Review model enum (review.model.ts) is exactly these 4.
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  productName: string;
  userName: string;
  createdAt: string;
}

export interface TreasuryHealth {
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  interpretedStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  liquidityScore: number;
  totalEscrowValue: number;
  totalWalletLiability: number;
  exposureRatio: number;
  liquidityRatio: number;
  drilldown?: {
    mainCause: string;
    recommendedAction: string;
  };
}

export interface MultiSigRequest {
  _id: string;
  actionType: string;
  description: string;
  semanticSummary?: string; // 🛡️ [v107.7] Human-Centered Summary
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // 🛡️ [v107.7]
  anomalyScore?: number; // 🛡️ [v107.7] 0-100
  metadata: any;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'COOLDOWN' | 'EXECUTED' | 'REJECTED' | 'EXPIRED';
  requiredApprovals: number;
  approvals: any[];
  expiresAt: string;
  cooldownEnd?: string;
  createdAt: string;
}

export interface PAJLog {
  _id: string;
  action: string;
  actor: string;
  description: string;
  semanticSummary?: string; // 🛡️ [v107.7]
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalyScore?: number;
  impactScope: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  metadata: any;
  forensicHash: string;
  createdAt: string;
}

export interface IntelligenceSettings {
  aiRankingEnabled: boolean;
  aiRiskEnabled: boolean;
  aiSentimentEnabled: boolean;
  aiTunerEnabled: boolean;
  riskDialFactor: number;
}

export interface EconomicStabilitySettings {
  priceWarDetectionEnabled: boolean;
  collusionDetectionEnabled: boolean;
  shortageDetectionEnabled: boolean;
}

export interface IntelligenceHistoryItem {
  _id: string;
  version: number;
  updatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  settings: {
    intelligence: IntelligenceSettings;
    stability: EconomicStabilitySettings;
  };
  changeReason?: string;
  ipAddress?: string;
  createdAt: string;
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
