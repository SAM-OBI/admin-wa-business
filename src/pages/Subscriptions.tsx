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
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Subscriptions & Billing</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Institutional Financial Governance</p>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800/40 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-white transform group-hover:scale-110 transition-transform duration-500">
              {metric.icon}
            </div>
            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">{metric.title}</div>
            <div className="text-3xl font-black text-white tracking-tight mb-2">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={filters.plan}
              onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
              className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
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
              className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
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

      <div className="bg-sv-surface-elevated/50 rounded-2xl border border-sv-border backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface/5">
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Vendor Entity</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Subscription Plan</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Billing Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Lifecycle Timestamps</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sv-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16">
                      <ErrorState message={error} onRetry={() => fetchSubscriptions(pagination.page)} />
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FiShield className="text-sv-text-muted w-12 h-12" />
                        <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">No vendor subscriptions matching these filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-sv-surface-muted/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-white">{sub.name}</div>
                      <div className="text-xs text-sv-text-muted">{sub.email}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-sv-surface-muted text-sv-text-primary">
                        {sub.plan || 'free'}
                      </span>
                      {sub.manualOverridePlan && (
                        <span className="ml-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Override
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-sv-text-secondary uppercase tracking-widest">{sub.status || '—'}</span>
                    </td>
                    <td className="px-8 py-5 text-xs text-sv-text-muted">
                      {sub.trialEndsAt && <div>Trial ends: {formatDate(sub.trialEndsAt)}</div>}
                      {sub.subscriptionEndsAt && <div>Renews/expires: {formatDate(sub.subscriptionEndsAt)}</div>}
                      {!sub.trialEndsAt && !sub.subscriptionEndsAt && '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
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
        <div className="px-8 py-6 border-t border-sv-border bg-sv-surface/5 flex items-center justify-between">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{subscriptions.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Entities
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
