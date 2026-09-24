import { Link } from 'react-router-dom';
import {
  FiUsers, FiShoppingBag, FiPackage, FiTrendingUp,
  FiUserPlus, FiShoppingCart, FiMessageSquare,
  FiArrowRight, FiCheckCircle, FiAlertTriangle, FiRefreshCw,
  FiDollarSign, FiShield, FiTarget, FiCreditCard
} from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { TreasuryMetrics, RecentActivityFeed } from '../components/atomic/DashboardSections';
import { MetricValue, StatusBadge } from '../components/atomic/DashboardAtoms';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLoader from '../components/PageLoader';
import { useQuery } from '../hooks/useQuery';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

interface DashboardViewModel {
  stats: {
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalOrders: number;
    pendingComplaints: number;
    activeCourtCases: number;
    unverifiedVendors: number;
    revenue: {
      today: number;
      week: number;
      month: number;
      breakdown?: {
        today?: RevenueBreakdown;
        week?: RevenueBreakdown;
        month?: RevenueBreakdown;
      };
    };
  };
  lastUpdated: string;
}

interface RevenueBreakdown {
  buyerFee: number;
  ads: number;
  subscription: number;
  total: number;
}

export default function Dashboard() {
  const {
    data: statsData,
    isLoading: loadingStats,
    isFetching: refreshingStats,
    isError: statsError,
    error: statsErrorDetail,
    refetch: refetchStats,
    lastUpdated
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await adminService.getDashboardStats();
      return res.data;
    },
    staleTime: 60000,
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  const { data: activities = [], isError: activitiesError, refetch: refetchActivities } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      const res = await adminService.getRecentActivity();
      return res.data;
    },
    staleTime: 30000
  });

  const { data: treasury, isError: treasuryError, refetch: refetchTreasury } = useQuery({
    queryKey: ['dashboard', 'treasury'],
    queryFn: async () => {
      const res = await adminService.getTreasuryHealth();
      return res.data;
    },
    staleTime: 120000
  });

  const loading = loadingStats;
  const refreshing = refreshingStats;
  const viewModel: DashboardViewModel | null = statsData ? { stats: statsData, lastUpdated: new Date(lastUpdated).toISOString() } : null;
  const hasAnyFetchError = statsError || activitiesError || treasuryError;

  const isV2Enabled = useFeatureFlag('admin.dashboard.v2');

  const handleRefresh = async () => {
      // 🛡️ [BATCH-10] Was refetching stats only — activity/treasury stayed
      // stale after "Retry"/refresh even though they're displayed right
      // alongside stats on this same page.
      await Promise.all([refetchStats(), refetchActivities(), refetchTreasury()]);
  };

  if (!isV2Enabled) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Legacy Admin Dashboard</h1>
        <p>This view has been deprecated. Please enable V2 in platform settings.</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <FiUserPlus className="text-blue-400" />;
      case 'vendor': return <FiShoppingBag className="text-emerald-400" />;
      case 'product': return <FiPackage className="text-purple-400" />;
      case 'order': return <FiShoppingCart className="text-orange-400" />;
      case 'complaint': return <FiMessageSquare className="text-red-400" />;
      default: return <FiCheckCircle className="text-zinc-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    const data = activity.data || {};
    switch (activity.type) {
      case 'user': return `${data.name || 'User'} REGISTERED`;
      case 'vendor': return `${data.name || 'Vendor'} JOINED PLATFORM`;
      case 'product': return `${data.name || 'Product'} ADDED TO CATALOG`;
      case 'order': return `ORDER #${String(data.orderId || '').slice(-6)} PROCESSED`;
      case 'complaint': return `COMPLAINT FILED: ${data.title || 'SUPPORT REQUEST'}`;
      default: return 'SYSTEM EVENT RECORDED';
    }
  };

  if (loading) return <PageLoader />;

  const statCards = [
    { title: 'Registered Users', value: viewModel?.stats.totalUsers || 0, icon: FiUsers, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', link: '/dashboard/users' },
    { title: 'Active Vendors', value: viewModel?.stats.totalVendors || 0, icon: FiShoppingBag, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', link: '/dashboard/vendors' },
    { title: 'Global Catalog', value: viewModel?.stats.totalProducts || 0, icon: FiPackage, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', link: '/dashboard/products' },
    { title: 'Total Volume', value: viewModel?.stats.totalOrders || 0, icon: FiTrendingUp, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', link: '/dashboard/orders' },
  ];

  // eslint-disable-next-line react-hooks/purity
  const timeSinceUpdate = viewModel?.lastUpdated ? Math.round((Date.now() - new Date(viewModel.lastUpdated).getTime()) / 60000) : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8 max-w-7xl mx-auto bg-background text-body">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-heading uppercase tracking-tight">Governance Hub</h1>
          <p className="text-xs text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Real-time infrastructure & financial telemetry</p>
        </div>
        <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-subtle">
           <button
             onClick={handleRefresh}
             disabled={refreshing}
             className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 hover:text-heading transition-colors mr-2"
           >
             <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
             {timeSinceUpdate === 0 ? 'Just now' : `${timeSinceUpdate} min ago`}
           </button>
           {hasAnyFetchError ? (
             <StatusBadge status="CRITICAL" label="Data Fetch Error" />
           ) : (
             <StatusBadge status="SUCCESS" label="System Online" />
           )}
           <div className="relative flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full animate-ping absolute ${hasAnyFetchError ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className={`w-2 h-2 rounded-full relative ${hasAnyFetchError ? 'bg-red-500' : 'bg-emerald-500'}`} />
           </div>
        </div>
      </div>

      {hasAnyFetchError && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center gap-5">
          <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
            <FiAlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-sm uppercase tracking-[0.1em] text-red-500">Some dashboard data failed to load</h3>
            <p className="text-[10px] font-bold uppercase text-muted mt-1">
              {statsErrorDetail?.message || 'One or more requests to the admin API failed. Figures below may be incomplete or stale.'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-sv-danger text-sv-text-inverse hover:opacity-90 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Treasury Alert System */}
      <ErrorBoundary name="Treasury Monitor">
        {treasury && (
            <div className="space-y-6">
              {treasury.status !== 'NORMAL' && (
                <div className={`p-5 rounded-2xl border flex items-center gap-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] ${
                  treasury.status === 'EMERGENCY' ? 'bg-red-600 text-white border-red-700' :
                  treasury.status === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-orange-500/10 text-orange-500 border-orange-500/20'
                }`}>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <FiAlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-sm uppercase tracking-[0.1em]">TREASURY_{treasury.status}_PROTOCOL_ACTIVE</h3>
                    <p className="text-[10px] font-bold uppercase opacity-80 mt-1">Liquidity Score: {treasury.liquidityScore}% | Payout Gate: Restricted</p>
                  </div>
                  <Link to="/dashboard/financial-audit" className="px-4 py-2 bg-sv-primary text-sv-text-inverse hover:bg-sv-primary-hover rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    Analyze Ledger
                  </Link>
                </div>
              )}
              <TreasuryMetrics data={treasury} />
            </div>
        )}
      </ErrorBoundary>

      {/* Performance Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link} className="block group">
            <div className="bg-surface rounded-2xl border border-subtle p-6 hover:bg-surface-elevated hover:border-primary-active transition-all duration-300 shadow-sm">
              <div className="flex items-center justify-between">
                <MetricValue 
                    value={stat.value.toLocaleString()} 
                    label={stat.title} 
                    color="text-heading" 
                />
                <div className={`${stat.color} p-3 rounded-xl border transform group-hover:rotate-6 transition-transform shadow-inner`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-5 group-hover:text-primary transition-colors">
                {stat.title}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* 🛡️ [FIX] Platform revenue (buyer protection fee, ads, subscriptions)
          existed on the API/view-model but was never rendered anywhere on
          this page — the old figure was also GMV (order totals), not
          Shopvia's actual take. Real per-source revenue, from the Ledger
          (buyer fee + ads) and subscription payment records. */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-heading uppercase tracking-[0.2em]">Platform Revenue (30d)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Revenue', value: viewModel?.stats.revenue.breakdown?.month?.total ?? viewModel?.stats.revenue.month ?? 0, icon: FiDollarSign, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            { title: 'Buyer Protection Fees', value: viewModel?.stats.revenue.breakdown?.month?.buyerFee ?? 0, icon: FiShield, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            { title: 'Ads Revenue', value: viewModel?.stats.revenue.breakdown?.month?.ads ?? 0, icon: FiTarget, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            { title: 'Subscription Revenue', value: viewModel?.stats.revenue.breakdown?.month?.subscription ?? 0, icon: FiCreditCard, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
          ].map((stat) => (
            <div key={stat.title} className="bg-surface rounded-2xl border border-subtle p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <MetricValue
                  value={(stat.value / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  prefix="₦"
                  label={stat.title}
                  color="text-heading"
                />
                <div className={`${stat.color} p-3 rounded-xl border shadow-inner`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-5">
                {stat.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Oversight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Registry */}
        <div className="lg:col-span-2">
          <ErrorBoundary name="Activity Registry">
            <RecentActivityFeed 
              activities={activities} 
              getActivityIcon={getActivityIcon} 
              getActivityText={getActivityText} 
            />
          </ErrorBoundary>
        </div>

        {/* Command Center */}
        <div className="space-y-6">
          <div className="bg-surface-elevated rounded-2xl border border-subtle p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] h-full">
            <h3 className="text-xs font-black text-heading uppercase tracking-[0.2em] mb-8">Command Center</h3>
            <div className="space-y-3">
              {[
                { label: 'Verify Vendors', link: '/dashboard/vendors?status=pending', count: viewModel?.stats.unverifiedVendors, color: 'amber' as const },
                { label: 'Review Complaints', link: '/dashboard/complaints', count: viewModel?.stats.pendingComplaints, color: 'red' as const },
                { label: 'Security Domain', link: '/dashboard/security', color: 'blue' as const }
              ].map((action, i) => {
                // 🛡️ [FIX] Tailwind's build-time scanner can't see class names assembled via
                // template-literal interpolation (`bg-${action.color}-500/5`) — those utilities
                // were never generated, so these cards had no border/hover styling in production.
                // Static, fully-literal class strings per color instead.
                const styles = {
                  amber: {
                    card: 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/20',
                    text: 'text-amber-500',
                    badge: 'bg-amber-500'
                  },
                  red: {
                    card: 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20',
                    text: 'text-red-500',
                    badge: 'bg-red-500'
                  },
                  blue: {
                    card: 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20',
                    text: 'text-blue-500',
                    badge: 'bg-blue-500'
                  }
                }[action.color];
                return (
                  <Link
                    key={i}
                    to={action.link}
                    className={`flex items-center justify-between p-5 border rounded-xl transition-all group ${styles.card}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>{action.label}</span>
                    <div className="flex items-center gap-3">
                      {action.count !== undefined && action.count > 0 && (
                        <span className={`px-2.5 py-1 text-black text-[9px] font-black rounded uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] ${styles.badge}`}>
                          {action.count}
                        </span>
                      )}
                      <FiArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${styles.text}`} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Critical Operational Alerts */}
            {(viewModel?.stats.activeCourtCases || 0) > 0 && (
               <Link
                  to="/dashboard/court-cases"
                  className="mt-6 block p-5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all shadow-sm group"
               >
                  <div className="flex items-start gap-5">
                    <div className="p-2.5 bg-red-500 rounded-xl shadow-lg shadow-red-500/20 group-hover:rotate-3 transition-transform text-black flex items-center justify-center">
                      <FiAlertTriangle size={18} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active Litigation</h4>
                      <p className="text-[10px] font-bold text-muted uppercase mt-1.5 opacity-70">
                        {viewModel?.stats.activeCourtCases} CASES IN ARBITRATION
                      </p>
                    </div>
                  </div>
               </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
