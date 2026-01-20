import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiShoppingBag, FiPackage, FiAlertCircle, FiTrendingUp, 
  FiDollarSign, FiUserPlus, FiShoppingCart, FiMessageSquare,
  FiClock, FiArrowRight, FiCheckCircle
} from 'react-icons/fi';
import api from '../api/axios';

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

interface Activity {
  type: string;
  action: string;
  data: any;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/recent-activity')
      ]);
      setStats(statsRes.data.data || {});
      setActivities(activitiesRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({} as Stats);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <FiUserPlus className="text-blue-600" />;
      case 'vendor': return <FiShoppingBag className="text-green-600" />;
      case 'product': return <FiPackage className="text-purple-600" />;
      case 'order': return <FiShoppingCart className="text-orange-600" />;
      case 'complaint': return <FiMessageSquare className="text-red-600" />;
      default: return <FiCheckCircle className="text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const data = activity.data || {};
    switch (activity.type) {
      case 'user':
        return `${data.name || 'User'} registered`;
      case 'vendor':
        return `${data.name || 'Vendor'} joined as vendor`;
      case 'product':
        return `${data.name || 'Product'} added by ${data.store || 'store'}`;
      case 'order':
        return `Order #${String(data.orderId || '').slice(-6)} placed - ₦${(data.amount || 0).toLocaleString()}`;
      case 'complaint':
        return `Complaint filed: ${data.title || 'Complaint'}`;
      default:
        return 'Activity recorded';
    }
  };

  const getRelativeTime = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'bg-blue-500', link: '/users' },
    { title: 'Total Vendors', value: stats?.totalVendors || 0, icon: FiShoppingBag, color: 'bg-green-500', link: '/vendors' },
    { title: 'Total Products', value: stats?.totalProducts || 0, icon: FiPackage, color: 'bg-purple-500', link: '/products' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: FiTrendingUp, color: 'bg-orange-500', link: '/orders' },
  ];

  const revenueCards = [
    { title: "Today's Revenue", value: stats?.revenue?.today || 0, icon: FiDollarSign, color: 'bg-emerald-500' },
    { title: "Week's Revenue", value: stats?.revenue?.week || 0, icon: FiDollarSign, color: 'bg-teal-500' },
    { title: "Month's Revenue", value: stats?.revenue?.month || 0, icon: FiDollarSign, color: 'bg-cyan-500' },
  ];

  const alerts = [
    ...((stats?.pendingComplaints || 0) > 0 ? [{
      title: 'Pending Complaints',
      count: stats?.pendingComplaints,
      link: '/complaints',
      color: 'red'
    }] : []),
    ...((stats?.unverifiedVendors || 0) > 0 ? [{
      title: 'Unverified Vendors',
      count: stats?.unverifiedVendors,
      link: '/vendors',
      color: 'yellow'
    }] : []),
    ...((stats?.activeCourtCases || 0) > 0 ? [{
      title: 'Active Court Cases',
      count: stats?.activeCourtCases,
      link: '/court-cases',
      color: 'orange'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Real-time platform analytics and insights</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link} className="block group">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stat.value.toLocaleString()}</h3>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="text-2xl text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        {revenueCards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mt-2 tracking-tight">₦{card.value.toLocaleString()}</h3>
              </div>
              <div className={`${card.color} p-3 rounded-xl shadow-lg shadow-black/5 transform rotate-3`}>
                <card.icon className="text-xl text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 lg:p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800">Recent Activity</h2>
              <p className="text-sm text-gray-500 mt-1">Latest platform events</p>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-4">
                {(activities || []).slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-blue-50/30 transition border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="p-2.5 bg-gray-100 rounded-xl shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{getActivityText(activity)}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 font-medium">
                        <FiClock size={12} />
                        {getRelativeTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {stats?.unverifiedVendors && stats.unverifiedVendors > 0 && (
                <Link 
                  to="/vendors?status=pending"
                  className="flex items-center justify-between p-3.5 bg-yellow-50/50 border border-yellow-200/50 rounded-xl hover:bg-yellow-100 hover:border-yellow-300 transition-all group"
                >
                  <span className="text-sm font-semibold text-yellow-800">Verify Vendors</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-yellow-200/80 text-yellow-900 text-xs font-bold rounded-full">
                      {stats.unverifiedVendors}
                    </span>
                    <FiArrowRight className="text-yellow-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )}
              
              {stats?.pendingComplaints && stats.pendingComplaints > 0 && (
                <Link 
                  to="/complaints"
                  className="flex items-center justify-between p-3.5 bg-red-50/50 border border-red-200/50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group"
                >
                  <span className="text-sm font-semibold text-red-800">Review Complaints</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-200/80 text-red-900 text-xs font-bold rounded-full">
                      {stats.pendingComplaints}
                    </span>
                    <FiArrowRight className="text-red-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )}

              <Link 
                to="/products"
                className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all group"
              >
                <span className="text-sm font-semibold text-blue-800">Manage Products</span>
                <FiArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                to="/orders"
                className="flex items-center justify-between p-3.5 bg-green-50/50 border border-green-100 rounded-xl hover:bg-green-100 transition-all group"
              >
                <span className="text-sm font-semibold text-green-800">View Orders</span>
                <FiArrowRight className="text-green-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts</h3>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <Link
                    key={index}
                    to={alert.link}
                    className={`block p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${
                      alert.color === 'red' ? 'bg-red-50/50 border-red-100 hover:border-red-200' :
                      alert.color === 'yellow' ? 'bg-yellow-50/50 border-yellow-100 hover:border-yellow-200' :
                      'bg-orange-50/50 border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className={`mt-0.5 text-lg ${
                        alert.color === 'red' ? 'text-red-600' :
                        alert.color === 'yellow' ? 'text-yellow-600' :
                        'text-orange-600'
                      }`} />
                      <div>
                        <h4 className={`font-semibold text-sm ${
                          alert.color === 'red' ? 'text-red-900' :
                          alert.color === 'yellow' ? 'text-yellow-900' :
                          'text-orange-900'
                        }`}>{alert.title}</h4>
                        <p className={`text-xs mt-1 font-medium ${
                          alert.color === 'red' ? 'text-red-700' :
                          alert.color === 'yellow' ? 'text-yellow-700' :
                          'text-orange-700'
                        }`}>
                          {alert.count} require(s) attention
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
