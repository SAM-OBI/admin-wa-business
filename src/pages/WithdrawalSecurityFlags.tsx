import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { FiAlertTriangle, FiMail, FiPhone, FiMessageCircle, FiCheckCircle } from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';
import { logger } from '../utils/logger';

// 🛡️ [WITHDRAWAL-RISK-FLAG-1] Queue of withdrawal attempts blocked by the
// 24h post-PIN/password-change security hold (withdrawal.controller.ts).
// The hold itself still hard-blocks the vendor — nothing here changes
// that. This is purely the visibility + contact layer that didn't exist
// before: an admin had zero trace that a blocked attempt even happened.
interface WithdrawalSecurityFlag {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string } | null;
  storeId: { _id: string; name: string; slug: string; contact?: { phone?: string; whatsapp?: string } } | null;
  reason: 'PASSWORD_CHANGE' | 'PIN_CHANGE';
  riskScore: number;
  attemptedAmountKobo: number;
  lockUntil: string;
  status: 'OPEN' | 'CONTACTED' | 'RESOLVED' | 'DISMISSED';
  notes?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-sv-danger-soft text-sv-danger',
  CONTACTED: 'bg-sv-warning-soft text-sv-warning',
  RESOLVED: 'bg-sv-success-soft text-sv-success',
  DISMISSED: 'bg-sv-surface-muted text-sv-text-secondary'
};

const REASON_LABELS: Record<string, string> = {
  PIN_CHANGE: 'Withdrawal PIN Change',
  PASSWORD_CHANGE: 'Password Change'
};

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}

function normalizeTelHref(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

function normalizeWhatsAppHref(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export default function WithdrawalSecurityFlags() {
  const [flags, setFlags] = useState<WithdrawalSecurityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchFlags = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getWithdrawalSecurityFlags({ page, limit: pagination.limit, status: statusFilter || undefined });
      setFlags(res.data?.flags || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err: any) {
      logger.error('Failed to fetch withdrawal security flags:', err);
      setError(err.response?.data?.message || "We couldn't load this queue right now.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit]);

  useEffect(() => { fetchFlags(1); }, [fetchFlags]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await adminService.updateWithdrawalSecurityFlag(id, status);
      setFlags(prev => prev.map(f => (f._id === id ? { ...f, status: status as any } : f)));
    } catch (err: any) {
      logger.error('Failed to update flag:', err);
      alert(err.response?.data?.message || 'Could not update this flag.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sv-text-primary flex items-center gap-2">
            <FiAlertTriangle className="text-sv-warning" /> Withdrawal Security Flags
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Withdrawal attempts blocked by a vendor's 24h post-PIN/password-change hold. The hold itself is automatic — this is where you reach out.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface text-sm"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="CONTACTED">Contacted</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="bg-sv-surface rounded-xl shadow-sm border border-sv-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Attempted</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {flags.map((flag) => {
                const email = flag.userId?.email;
                // 🛡️ Two genuinely separate numbers, per Samuel's explicit
                // ask — a vendor's ordinary phone and their store's WhatsApp
                // contact are not guaranteed to be the same value.
                const ordinaryPhone = flag.userId?.phone || flag.storeId?.contact?.phone;
                const whatsappNumber = flag.storeId?.contact?.whatsapp;
                const telHref = normalizeTelHref(ordinaryPhone);
                const waHref = normalizeWhatsAppHref(whatsappNumber);

                return (
                  <tr key={flag._id} className="hover:bg-sv-surface-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sv-text-primary">{flag.userId?.name || 'Unknown vendor'}</div>
                      <div className="text-xs text-sv-text-secondary">{flag.storeId?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-sv-tag-soft text-sv-tag">
                        {REASON_LABELS[flag.reason] || flag.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-sv-text-primary">{formatNaira(flag.attemptedAmountKobo)}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sv-danger">{flag.riskScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sv-text-secondary">
                        {email && (
                          <a href={`mailto:${email}`} title={email} className="hover:text-sv-primary">
                            <FiMail size={16} />
                          </a>
                        )}
                        {telHref && (
                          <a href={telHref} title={`Call ${ordinaryPhone}`} className="hover:text-sv-primary">
                            <FiPhone size={16} />
                          </a>
                        )}
                        {waHref && (
                          <a href={waHref} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${whatsappNumber}`} className="hover:text-green-600">
                            <FiMessageCircle size={16} />
                          </a>
                        )}
                        {!email && !telHref && !waHref && <span className="text-xs text-sv-text-secondary">No contact on file</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[flag.status]}`}>
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {flag.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusChange(flag._id, 'CONTACTED')}
                            disabled={updatingId === flag._id}
                            className="text-sv-warning hover:underline text-sm font-medium disabled:opacity-50"
                          >
                            Mark Contacted
                          </button>
                        )}
                        {(flag.status === 'OPEN' || flag.status === 'CONTACTED') && (
                          <button
                            onClick={() => handleStatusChange(flag._id, 'RESOLVED')}
                            disabled={updatingId === flag._id}
                            className="text-sv-success hover:underline text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                          >
                            <FiCheckCircle size={14} /> Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {error && (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <ErrorState message={error} onRetry={() => fetchFlags(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && flags.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sv-text-secondary">
                    No withdrawal security flags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-sv-border flex items-center justify-between">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-medium">{flags.length}</span> of <span className="font-medium">{pagination.total}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchFlags(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-sv-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-sv-text-secondary">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => fetchFlags(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-sv-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
