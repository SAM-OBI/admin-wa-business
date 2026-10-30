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
      case 'CRITICAL': return 'bg-sv-danger text-sv-text-inverse';
      case 'HIGH': return 'bg-sv-warning text-sv-text-inverse';
      case 'LOW': return 'bg-sv-warning-soft text-sv-warning border border-sv-warning/30';
      default: return 'bg-sv-surface-muted text-sv-text-muted border border-sv-border';
    }
  };

  return (
    <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-sv-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sv-surface-muted/60">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-sv-text-primary flex items-center gap-2 tracking-tight">
            <FiShield className="text-sv-primary" /> Forensic Integrity Monitor
          </h3>
          <p className="text-xs text-sv-text-secondary font-medium">Phase 16: Institutional Watchdog Anomalies</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-[10px] sm:text-xs font-black uppercase border border-sv-border bg-sv-surface text-sv-text-primary rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sv-primary shadow-xs"
          >
            <option value="OPEN">Open Anomalies</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Events</option>
          </select>
          <button 
            onClick={fetchIncidents}
            className="p-2 hover:bg-sv-surface-muted text-sv-text-secondary hover:text-sv-text-primary rounded-lg transition"
            title="Refresh incidents"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
        <table className="w-full min-w-[700px]">
          <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted border-b border-sv-border">
            <tr>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left">Severity</th>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left">Order / Vendor</th>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left">Drift Details</th>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left">Detected</th>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left">Status</th>
              <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sv-border">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 sm:py-20 text-center text-sv-text-muted">
                  <FiCheckCircle size={40} className="mx-auto mb-4 opacity-30 text-sv-success" />
                  <p className="font-bold text-sv-text-primary">No forensic discrepancies found.</p>
                  <p className="text-xs text-sv-text-muted mt-1">Continuous scans are heartbeating.</p>
                </td>
              </tr>
            ) : (
              incidents.map((incident: ForensicIncident) => (
                <tr key={incident._id} className="hover:bg-sv-surface-muted/50 transition-colors group">
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <p className="text-xs font-bold text-sv-text-primary">Order: {incident.orderId}</p>
                    <p className="text-[10px] text-sv-text-muted font-medium">Vendor: {incident.vendorId}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className="flex flex-wrap gap-1">
                      {incident.diffFields.map((field: string, i: number) => (
                        <span key={i} className="text-[9px] bg-sv-danger-soft text-sv-danger border border-sv-danger/30 px-1.5 py-0.5 rounded font-bold uppercase">
                          {field} Modified
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-[10px] text-sv-text-muted font-medium">
                    {format(new Date(incident.timestamp), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                      incident.resolutionStatus === 'OPEN' ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30' :
                      incident.resolutionStatus === 'RESOLVED' ? 'bg-sv-success-soft text-sv-success border-sv-success/30' :
                      'bg-sv-surface-muted text-sv-text-secondary border-sv-border'
                    }`}>
                      {incident.resolutionStatus}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                    <button 
                      onClick={() => setSelectedIncident(incident)}
                      className="p-2 hover:bg-sv-surface-muted rounded-lg transition text-sv-text-muted hover:text-sv-primary"
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

      {/* Slide-over Detail View (Drawer) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-sv-surface h-full shadow-2xl animate-in slide-in-from-right duration-300 p-6 sm:p-8 overflow-y-auto border-l border-sv-border">
            <div className="flex justify-between items-center mb-6 sm:mb-8 pb-4 border-b border-sv-border">
              <h2 className="text-xl sm:text-2xl font-black text-sv-text-primary tracking-tight">Forensic Investigation</h2>
              <button onClick={() => setSelectedIncident(null)} className="p-2 hover:bg-sv-surface-muted text-sv-text-secondary hover:text-sv-text-primary rounded-full transition">✕</button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-sv-danger-soft border border-sv-danger/30 rounded-2xl flex items-center gap-4">
                <FiAlertTriangle className="text-sv-danger shrink-0" size={32} />
                <div>
                  <h4 className="font-black text-sv-danger uppercase text-xs tracking-widest">Tamper Detection Summary</h4>
                  <p className="text-sm text-sv-danger/90 mt-0.5">Discrepancy detected in order economic fields after ledger sealing.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-sv-surface-muted rounded-2xl border border-sv-border">
                  <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest mb-1">Expected Hash (Sealed)</p>
                  <code className="text-[10px] break-all font-mono bg-sv-surface text-sv-text-primary p-2.5 rounded-lg border border-sv-border block">
                    {selectedIncident.expectedHash}
                  </code>
                </div>
                <div className="p-4 bg-sv-surface-muted rounded-2xl border border-sv-border">
                  <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest mb-1">Actual Hash (Current)</p>
                  <code className="text-[10px] break-all font-mono bg-sv-surface text-sv-text-primary p-2.5 rounded-lg border border-sv-border block">
                    {selectedIncident.actualHash}
                  </code>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-sv-surface-elevated text-sv-text-primary rounded-2xl border border-sv-border shadow-xs">
                <h4 className="flex items-center gap-2 font-black uppercase text-xs mb-3 text-sv-warning">
                  <FiLock /> Containment Status
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sv-surface-muted/60 p-4 rounded-xl border border-sv-border">
                  <div>
                    <p className="text-base font-black text-sv-text-primary">Vendor Frozen</p>
                    <p className="text-xs text-sv-text-secondary mt-0.5">Withdrawals locked automatically.</p>
                  </div>
                  <button 
                    onClick={() => handleResolve(selectedIncident._id, 'RESOLVED')}
                    className="px-4 py-2 bg-sv-primary text-sv-text-inverse text-xs font-black uppercase rounded-lg hover:bg-sv-primary-hover transition-all shadow-xs shrink-0"
                  >
                    Lift & Resolve
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black uppercase text-xs text-sv-text-muted tracking-widest">Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleResolve(selectedIncident._id, 'INVESTIGATING')}
                    className="w-full py-3 bg-sv-surface border border-sv-border text-sv-text-primary hover:bg-sv-surface-muted text-xs font-black uppercase rounded-xl transition shadow-xs"
                  >
                    Mark Investigating
                  </button>
                  <button 
                     onClick={() => handleResolve(selectedIncident._id, 'FALSE_POSITIVE')}
                    className="w-full py-3 bg-sv-surface border border-sv-border text-sv-text-primary hover:bg-sv-surface-muted text-xs font-black uppercase rounded-xl transition shadow-xs"
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
