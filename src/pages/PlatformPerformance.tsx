import { useEffect, useState, useCallback } from 'react';
import { FiTrendingUp, FiActivity, FiGlobe, FiFeather, FiFilter, FiDownload, FiDollarSign } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { logger } from '../utils/logger';
import PageLoader from '../components/PageLoader';
import { ErrorState } from '../components/ErrorState';

interface ROIStat {
  _id: 'pulse' | 'blog' | 'discover';
  totalClicks: number;
  totalConversions: number;
  totalValue: number;
}

interface TopContent {
  _id: { source: string; contentId: string };
  totalValue: number;
  totalConversions: number;
  totalClicks: number;
}

export default function PlatformPerformance() {
  const [stats, setStats] = useState<ROIStat[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('all-time'); // all-time, 7d, 30d

  const fetchROIData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (dateRange !== 'all-time') {
        const d = new Date();
        d.setDate(d.getDate() - (dateRange === '7d' ? 7 : 30));
        params.startDate = d.toISOString();
        params.endDate = new Date().toISOString();
      }

      const res = await adminService.getPlatformROIStats(params);
      if (res.success) {
        setStats(res.data.stats || []);
        setTopContent(res.data.topContent || []);
      }
    } catch (err: any) {
      logger.error('Failed to load platform ROI stats', err);
      setError(err.response?.data?.message || 'We couldn\'t load platform performance data right now.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchROIData();
  }, [fetchROIData]);

  const getSourceDetails = (source: string) => {
    switch (source) {
      case 'pulse': return { icon: FiActivity, color: 'text-sv-danger', bg: 'bg-sv-danger-soft' };
      case 'blog': return { icon: FiFeather, color: 'text-sv-info', bg: 'bg-sv-info-soft' };
      case 'discover': return { icon: FiGlobe, color: 'text-sv-warning', bg: 'bg-sv-warning-soft' };
      default: return { icon: FiTrendingUp, color: 'text-sv-text-muted', bg: 'bg-sv-surface-muted' };
    }
  };

  const calculateConversionRate = (clicks: number, conversions: number) => {
    if (!clicks) return '0.0';
    return ((conversions / clicks) * 100).toFixed(1);
  };

  const handleExport = () => {
    const rows = [
      ['Source', 'Clicks', 'Conversions', 'Conversion Rate (%)', 'Value (NGN)'],
      ...stats.map(s => [
        s._id,
        String(s.totalClicks),
        String(s.totalConversions),
        calculateConversionRate(s.totalClicks, s.totalConversions),
        (s.totalValue / 100).toFixed(2)
      ]),
      [],
      ['Top Content', 'Source', 'Clicks', 'Conversions', 'Value (NGN)'],
      ...topContent.map(c => [
        c._id.contentId,
        c._id.source,
        String(c.totalClicks),
        String(c.totalConversions),
        (c.totalValue / 100).toFixed(2)
      ])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-performance-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading && stats.length === 0) return <PageLoader />;

  if (error && stats.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-12">
        <ErrorState message={error} onRetry={fetchROIData} />
      </div>
    );
  }

  const aggregateTotals = {
    value: stats.reduce((acc, curr) => acc + curr.totalValue, 0),
    clicks: stats.reduce((acc, curr) => acc + curr.totalClicks, 0),
    conversions: stats.reduce((acc, curr) => acc + curr.totalConversions, 0)
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary uppercase tracking-tight flex items-center gap-3">
            <FiTrendingUp className="text-sv-success" /> Platform Performance
          </h1>
          <p className="text-xs text-sv-text-muted font-bold uppercase tracking-[0.2em] mt-1.5">Platform-Wide Attribution & ROI Telemetry</p>
        </div>
        
        <div className="flex items-center gap-3">
            <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2.5 focus:border-sv-primary transition-all outline-none cursor-pointer"
            >
                <option value="all-time">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="7d">Last 7 Days</option>
            </select>
            
            <button
                onClick={handleExport}
                disabled={stats.length === 0 && topContent.length === 0}
                className="bg-sv-primary text-sv-text-inverse px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sv-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FiDownload /> Export
            </button>
        </div>
      </div>

      {/* Global Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm relative overflow-hidden group hover:border-sv-success/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sv-success-soft rounded-full blur-3xl group-hover:bg-sv-success/20 transition-all"></div>
              <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <FiDollarSign className="text-sv-success" /> Total ROI Value
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-sv-text-primary tracking-tight flex items-baseline gap-1">
                  <span className="text-xl text-sv-text-muted">₦</span>{(aggregateTotals.value / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
          </div>
          
          <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm relative overflow-hidden group hover:border-sv-info/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sv-info-soft rounded-full blur-3xl group-hover:bg-sv-info/20 transition-all"></div>
              <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-[0.2em] mb-2">Platform Clicks</p>
              <h2 className="text-3xl sm:text-4xl font-black text-sv-text-primary tracking-tight">{aggregateTotals.clicks.toLocaleString()}</h2>
          </div>
          
          <div className="bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm relative overflow-hidden group hover:border-sv-tag/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sv-tag-soft rounded-full blur-3xl group-hover:bg-sv-tag/20 transition-all"></div>
              <p className="text-[10px] text-sv-text-muted font-black uppercase tracking-[0.2em] mb-2">Checkout Conversions</p>
              <h2 className="text-3xl sm:text-4xl font-black text-sv-text-primary tracking-tight">{aggregateTotals.conversions.toLocaleString()}</h2>
          </div>
      </div>

      {/* Source Breakdown (The Matrix) */}
      <div>
          <h3 className="text-xs font-black text-sv-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <FiFilter /> Attribution Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['pulse', 'blog', 'discover'].map((sourceId) => {
                  const stat = stats.find(s => s._id === sourceId) || { totalValue: 0, totalConversions: 0, totalClicks: 0 };
                  const details = getSourceDetails(sourceId);
                  
                  return (
                      <div key={sourceId} className="bg-sv-surface border border-sv-border rounded-2xl p-6 flex flex-col shadow-sm hover:border-sv-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-6">
                              <div className={`p-3 rounded-2xl ${details.bg}`}>
                                  <details.icon className={`text-xl ${details.color}`} />
                              </div>
                              <div className="text-right">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-sv-text-muted block mb-1">Source</span>
                                  <span className="font-bold uppercase tracking-widest text-sm text-sv-text-primary">{sourceId}</span>
                              </div>
                          </div>
                          
                          <div className="space-y-4 flex-1">
                              <div className="flex justify-between items-end border-b border-sv-border pb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-sv-text-muted">Gen. Value</span>
                                  <span className="font-black text-lg text-sv-text-primary">₦{(stat.totalValue / 100).toLocaleString('en-NG')}</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-sv-border pb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-sv-text-muted">Clicks</span>
                                  <span className="font-black text-md text-sv-text-secondary">{stat.totalClicks.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-end pb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-sv-text-muted">Wins</span>
                                  <div className="text-right">
                                      <span className="font-black text-md text-sv-success block">{stat.totalConversions.toLocaleString()}</span>
                                      <span className="text-[9px] font-bold text-sv-success">{calculateConversionRate(stat.totalClicks, stat.totalConversions)}% CVR</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-sv-surface border border-sv-border rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="mb-6 flex items-center justify-between">
              <div>
                  <h3 className="text-xs font-black text-sv-text-primary uppercase tracking-[0.2em]">Viral Content Leaderboard</h3>
                  <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest mt-1">Ranked by Financial Impact</p>
              </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
              <table className="w-full text-left min-w-[700px]">
                  <thead>
                      <tr className="border-b border-sv-border text-[9px] font-black uppercase tracking-[0.2em] text-sv-text-muted bg-sv-surface-muted/50">
                          <th className="py-4 pl-4 pr-6 w-12">Rank</th>
                          <th className="py-4 px-6 relative w-24">Source</th>
                          <th className="py-4 px-6">Entity Ref</th>
                          <th className="py-4 px-6 text-right">Clicks</th>
                          <th className="py-4 px-6 text-right">Wins</th>
                          <th className="py-4 pl-6 pr-4 text-right">Value (₦)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                      {topContent.map((content, idx) => {
                          const details = getSourceDetails(content._id.source);
                          return (
                              <tr key={`${content._id.source}-${content._id.contentId}`} className="group hover:bg-sv-surface-muted/60 transition-colors">
                                  <td className="py-4 pl-4 pr-6">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-sv-warning text-sv-text-inverse' : 'bg-sv-surface-muted text-sv-text-muted'}`}>
                                          {idx + 1}
                                      </span>
                                  </td>
                                  <td className="py-4 px-6">
                                      <div className="flex items-center gap-2">
                                          <details.icon className={`${details.color}`} />
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-sv-text-secondary">{content._id.source}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 px-6">
                                      <span className="text-[11px] font-mono tracking-wider text-sv-text-muted group-hover:text-sv-text-primary transition-colors">{content._id.contentId.slice(-8)}</span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <span className="text-xs font-medium text-sv-text-muted">{content.totalClicks.toLocaleString()}</span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <span className="text-xs font-bold text-sv-success">{content.totalConversions.toLocaleString()}</span>
                                  </td>
                                  <td className="py-4 pl-6 pr-4 text-right">
                                      <span className="text-sm font-black text-sv-text-primary">{(content.totalValue / 100).toLocaleString('en-NG')}</span>
                                  </td>
                              </tr>
                          );
                      })}
                      
                      {topContent.length === 0 && (
                          <tr>
                              <td colSpan={6} className="py-12 text-center">
                                  <p className="text-sv-text-muted font-medium text-sm">No attribution data collected yet.</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
