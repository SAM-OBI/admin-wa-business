import { useEffect, useState, useCallback } from 'react';
import { FiTrendingUp, FiActivity, FiGlobe, FiFeather, FiFilter, FiDownload, FiDollarSign } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { logger } from '../utils/logger';
import PageLoader from '../components/PageLoader';

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
  const [dateRange, setDateRange] = useState('all-time'); // all-time, 7d, 30d

  const fetchROIData = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      logger.error('Failed to load platform ROI stats', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchROIData();
  }, [fetchROIData]);

  const getSourceDetails = (source: string) => {
    switch (source) {
      case 'pulse': return { icon: FiActivity, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'blog': return { icon: FiFeather, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'discover': return { icon: FiGlobe, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: FiTrendingUp, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    }
  };

  const calculateConversionRate = (clicks: number, conversions: number) => {
    if (!clicks) return '0.0';
    return ((conversions / clicks) * 100).toFixed(1);
  };

  if (loading && stats.length === 0) return <PageLoader />;

  const aggregateTotals = {
    value: stats.reduce((acc, curr) => acc + curr.totalValue, 0),
    clicks: stats.reduce((acc, curr) => acc + curr.totalClicks, 0),
    conversions: stats.reduce((acc, curr) => acc + curr.totalConversions, 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <FiTrendingUp className="text-emerald-500" /> Platform Performance
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Platform-Wide Attribution & ROI Telemetry</p>
        </div>
        
        <div className="flex items-center gap-3">
            <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-black border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-3 focus:border-white/30 transition-all outline-none"
            >
                <option value="all-time">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="7d">Last 7 Days</option>
            </select>
            
            <button className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2">
                <FiDownload /> Export
            </button>
        </div>
      </div>

      {/* Global Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/40 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <FiDollarSign className="text-emerald-500" /> Total ROI Value
              </p>
              <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                  <span className="text-xl text-zinc-500">₦</span>{(aggregateTotals.value / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </h2>
          </div>
          
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/40 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-2">Platform Clicks</p>
              <h2 className="text-4xl font-black tracking-tight">{aggregateTotals.clicks.toLocaleString()}</h2>
          </div>
          
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/40 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-2">Checkout Conversions</p>
              <h2 className="text-4xl font-black tracking-tight">{aggregateTotals.conversions.toLocaleString()}</h2>
          </div>
      </div>

      {/* Source Breakdown (The Matrix) */}
      <div>
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FiFilter /> Attribution Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['pulse', 'blog', 'discover'].map((sourceId) => {
                  const stat = stats.find(s => s._id === sourceId) || { totalValue: 0, totalConversions: 0, totalClicks: 0 };
                  const details = getSourceDetails(sourceId);
                  
                  return (
                      <div key={sourceId} className="bg-black border border-white/5 rounded-[32px] p-6 flex flex-col hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-8">
                              <div className={`p-3 rounded-2xl ${details.bg}`}>
                                  <details.icon className={`text-xl ${details.color}`} />
                              </div>
                              <div className="text-right">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Source</span>
                                  <span className="font-bold uppercase tracking-widest text-sm text-white">{sourceId}</span>
                              </div>
                          </div>
                          
                          <div className="space-y-4 flex-1">
                              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Gen. Value</span>
                                  <span className="font-black text-lg">₦{(stat.totalValue / 100).toLocaleString('en-NG')}</span>
                              </div>
                              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Clicks</span>
                                  <span className="font-black text-md text-zinc-300">{stat.totalClicks.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-end pb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Wins</span>
                                  <div className="text-right">
                                      <span className="font-black text-md text-emerald-400 block">{stat.totalConversions.toLocaleString()}</span>
                                      <span className="text-[9px] font-bold text-emerald-500/70">{calculateConversionRate(stat.totalClicks, stat.totalConversions)}% CVR</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 overflow-hidden">
          <div className="mb-8 flex items-center justify-between">
              <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Viral Content Leaderboard</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Ranked by Financial Impact</p>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          <th className="pb-4 pl-4 pr-6 w-12">Rank</th>
                          <th className="pb-4 px-6 relative w-24">Source</th>
                          <th className="pb-4 px-6">Entity Ref</th>
                          <th className="pb-4 px-6 text-right">Clicks</th>
                          <th className="pb-4 px-6 text-right">Wins</th>
                          <th className="pb-4 pl-6 pr-4 text-right">Value (₦)</th>
                      </tr>
                  </thead>
                  <tbody>
                      {topContent.map((content, idx) => {
                          const details = getSourceDetails(content._id.source);
                          return (
                              <tr key={`${content._id.source}-${content._id.contentId}`} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                  <td className="py-4 pl-4 pr-6">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                          {idx + 1}
                                      </span>
                                  </td>
                                  <td className="py-4 px-6">
                                      <div className="flex items-center gap-2">
                                          <details.icon className={`${details.color}`} />
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{content._id.source}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 px-6">
                                      <span className="text-[11px] font-mono tracking-wider text-zinc-400 group-hover:text-white transition-colors">{content._id.contentId.slice(-8)}</span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <span className="text-xs font-medium text-zinc-400">{content.totalClicks.toLocaleString()}</span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <span className="text-xs font-bold text-emerald-400">{content.totalConversions.toLocaleString()}</span>
                                  </td>
                                  <td className="py-4 pl-6 pr-4 text-right">
                                      <span className="text-sm font-black text-white">{(content.totalValue / 100).toLocaleString('en-NG')}</span>
                                  </td>
                              </tr>
                          );
                      })}
                      
                      {topContent.length === 0 && (
                          <tr>
                              <td colSpan={6} className="py-12 text-center">
                                  <p className="text-zinc-500 font-medium text-sm">No attribution data collected yet.</p>
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
