import { useState, useEffect, useCallback } from 'react';
import { FiShield, FiClock, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import { ErrorState } from '../components/ErrorState';
import { adminService } from '../api/admin.service';
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger';

interface VendorSubscription {
  _id: string;
  name: string;
  email: string;
  plan?: string;
  status?: string;
  billingCycle?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  manualOverridePlan?: string;
  manualOverrideExpiresAt?: string;
}

interface SubscriptionStats {
  activePaid: number;
  inTrial: number;
  expiringSoon: number;
  recentlyChurned: number;
}

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptions, setSubscriptions] = useState<VendorSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    plan: '',
    status: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchSubscriptions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getVendorSubscriptions({
        page,
        limit: pagination.limit,
        plan: filters.plan || undefined,
        status: filters.status || undefined,
        search: searchTerm || undefined
      });
      if (res.data?.subscriptions) {
        setSubscriptions(res.data.subscriptions);
        setPagination(res.data.pagination);
      } else {
        setSubscriptions([]);
      }
    } catch (err: any) {
      logger.error('Failed to fetch vendor subscriptions:', err);
      setError(err.response?.data?.message || 'We couldn\'t load subscriptions right now.');
    } finally {
      setLoading(false);
    }
  }, [filters.plan, filters.status, searchTerm, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getSubscriptionStats();
      if (res.data) setStats(res.data);
    } catch (err) {
      logger.error('Failed to fetch subscription stats:', err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscriptions(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.plan, filters.status, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchSubscriptions(newPage);
    }
  };

  const metrics = [
    { title: 'Active Paid Subscriptions', value: stats?.activePaid ?? '—', trendType: 'positive' as const, icon: <FiShield /> },
    { title: 'Vendors in Trial', value: stats?.inTrial ?? '—', trendType: 'positive' as const, icon: <FiClock /> },
    { title: 'Expiring Next 7 Days', value: stats?.expiringSoon ?? '—', trendType: 'neutral' as const, icon: <FiAlertTriangle /> },
    { title: 'Recently Churned', value: stats?.recentlyChurned ?? '—', trendType: 'negative' as const, icon: <FiXCircle /> },
  ];

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : '—';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight uppercase">Subscriptions & Billing</h1>
          <p className="text-sv-text-muted font-medium mt-1 uppercase text-xs tracking-[0.2em]">Institutional Financial Governance</p>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-sv-surface p-5 rounded-2xl border border-sv-border shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-sv-text-primary transform group-hover:scale-110 transition-transform duration-500">
              {metric.icon}
            </div>
            <div className="text-sv-text-muted text-[10px] font-black uppercase tracking-widest mb-2">{metric.title}</div>
            <div className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight mb-2">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <select
              value={filters.plan}
              onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="shopvia">Shopvia</option>
              <option value="business">Business</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL_ACTIVE">Trial Active</option>
              <option value="TRIAL_GRACE">Grace Period</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH VENDOR OR EMAIL..."
            className="w-full sm:w-72"
            context="ADMIN"
          />
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface-muted/50">
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Vendor Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Subscription Plan</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Billing Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Lifecycle Timestamps</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sv-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16">
                      <ErrorState message={error} onRetry={() => fetchSubscriptions(pagination.page)} />
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FiShield className="text-sv-text-muted w-12 h-12" />
                        <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">No vendor subscriptions matching these filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-sv-surface-muted/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-sv-text-primary">{sub.name}</div>
                      <div className="text-xs text-sv-text-muted">{sub.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-sv-surface-muted text-sv-text-primary border border-sv-border">
                        {sub.plan || 'free'}
                      </span>
                      {sub.manualOverridePlan && (
                        <span className="ml-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-sv-warning-soft text-sv-warning border border-sv-warning/30">
                          Override
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-sv-text-secondary uppercase tracking-widest">{sub.status || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-sv-text-muted">
                      {sub.trialEndsAt && <div>Trial ends: {formatDate(sub.trialEndsAt)}</div>}
                      {sub.subscriptionEndsAt && <div>Renews/expires: {formatDate(sub.subscriptionEndsAt)}</div>}
                      {!sub.trialEndsAt && !sub.subscriptionEndsAt && '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/dashboard/vendors/${sub._id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-sv-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Global Pagination Hub */}
        <div className="px-6 py-4 border-t border-sv-border bg-sv-surface-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{subscriptions.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Entities
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
