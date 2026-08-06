import { z } from 'zod';

// Zod Versioned API Contracts
export const AdminDashboardResponseV1 = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalVendors: z.number().int().nonnegative(),
  totalProducts: z.number().int().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  pendingComplaints: z.number().int().nonnegative(),
  activeCourtCases: z.number().int().nonnegative(),
  unverifiedVendors: z.number().int().nonnegative(),
  revenue: z.object({
    today: z.number().nonnegative(),
    week: z.number().nonnegative(),
    month: z.number().nonnegative()
  })
});

export type AdminDashboardStatsV1 = z.infer<typeof AdminDashboardResponseV1>;

export const TreasuryHealthResponseV1 = z.object({
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'EMERGENCY']),
  liquidityScore: z.number().min(0).max(100),
  balance: z.number(),
  lastReconciledAt: z.string().datetime().optional()
});

export type TreasuryHealthV1 = z.infer<typeof TreasuryHealthResponseV1>;

export const ActivityFeedResponseV1 = z.array(z.object({
  _id: z.string(),
  type: z.string(),
  data: z.any(),
  timestamp: z.string().datetime()
}));

export type ActivityFeedV1 = z.infer<typeof ActivityFeedResponseV1>;
