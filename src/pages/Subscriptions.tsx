import { useState } from 'react';
import { FiShield, FiClock, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';

interface SubscriptionMetric {
  title: string;
  value: string | number;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  icon: any;
}

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');

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

  // Mock initial state before backend wiring
  const metrics: SubscriptionMetric[] = [
    { title: 'Active Paid Subscriptions', value: '1,248', trend: '+12% this month', trendType: 'positive', icon: <FiShield /> },
    { title: 'Vendors in 14-Day Trial', value: '342', trend: '+5% this week', trendType: 'positive', icon: <FiClock /> },
    { title: 'Expiring Next 7 Days', value: '89', trend: 'Requires attention', trendType: 'neutral', icon: <FiAlertTriangle /> },
    { title: 'Recently Churned', value: '12', trend: '-2% churn rate', trendType: 'negative', icon: <FiXCircle /> },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
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
            <div className={`text-[10px] font-bold uppercase tracking-wide ${
              metric.trendType === 'positive' ? 'text-emerald-500' :
              metric.trendType === 'negative' ? 'text-red-500' : 'text-amber-500'
            }`}>
              {metric.trend}
            </div>
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
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="gold">Gold</option>
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
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH VENDOR OR ID..."
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
                {/* Empty State pending backend API wiring */}
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiShield className="text-sv-text-muted w-12 h-12" />
                      <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">Awaiting Backend Event Sync...</p>
                    </div>
                  </td>
                </tr>
            </tbody>
          </table>
        </div>

        {/* Global Pagination Hub */}
        <div className="px-8 py-6 border-t border-sv-border bg-sv-surface/5 flex items-center justify-between">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">0</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Entities
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
