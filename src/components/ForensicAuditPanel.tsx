import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { 
  FiAlertTriangle, FiCheckCircle, FiShield, 
  FiSearch, FiRefreshCw, FiLock 
} from 'react-icons/fi';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ForensicIncident {
  _id: string;
  orderId: string;
  vendorId: string;
  expectedHash: string;
  actualHash: string;
  diffFields: string[];
  severity: 'LOW' | 'HIGH' | 'CRITICAL';
  detectedBy: string;
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolutionNote?: string;
  timestamp: string;
}

export default function ForensicAuditPanel() {
  const [incidents, setIncidents] = useState<ForensicIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [selectedIncident, setSelectedIncident] = useState<ForensicIncident | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getForensicIncidents({ status: filter === 'ALL' ? undefined : filter });
      if (res.data?.incidents) {
        setIncidents(res.data.incidents);
      }
    } catch {
      toast.error('Failed to fetch forensic alerts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleResolve = async (id: string, status: string) => {
    const note = window.prompt('Enter resolution note:');
    if (note === null) return;

    try {
      await adminService.resolveForensicIncident(id, { status, note });
      toast.success('Forensic incident updated');
      fetchIncidents();
      setSelectedIncident(null);
    } catch {
      toast.error('Failed to update incident');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'LOW': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <FiShield className="text-primary" /> Forensic Integrity Monitor
          </h3>
          <p className="text-xs text-gray-500 font-medium">Phase 16: Institutional Watchdog Anomalies</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-[10px] font-black uppercase border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="OPEN">Open Anomalies</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Events</option>
          </select>
          <button 
            onClick={fetchIncidents}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4 text-left">Severity</th>
              <th className="px-6 py-4 text-left">Order / Vendor</th>
              <th className="px-6 py-4 text-left">Drift Details</th>
              <th className="px-6 py-4 text-left">Detected</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                  <FiCheckCircle size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No forensic discrepancies found.</p>
                  <p className="text-xs">Continuous 10-minute scans are heartbeating.</p>
                </td>
              </tr>
            ) : (
              incidents.map((incident: ForensicIncident) => (
                <tr key={incident._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-800">Order: {incident.orderId}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Vendor: {incident.vendorId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {incident.diffFields.map((field: string, i: number) => (
                        <span key={i} className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-bold uppercase">
                          {field} Modified
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-gray-500 font-medium">
                    {format(new Date(incident.timestamp), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                      incident.resolutionStatus === 'OPEN' ? 'bg-red-50 text-red-600 border-red-200' :
                      incident.resolutionStatus === 'RESOLVED' ? 'bg-green-50 text-green-600 border-green-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {incident.resolutionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedIncident(incident)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-primary"
                    >
                      <FiSearch size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail View (Simple implementation) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800">Forensic Investigation</h2>
              <button onClick={() => setSelectedIncident(null)} className="p-2 hover:bg-gray-100 rounded-full transition">✕</button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4">
                <FiAlertTriangle className="text-red-600" size={32} />
                <div>
                  <h4 className="font-black text-red-800 uppercase text-xs tracking-widest">Tamper Detection Summary</h4>
                  <p className="text-sm text-red-700">Discrepancy detected in order economic fields after ledger sealing.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Hash (Sealed)</p>
                  <code className="text-[10px] break-all font-mono bg-white p-2 rounded border border-gray-100 block">
                    {selectedIncident.expectedHash}
                  </code>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Actual Hash (Current)</p>
                  <code className="text-[10px] break-all font-mono bg-white p-2 rounded border border-gray-100 block">
                    {selectedIncident.actualHash}
                  </code>
                </div>
              </div>

              <div className="p-4 bg-gray-900 text-white rounded-2xl">
                <h4 className="flex items-center gap-2 font-black uppercase text-xs mb-4">
                  <FiLock className="text-orange-400" /> Containment Status
                </h4>
                <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl">
                  <div>
                    <p className="text-lg font-black">Vendor Frozen</p>
                    <p className="text-xs opacity-60">Withdrawals locked automatically.</p>
                  </div>
                  <button 
                    onClick={() => handleResolve(selectedIncident._id, 'RESOLVED')}
                    className="px-4 py-2 bg-white text-black text-xs font-black uppercase rounded-lg hover:bg-orange-400 hover:text-white transition-all"
                  >
                    Lift & Resolve
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black uppercase text-xs text-gray-400 tracking-widest">Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleResolve(selectedIncident._id, 'INVESTIGATING')}
                    className="w-full py-3 bg-white border border-gray-200 text-xs font-black uppercase rounded-xl hover:bg-gray-50 transition"
                  >
                    Mark Investigating
                  </button>
                  <button 
                     onClick={() => handleResolve(selectedIncident._id, 'FALSE_POSITIVE')}
                    className="w-full py-3 bg-white border border-gray-200 text-xs font-black uppercase rounded-xl hover:bg-gray-50 transition"
                  >
                    False Positive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
