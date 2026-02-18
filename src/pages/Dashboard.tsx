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
      case 'user': return <FiUserPlus className="text-blue-600" />;
      case 'vendor': return <FiShoppingBag className="text-emerald-600" />;
      case 'product': return <FiPackage className="text-purple-600" />;
      case 'order': return <FiShoppingCart className="text-orange-600" />;
      case 'complaint': return <FiMessageSquare className="text-red-600" />;
      default: return <FiCheckCircle className="text-gray-400" />;
    }
  };

  const getActivityText = (activity: any) => {
    const data = activity.data || {};
    switch (activity.type) {
      case 'user': return `${data.name || 'User'} registered`;
      case 'vendor': return `${data.name || 'Vendor'} joined platform`;
      case 'product': return `${data.name || 'Product'} added to catalog`;
      case 'order': return `Order #${String(data.orderId || '').slice(-6)} processed`;
      case 'complaint': return `Complaint filed: ${data.title || 'Support Request'}`;
      default: return 'System event recorded';
    }
  };

  if (loading) return <PageLoader />;

  const statCards = [
    { title: 'Registered Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'bg-blue-600', link: '/dashboard/users' },
    { title: 'Active Vendors', value: stats?.totalVendors || 0, icon: FiShoppingBag, color: 'bg-emerald-600', link: '/dashboard/vendors' },
    { title: 'Global Catalog', value: stats?.totalProducts || 0, icon: FiPackage, color: 'bg-purple-600', link: '/dashboard/products' },
    { title: 'Total Volume', value: stats?.totalOrders || 0, icon: FiTrendingUp, color: 'bg-orange-600', link: '/dashboard/orders' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Governance Hub</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time infrastructure & financial telemetry</p>
        </div>
        <div className="flex items-center gap-2">
           <StatusBadge status="SUCCESS" label="System Online" />
           <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
        </div>
      </div>

      {/* Treasury (High Risk) */}
      <ErrorBoundary name="Treasury Monitor">
        {treasury && (
            <div className="space-y-4">
              {treasury.status !== 'NORMAL' && (
                <div className={`p-4 rounded-xl border flex items-center gap-4 animate-pulse ${
                  treasury.status === 'EMERGENCY' ? 'bg-red-600 text-white border-red-700' :
                  treasury.status === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-orange-100 text-orange-800 border-orange-200'
                }`}>
                  <FiAlertTriangle size={20} />
                  <div className="flex-1">
                    <h3 className="font-black text-sm uppercase tracking-tight">TREASURY {treasury.status} ALERT</h3>
                    <p className="text-[10px] font-bold uppercase opacity-90">Liquidity Score: {treasury.liquidityScore}% | Payout Gate Active</p>
                  </div>
                  <Link to="/dashboard/financial-audit" className="px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                    Audit Ledger
                  </Link>
                </div>
              )}
              <TreasuryMetrics data={treasury} />
            </div>
        )}
      </ErrorBoundary>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link} className="block group">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <MetricValue 
                    value={stat.value.toLocaleString()} 
                    label={stat.title} 
                    color="text-gray-900" 
                />
                <div className={`${stat.color} p-3 rounded-xl shadow-lg shadow-black/5 transform group-hover:rotate-6 transition-transform`}>
                  <stat.icon className="text-xl text-white" />
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 group-hover:text-blue-600 transition-colors">
                {stat.title}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ErrorBoundary name="Activity Registry">
            <RecentActivityFeed 
              activities={activities} 
              getActivityIcon={getActivityIcon} 
              getActivityText={getActivityText} 
            />
          </ErrorBoundary>
        </div>

        {/* Action Center */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Action Center</h3>
            <div className="space-y-3">
              {[
                { label: 'Verify Vendors', link: '/dashboard/vendors?status=pending', count: stats?.unverifiedVendors, color: 'amber' },
                { label: 'Review Complaints', link: '/dashboard/complaints', count: stats?.pendingComplaints, color: 'red' },
                { label: 'Security Protocols', link: '/dashboard/security', color: 'blue' }
              ].map((action, i) => (
                <Link 
                  key={i}
                  to={action.link}
                  className={`flex items-center justify-between p-4 bg-${action.color}-50/50 border border-${action.color}-100 rounded-xl hover:bg-${action.color}-100 transition-all group`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${action.color}-900`}>{action.label}</span>
                  <div className="flex items-center gap-2">
                    {action.count !== undefined && action.count > 0 && (
                      <span className={`px-2 py-0.5 bg-${action.color}-200 text-${action.color}-900 text-[10px] font-black rounded-full`}>
                        {action.count}
                      </span>
                    )}
                    <FiArrowRight className={`text-${action.color}-600 group-hover:translate-x-1 transition-transform`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Operational Alerts */}
          {(stats?.activeCourtCases || 0) > 0 && (
             <Link
                to="/dashboard/court-cases"
                className="block p-4 rounded-2xl border border-orange-100 bg-orange-50/30 hover:bg-orange-50 transition-all shadow-sm group"
             >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-orange-100 group-hover:rotate-3 transition-transform">
                    <StatusBadge status="WARNING" label="!" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest">Active Litigation</h4>
                    <p className="text-[10px] font-bold text-orange-700 uppercase mt-1">
                      {stats?.activeCourtCases} cases require mediation
                    </p>
                  </div>
                </div>
             </Link>
          )}
        </div>
      </div>
    </div>
  );
}
