import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiShoppingBag, FiPackage, FiTrendingUp, 
  FiUserPlus, FiShoppingCart, FiMessageSquare,
  FiArrowRight, FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { TreasuryMetrics, RecentActivityFeed } from '../components/atomic/DashboardSections';
import { MetricValue, StatusBadge } from '../components/atomic/DashboardAtoms';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLoader from '../components/PageLoader';
import { logger } from '../utils/logger';

interface Stats {
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
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [treasury, setTreasury] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, activitiesRes, treasuryRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getRecentActivity(),
        adminService.getTreasuryHealth()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (activitiesRes.status === 'fulfilled') setActivities(activitiesRes.value.data);
      if (treasuryRes.status === 'fulfilled') setTreasury(treasuryRes.value.data);
      
    } catch (error) {
      logger.error('Critical Dashboard Failure:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
    { title: 'Registered Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', link: '/dashboard/users' },
    { title: 'Active Vendors', value: stats?.totalVendors || 0, icon: FiShoppingBag, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', link: '/dashboard/vendors' },
    { title: 'Global Catalog', value: stats?.totalProducts || 0, icon: FiPackage, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', link: '/dashboard/products' },
    { title: 'Total Volume', value: stats?.totalOrders || 0, icon: FiTrendingUp, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', link: '/dashboard/orders' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Governance Hub</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Real-time infrastructure & financial telemetry</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-white/5">
           <StatusBadge status="SUCCESS" label="System Online" />
           <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
           </div>
        </div>
      </div>

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
                  <Link to="/dashboard/financial-audit" className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
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
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 p-6 hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between">
                <MetricValue 
                    value={stat.value.toLocaleString()} 
                    label={stat.title} 
                    color="text-white" 
                />
                <div className={`${stat.color} p-3 rounded-xl border transform group-hover:rotate-6 transition-transform shadow-inner`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-5 group-hover:text-white transition-colors">
                {stat.title}
              </p>
            </div>
          </Link>
        ))}
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
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 p-8 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] h-full">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8">Command Center</h3>
            <div className="space-y-3">
              {[
                { label: 'Verify Vendors', link: '/dashboard/vendors?status=pending', count: stats?.unverifiedVendors, color: 'amber' },
                { label: 'Review Complaints', link: '/dashboard/complaints', count: stats?.pendingComplaints, color: 'red' },
                { label: 'Security Domain', link: '/dashboard/security', color: 'blue' }
              ].map((action, i) => (
                <Link 
                  key={i}
                  to={action.link}
                  className={`flex items-center justify-between p-5 bg-${action.color}-500/5 border border-${action.color}-500/10 rounded-xl hover:bg-${action.color}-500/10 hover:border-${action.color}-500/20 transition-all group`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${action.color}-500`}>{action.label}</span>
                  <div className="flex items-center gap-3">
                    {action.count !== undefined && action.count > 0 && (
                      <span className={`px-2.5 py-1 bg-${action.color}-500 text-black text-[9px] font-black rounded uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                        {action.count}
                      </span>
                    )}
                    <FiArrowRight size={14} className={`text-${action.color}-500 group-hover:translate-x-1 transition-transform`} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Critical Operational Alerts */}
            {(stats?.activeCourtCases || 0) > 0 && (
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
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1.5 opacity-70">
                        {stats?.activeCourtCases} CASES IN ARBITRATION
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
