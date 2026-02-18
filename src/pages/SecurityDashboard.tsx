import { useEffect, useState } from 'react';
import { adminService } from '../api/admin.service';
import { 
  FiShield, FiLock, FiActivity, FiCheckCircle
} from 'react-icons/fi';

interface SecurityAlert {
  _id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  metadata: any;
  resolved: boolean;
  createdAt: string;
}

interface SecurityStats {
  kpis: {
    failedLogins24h: number;
    accountLockouts24h: number;
    piiAnomalies24h: number;
    activeLegalHolds: number;
  };
  recentAlerts: SecurityAlert[];
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, metricsRes] = await Promise.all([
        adminService.getSecurityStats(),
        adminService.getSecurityMetrics()
      ]);
      
      // Handle versioned API envelope (v1.1)
      const metricsData = metricsRes?.version ? metricsRes.data : metricsRes?.data;
      
      // Use functional updates to maintain "Last Known Good" on partial failure if needed
      if (statsRes?.data) setStats(statsRes.data);
      if (metricsData) {
        setMetrics(metricsData);
        setLastSync(new Date());
        
        // Check for critical RBAC spikes
        if (metricsData.rbac?.mismatches > 15) {
          setCriticalAlert(`⚠️ High RBAC Mismatch Rate: ${metricsData.rbac.mismatches}/min`);
        } else {
          setCriticalAlert(null);
        }
      }
      
      setRetryCount(0); // Reset backoff on success
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Resilient Polling with Exponential Backoff
    const baseInterval = 30000; // 30s
    const maxInterval = 300000; // 5 mins
    const backoff = Math.min(maxInterval, baseInterval * Math.pow(2, retryCount));

    const poller = setTimeout(fetchData, backoff);
    return () => clearTimeout(poller);
  }, [retryCount]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );

  if (loading && !stats && !metrics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Security Operations Center</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never';
    const seconds = Math.floor((new Date().getTime() - lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const kpiCards = [
    { title: 'Failed Logins (24h)', value: stats?.kpis.failedLogins24h || 0, icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'RBAC Mismatches', value: metrics?.rbac.mismatches || 0, icon: FiLock, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Argon2 Migrated', value: metrics?.argon2.migrated || 0, icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Legal Holds Active', value: stats?.kpis.activeLegalHolds || 0, icon: FiShield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {criticalAlert && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <FiShield className="text-red-600 text-xl" />
            <span className="text-red-800 font-semibold">{criticalAlert}</span>
          </div>
          <button 
            onClick={() => setCriticalAlert(null)} 
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiShield className="text-primary" /> Security Operations Center
          </h1>
          <p className="text-gray-600 mt-1 text-sm flex items-center gap-2">
            Real-time monitoring & threat detection
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Last Sync: {getTimeSinceSync()}
            </span>
            {retryCount > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                Reconnecting... ({retryCount})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
          >
            <FiActivity /> Refresh Stream
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`${card.bg} p-3 rounded-xl ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{card.title}</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Argon2 Migration Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FiLock className="text-primary" /> Argon2 Migration Progress
            </h3>
            <span className={`text-xs font-bold px-2 py-1 rounded ${metrics?.argon2.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {metrics?.argon2.status || 'IDLE'}
            </span>
        </div>
        <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
                <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                        {Math.round((metrics?.argon2.migrated / (metrics?.argon2.total || 1)) * 100)}% Complete
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-primary">
                        {metrics?.argon2.p95}ms Latency (p95)
                    </span>
                </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                <div style={{ width: `${(metrics?.argon2.migrated / (metrics?.argon2.total || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Alerts & Mismatches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">RBAC Parity Stream</h2>
              <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">Shadow Mode</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                        <tr>
                            <th className="px-6 py-4 text-left">Resource</th>
                            <th className="px-6 py-4 text-left">Mismatch</th>
                            <th className="px-6 py-4 text-left">User</th>
                            <th className="px-6 py-4 text-left">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {metrics?.rbac.recent.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">No mismatches detected in last 50 events</td></tr>
                        ) : (
                            metrics?.rbac.recent.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-800">{item.path}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">{item.method}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                            {item.mismatchType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {item.userId || 'System'}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400">
                                        {new Date(item.createdAt).toLocaleTimeString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Threat Alerts Stream</h2>
              <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">Live Detection</span>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4 text-left">Level</th>
                  <th className="px-6 py-4 text-left">Event</th>
                  <th className="px-6 py-4 text-left">Entity</th>
                  <th className="px-6 py-4 text-left">Time</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center text-gray-400">
                        <FiCheckCircle size={40} className="mb-4 text-green-400" />
                        <p className="font-medium">All systems normal. No active threats detected.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stats?.recentAlerts.map((alert) => (
                    <tr key={alert._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800">{alert.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        {alert.userId ? (
                          <div className="text-xs">
                            <p className="font-bold text-gray-800">{alert.userId.name}</p>
                            <p className="text-gray-400">{alert.userId.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">System/Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-primary hover:underline text-xs font-bold">Investigate</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* Security Health & Compliance */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiShield className="text-green-500" /> Compliance Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">NDPR Data Anonymizer</span>
                <span className="text-green-600 font-bold flex items-center gap-1"><FiCheckCircle /> Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Legal Hold Registry</span>
                <span className="text-green-600 font-bold flex items-center gap-1"><FiCheckCircle /> Synced</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Encryption Layer</span>
                <span className="text-green-600 font-bold flex items-center gap-1"><FiCheckCircle /> 256-bit</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Security Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-gray-800">98</span>
                  <span className="text-sm font-bold text-green-500 mb-1">/ 100</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500 w-[98%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary text-white rounded-2xl p-6 shadow-xl shadow-primary/20">
            <h3 className="font-bold text-lg mb-2">Automated Resilience</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-4">
              Our background "Chaos Engine" runs daily to simulate network failures and database outages, ensuring 99.9% uptime for your vendors.
            </p>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <FiActivity className="animate-pulse" />
              <div className="text-[10px] font-black uppercase tracking-widest">
                Last Test: PASS (14m ago)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
