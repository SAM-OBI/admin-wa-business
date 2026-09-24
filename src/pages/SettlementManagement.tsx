import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { FiLock, FiCheckCircle, FiSlash, FiTrendingUp } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useAdminGovernanceStepUp } from '../hooks/useAdminGovernanceStepUp';

interface SettlementDashboard {
  totalSettlementValue: number;
  totalSettlementReleased: number;
  totalSettlementDisputed: number;
  totalInProcess?: number; // Legacy Fallback
  totalReleased?: number; // Legacy Fallback
  totalDisputed?: number; // Legacy Fallback
  pendingRelease: number;
  byStatus: Array<{ _id: string; count: number; amount: number }>;
}

interface VendorSettlement {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalInProcess: number;
  totalReleased: number;
  orderCount: number;
  stores: Array<{ _id: string; name: string }>;
}

interface SettlementTransaction {
  _id: string;
  orderId: string;
  settlementState: string;
  totalAmount: number;
  status: string;
  vendor: {
    name: string;
    email: string;
  };
  store: {
    name: string;
  };
  createdAt: string;
  settlementReleaseAt?: string;
}

export default function SettlementManagement() {
  // 🛡️ [MFA-P0-PHASE-2A] Settlement's force-release/hold are both
  // ADMIN_CRITICAL_POLICY (FORENSIC) — gated by governanceGuard()'s MFA
  // freshness check. Wrapping with `execute` lets a stale/missing MFA
  // session get refreshed via the same governance step-up modal, then
  // transparently retries the original request (no token to attach — once
  // refreshed, the session itself satisfies governanceGuard()).
  const { execute: executeWithStepUp, modal: governanceStepUpModal } = useAdminGovernanceStepUp();
  const [dashboard, setDashboard] = useState<SettlementDashboard | null>(null);
  const [vendors, setVendors] = useState<VendorSettlement[]>([]);
  const [transactions, setTransactions] = useState<SettlementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'transactions'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/admin/settlement/dashboard');
      if (res.data.success) {
        setDashboard(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const params: any = { limit: 20 };
      if (filterStatus !== 'all') params.status = filterStatus.toUpperCase();

      const res = await api.get('/admin/settlement/by-vendor', { params });
      if (res.data.success) {
        setVendors(res.data.data.vendors);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  }, [filterStatus]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filterStatus !== 'all') params.status = filterStatus.toUpperCase();

      const res = await api.get('/admin/settlement/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // 🛡️ [BATCH-10] The status filter control only exists inside the
  // Transactions tab (see the JSX below), but this single effect listed
  // all three fetchers, so every filter change refetched the Overview
  // dashboard and the Vendors list too, even though the filter has nothing
  // to do with either. Dashboard/Vendors now load once on mount;
  // Transactions alone reacts to filter changes.
  useEffect(() => {
    fetchDashboard();
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleForceRelease = async (orderId: string, orderIdDisplay: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Force Release Settlement',
      html: `
        <p class="mb-4">Order: <strong>${orderIdDisplay}</strong></p>
        <p class="text-[10px] text-gray-500 mb-4 bg-orange-50 p-2 rounded border border-orange-100">
           Institutional Guard: Action will be cryptographically signed and logged with justification.
        </p>
        <textarea id="reason" class="swal2-textarea w-full" placeholder="Internal justification (min 10 chars)..." rows="4" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Release Funds',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
        if (!reason || reason.length < 10) {
          Swal.showValidationMessage('Min 10 characters required for override audit trail');
          return false;
        }
        return reason;
      }
    });

    if (reason) {
      try {
        const res = await executeWithStepUp(() => api.post(`/admin/settlement/${orderId}/release`, { reason }));

        if (res.data.success) {
          Swal.fire('Released!', 'Settlement released successfully.', 'success');
          fetchDashboard();
          fetchVendors();
          fetchTransactions();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to release funds', 'error');
      }
    }
  };

  const handleHoldSettlement = async (orderId: string, orderIdDisplay: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Hold Settlement',
      html: `
        <p class="mb-4">Order: <strong>${orderIdDisplay}</strong></p>
        <p class="text-sm text-orange-600 mb-4 font-bold">Locks funds in HELD state (SLA Suspended)</p>
        <textarea id="reason" class="swal2-textarea w-full" placeholder="Justification for hold..." rows="4" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Hold Funds',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
        if (!reason || reason.length < 10) {
          Swal.showValidationMessage('Min 10 characters required for audit trail');
          return false;
        }
        return reason;
      }
    });

    if (reason) {
      try {
        const res = await executeWithStepUp(() => api.post(`/admin/settlement/${orderId}/hold`, { reason }));

        if (res.data.success) {
          Swal.fire('Hold Applied!', 'Safe Settlement is now HELD.', 'success');
          fetchTransactions();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to apply hold', 'error');
      }
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sv-text-primary flex items-center gap-2">
          <FiLock className="text-emerald-600" />
          Safe Settlement Oversight
        </h1>
        <p className="text-gray-500 text-sm mt-1">Institutional mediator dashboard for buyer-protection protocols</p>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-sv-surface rounded-2xl p-6 border border-sv-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">In-Process</div>
              <FiLock className="text-orange-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{(dashboard.totalSettlementValue ?? dashboard.totalInProcess ?? 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {dashboard.pendingRelease} awaiting SLA maturity
            </p>
          </div>

          <div className="bg-sv-surface rounded-2xl p-6 border border-sv-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Released</div>
              <FiCheckCircle className="text-green-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{(dashboard.totalSettlementReleased ?? dashboard.totalReleased ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-sv-surface rounded-2xl p-6 border border-sv-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Disputed</div>
              <FiSlash className="text-red-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{(dashboard.totalSettlementDisputed ?? dashboard.totalDisputed ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-sv-surface rounded-2xl p-6 border border-sv-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">AUM (Volume)</div>
              <FiTrendingUp className="text-blue-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{( (dashboard.totalSettlementValue ?? dashboard.totalInProcess ?? 0) + (dashboard.totalSettlementReleased ?? dashboard.totalReleased ?? 0) ).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-sv-surface rounded-2xl border border-sv-border shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'vendors'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            By Vendor
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'transactions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Transactions
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && dashboard && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                Status Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboard.byStatus.map((status) => (
                  <div key={status._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-800 capitalize text-sm">{status._id || 'Unknown'}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{status.count} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-gray-900">₦{status.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  Settlement by Vendor
                </h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-sv-border">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">In-Process</th>
                      <th className="px-4 py-3">Released</th>
                      <th className="px-4 py-3">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {vendors.map((vendor) => (
                      <tr key={vendor.vendorId} className="hover:bg-sv-surface-muted transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-bold text-sv-text-primary">{vendor.vendorName}</div>
                            <div className="text-[10px] text-sv-text-muted">{vendor.vendorEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-black text-orange-600 text-sm">
                          ₦{vendor.totalInProcess.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-black text-green-600 text-sm">
                          ₦{vendor.totalReleased.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-sv-text-secondary">
                          {vendor.orderCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  Audit-Grade Transactions
                </h3>
                <div className="flex gap-2">
                  {/* 🛡️ [BATCH-11] Was missing 3 of the 6 real canonical
                      settlementState values (RELEASE_PENDING/REFUND_PENDING/
                      REFUNDED) — those transactions were always unfilterable. */}
                  {['all', 'HELD', 'DISPUTED', 'RELEASE_PENDING', 'RELEASED', 'REFUND_PENDING', 'REFUNDED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        filterStatus === s
                          ? 'bg-sv-primary text-sv-text-inverse'
                          : 'bg-sv-surface-muted text-sv-text-muted hover:bg-sv-border'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-sv-border">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-sv-surface-muted text-[10px] font-black uppercase text-sv-text-muted">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sv-border">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-sv-surface-muted transition-colors">
                        <td className="px-4 py-3 font-bold text-sv-text-primary text-xs">#{tx.orderId.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-sv-text-secondary">{tx.vendor.name}</div>
                        </td>
                        <td className="px-4 py-3 font-black text-sv-text-primary text-sm">
                          ₦{tx.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {/* 🛡️ [BATCH-11] Expanded to the real 6-value canonical enum. */}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            tx.settlementState === 'RELEASED' ? 'bg-sv-success-soft text-sv-success' :
                            tx.settlementState === 'HELD' ? 'bg-sv-warning-soft text-sv-warning' :
                            tx.settlementState === 'RELEASE_PENDING' ? 'bg-sv-warning-soft text-sv-warning' :
                            tx.settlementState === 'REFUND_PENDING' ? 'bg-sky-50 text-sky-600' :
                            tx.settlementState === 'REFUNDED' ? 'bg-sv-tag-soft text-sv-tag' :
                            'bg-sv-danger-soft text-sv-danger'
                          }`}>
                            {tx.settlementState}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tx.settlementState === 'HELD' && (
                              <>
                                <button
                                  onClick={() => handleForceRelease(tx._id, tx.orderId)}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-sv-success-soft text-sv-success rounded hover:opacity-80"
                                >
                                  Release
                                </button>
                                <button
                                  onClick={() => handleHoldSettlement(tx._id, tx.orderId)}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-sv-warning-soft text-sv-warning rounded hover:opacity-80"
                                >
                                  Hold
                                </button>
                              </>
                            )}
                            {tx.settlementState === 'DISPUTED' && (
                              <button
                                onClick={() => handleForceRelease(tx._id, tx.orderId)}
                                className="px-2 py-1 text-[9px] font-black uppercase bg-sv-success-soft text-sv-success rounded hover:opacity-80"
                              >
                                Resolve {'->'} Release
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-xs">No transactions found matching filters</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {governanceStepUpModal}
    </div>
  );
}
