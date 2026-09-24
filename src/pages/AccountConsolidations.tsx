import { useState, useEffect, useCallback } from 'react';
import { 
  FiGitPullRequest, FiCheckCircle, FiXCircle, 
  FiArrowRight, FiShield, FiClock, FiFileText, FiRefreshCw
} from 'react-icons/fi';
import api from '../api/axios';
import { logger } from '../utils/logger';
import Swal from 'sweetalert2';

interface ConsolidationRequest {
  _id: string;
  sourceUserId: { _id: string; name: string; email: string; status: string };
  targetUserId: { _id: string; name: string; email: string; status: string };
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  requestedBy: { name: string };
  createdAt: string;
  approvedBy?: string[];
  executedAt?: string;
  executionChecksum?: string;
}

export default function AccountConsolidations() {
  const [requests, setRequests] = useState<ConsolidationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/consolidation', {
          params: { status: filter === 'ALL' ? undefined : filter }
      });
      setRequests(res.data.data);
    } catch (error) {
      logger.error('Failed to fetch consolidation requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    const { value: justification } = await Swal.fire({
      title: 'Approve Consolidation',
      input: 'textarea',
      inputLabel: 'Justification',
      inputPlaceholder: 'Type your justification here...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to provide a justification!';
        return null;
      }
    });

    if (justification) {
      try {
        await api.post('/admin/consolidation/approve', { requestId: id, justification });
        Swal.fire('Approved', 'Consolidation request approved.', 'success');
        fetchRequests();
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Approval failed.', 'error');
      }
    }
  };

  const handleExecute = async (id: string) => {
    const result = await Swal.fire({
      title: 'Execute Transactional Merge?',
      text: "This will move all balances and assets. This action is IRREVERSIBLE.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Execute Now!'
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/consolidation/${id}/execute`);
        Swal.fire('Executed', 'Account consolidation COMPLETED successfully.', 'success');
        fetchRequests();
      } catch (error: any) {
        Swal.fire('Execution Failed', error.response?.data?.message || 'Transaction aborted.', 'error');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-sv-success-soft text-sv-success';
      case 'APPROVED': return 'bg-sv-info-soft text-sv-info';
      case 'REQUESTED': return 'bg-sv-warning-soft text-sv-warning';
      case 'FAILED': 
      case 'REJECTED': return 'bg-sv-danger-soft text-sv-danger';
      case 'EXECUTING': return 'bg-sv-info-soft text-sv-info animate-pulse';
      default: return 'bg-sv-surface-muted text-sv-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FiGitPullRequest className="text-blue-600" />
            Account Consolidations
          </h1>
          <p className="text-gray-500 text-sm mt-1">Institutional merging of duplicate vendor identities.</p>
        </div>
        <div className="flex gap-2">
            <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-sv-surface border border-sv-border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sv-primary/20"
            >
                <option value="ALL">All Status</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
            </select>
            <button 
                onClick={fetchRequests}
                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      <div className="bg-sv-surface border border-sv-border rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Request Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Source Account</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-sv-text-muted uppercase tracking-widest"><FiArrowRight className="mx-auto" /></th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Target Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-sv-surface-muted transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-sv-text-muted">ID: ...{req._id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-sv-text-secondary mt-1 flex items-center gap-1">
                            <FiClock className="shrink-0" />
                            {new Date(req.createdAt).toLocaleDateString()} by {req.requestedBy?.name}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-sv-text-primary">{req.sourceUserId?.name}</span>
                      <span className="text-xs text-sv-text-secondary">{req.sourceUserId?.email}</span>
                      <span className="text-[10px] font-bold text-red-500 mt-1 uppercase">Source (To be closed)</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <FiArrowRight className="mx-auto text-sv-text-muted" />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-sv-text-primary">{req.targetUserId?.name}</span>
                      <span className="text-xs text-sv-text-secondary">{req.targetUserId?.email}</span>
                      <span className="text-[10px] font-bold text-green-600 mt-1 uppercase">Target (Survivor)</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                        {req.status === 'REQUESTED' && (
                            <button 
                                onClick={() => handleApprove(req._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sv-primary text-sv-text-inverse rounded-lg text-xs font-bold hover:bg-sv-primary-hover transition"
                            >
                                <FiCheckCircle size={14} /> Approve
                            </button>
                        )}
                        {req.status === 'APPROVED' && (
                            <button 
                                onClick={() => handleExecute(req._id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sv-success text-sv-text-inverse rounded-lg text-xs font-bold hover:opacity-90 transition"
                            >
                                <FiShield size={14} /> Execute Merge
                            </button>
                        )}
                        {(req.status === 'COMPLETED' || req.status === 'FAILED') && (
                            <button 
                                onClick={() => Swal.fire('Execution Forensic', `Checksum: ${req.executionChecksum || 'N/A'}\nExecuted At: ${req.executedAt ? new Date(req.executedAt).toLocaleString() : 'N/A'}`, 'info')}
                                className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                                title="View Forensic Data"
                            >
                                <FiFileText size={16} />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                  <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-sv-text-muted italic">
                          No consolidation requests found.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-sv-info-soft border border-sv-info/30 p-6 rounded-[32px] space-y-4">
              <div className="flex items-center gap-3 text-sv-info">
                  <FiShield className="text-xl" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Dual-Control Policy</h3>
              </div>
              <p className="text-xs text-sv-info leading-relaxed opacity-80">
                  High-value accounts require multiple administrator approvals. The executor cannot be the same person who requested the consolidation.
              </p>
          </div>
          <div className="bg-sv-success-soft border border-sv-success/30 p-6 rounded-[32px] space-y-4">
              <div className="flex items-center gap-3 text-sv-success">
                  <FiCheckCircle className="text-xl" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Transactional Safety</h3>
              </div>
              <p className="text-xs text-sv-success leading-relaxed opacity-80">
                  All merges use <strong>SNAPSHOT</strong> isolation with distributed locks. Balances are migrated via append-only ledger entries with zero-drift verification.
              </p>
          </div>
          <div className="bg-sv-warning-soft border border-sv-warning/30 p-6 rounded-[32px] space-y-4">
              <div className="flex items-center gap-3 text-sv-warning">
                  <FiXCircle className="text-xl" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Irreversibility</h3>
              </div>
              <p className="text-xs text-sv-warning leading-relaxed opacity-80">
                  Once a consolidation is executed, PII is scrubbed from the source account and it is permanently deactivated. Recovery is only possible via forensic backups.
              </p>
          </div>
      </div>
    </div>
  );
}
