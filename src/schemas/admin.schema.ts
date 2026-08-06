import { z } from 'zod';

export const TreasuryHealthSchema = z.object({
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'EMERGENCY']).default('NORMAL'),
  liquidityScore: z.number().default(0),
  totalEscrowValue: z.number().default(0),
  totalWalletLiability: z.number().default(0),
  exposureRatio: z.number().default(0),
});

export const DashboardStatsSchema = z.object({
  totalUsers: z.number().default(0),
  totalVendors: z.number().default(0),
  totalProducts: z.number().default(0),
  totalOrders: z.number().default(0),
  pendingComplaints: z.number().default(0),
  activeCourtCases: z.number().default(0),
  unverifiedVendors: z.number().default(0),
  revenue: z.object({
    today: z.number().default(0),
    week: z.number().default(0),
    month: z.number().default(0),
    // 🛡️ [FIX] Real per-source platform revenue (buyer protection fee, ads,
    // subscriptions) — the top-level today/week/month were GMV before this
    // fix, not Shopvia's actual take, and had no breakdown by source at all.
    breakdown: z.object({
      today: z.object({ buyerFee: z.number().default(0), ads: z.number().default(0), subscription: z.number().default(0), total: z.number().default(0) }).optional(),
      week: z.object({ buyerFee: z.number().default(0), ads: z.number().default(0), subscription: z.number().default(0), total: z.number().default(0) }).optional(),
      month: z.object({ buyerFee: z.number().default(0), ads: z.number().default(0), subscription: z.number().default(0), total: z.number().default(0) }).optional(),
    }).optional(),
  }).default({ today: 0, week: 0, month: 0 }),
});

export const ActivitySchema = z.object({
  type: z.string(),
  action: z.string(),
  data: z.any().optional(),
  createdAt: z.string(),
});

export const ActivityListSchema = z.array(ActivitySchema).default([]);
