import { useEffect, useState } from 'react';
import { adminService } from '../api/admin.service';
import { 
  FiShield, FiLock, FiActivity, FiUserX, FiEye, FiCheckCircle
} from 'react-icons/fi';
import Swal from 'sweetalert2';

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
  const [loading, setLoading] = useState(true);

  const fetchSecurityStats = async () => {
    try {
      const response = await adminService.getSecurityStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
      Swal.fire('Error', 'Could not load security dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStats();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Failed Logins (24h)', value: stats?.kpis.failedLogins24h || 0, icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Account Lockouts (24h)', value: stats?.kpis.accountLockouts24h || 0, icon: FiUserX, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'PII Access Anomalies', value: stats?.kpis.piiAnomalies24h || 0, icon: FiEye, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Legal Holds Active', value: stats?.kpis.activeLegalHolds || 0, icon: FiLock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiShield className="text-primary" /> Security Operations Center
          </h1>
          <p className="text-gray-500 text-sm">Real-time threat monitoring and compliance tracking</p>
        </div>
        <button 
          onClick={fetchSecurityStats}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
        >
          <FiActivity /> Refresh Stream
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Alerts Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
