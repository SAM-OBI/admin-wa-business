import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { FiLock, FiCheckCircle, FiSlash, FiTrendingUp } from 'react-icons/fi';
import Swal from 'sweetalert2';

interface EscrowDashboard {
  totalLocked: number;
  totalReleased: number;
  totalDisputed: number;
  pendingRelease: number;
  byStatus: Array<{ _id: string; count: number; amount: number }>;
}

interface VendorEscrow {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalLocked: number;
  totalReleased: number;
  orderCount: number;
  stores: Array<{ _id: string; name: string }>;
}

interface EscrowTransaction {
  _id: string;
  orderId: string;
  escrow: {
    amount: number;
    status: string;
    heldAt?: Date;
    releasedAt?: Date;
  };
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
}

export default function EscrowManagement() {
  const [dashboard, setDashboard] = useState<EscrowDashboard | null>(null);
  const [vendors, setVendors] = useState<VendorEscrow[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'transactions'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/admin/escrow/dashboard');
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
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await api.get('/admin/escrow/by-vendor', { params });
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
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await api.get('/admin/escrow/transactions', { params });
      if (res.data.success) {
        setTransactions(res.data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDashboard();
    fetchVendors();
    fetchTransactions();
  }, [fetchDashboard, fetchVendors, fetchTransactions]);

  const handleForceRelease = async (orderId: string, orderIdDisplay: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Force Release Escrow',
      html: `
        <p class="mb-4">Order: <strong>${orderIdDisplay}</strong></p>
        <textarea id="reason" class="swal2-textarea w-full" placeholder="Reason for manual release..." rows="4" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Release Escrow',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason');
          return false;
        }
        return reason;
      }
    });

    if (reason) {
      try {
        const res = await api.post(`/admin/escrow/${orderId}/release`, { reason });
        
        if (res.data.success) {
          Swal.fire('Released!', `Escrow released: ₦${res.data.data.amountReleased.toLocaleString()}`, 'success');
          fetchDashboard();
          fetchVendors();
          fetchTransactions();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to release escrow', 'error');
      }
    }
  };

  const handleHoldEscrow = async (orderId: string, orderIdDisplay: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Hold Escrow',
      html: `
        <p class="mb-4">Order: <strong>${orderIdDisplay}</strong></p>
        <p class="text-sm text-orange-600 mb-4">This will prevent automatic escrow release</p>
        <textarea id="reason" class="swal2-textarea w-full" placeholder="Reason for hold..." rows="4" required></textarea>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Hold Escrow',
      preConfirm: () => {
        const reason = (document.getElementById('reason') as HTMLTextAreaElement)?.value;
        if (!reason) {
          Swal.showValidationMessage('Please provide a reason');
          return false;
        }
        return reason;
      }
    });

    if (reason) {
      try {
        const res = await api.post(`/admin/escrow/${orderId}/hold`, { reason });
        
        if (res.data.success) {
          Swal.fire('Hold Applied!', 'Escrow will not auto-release', 'success');
          fetchTransactions();
        }
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to hold escrow', 'error');
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiLock className="text-blue-600" />
          Escrow Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide escrow oversight and fund management</p>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Locked</div>
              <FiLock className="text-orange-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{dashboard.totalLocked.toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {dashboard.pendingRelease} pending release
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Released</div>
              <FiCheckCircle className="text-green-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{dashboard.totalReleased.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Disputed</div>
              <FiSlash className="text-red-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{dashboard.totalDisputed.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Managed</div>
              <FiTrendingUp className="text-blue-500" size={18} />
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₦{(dashboard.totalLocked + dashboard.totalReleased).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                  Escrow by Vendor
                </h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Locked</th>
                      <th className="px-4 py-3">Released</th>
                      <th className="px-4 py-3">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vendors.map((vendor) => (
                      <tr key={vendor.vendorId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-bold text-gray-800">{vendor.vendorName}</div>
                            <div className="text-[10px] text-gray-400">{vendor.vendorEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-black text-orange-600 text-sm">
                          ₦{vendor.totalLocked.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-black text-green-600 text-sm">
                          ₦{vendor.totalReleased.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-600">
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
                  Escrow Transactions
                </h3>
                <div className="flex gap-2">
                  {['all', 'pending', 'held', 'released'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        filterStatus === s
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800 text-xs">#{tx.orderId.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-700">{tx.vendor.name}</div>
                        </td>
                        <td className="px-4 py-3 font-black text-gray-900 text-sm">
                          ₦{tx.escrow.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            tx.escrow.status === 'released' ? 'bg-green-50 text-green-600' :
                            tx.escrow.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {tx.escrow.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tx.escrow.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleForceRelease(tx._id, tx.orderId)}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-green-50 text-green-600 rounded hover:bg-green-100"
                                >
                                  Release
                                </button>
                                <button
                                  onClick={() => handleHoldEscrow(tx._id, tx.orderId)}
                                  className="px-2 py-1 text-[9px] font-black uppercase bg-orange-50 text-orange-600 rounded hover:bg-orange-100"
                                >
                                  Hold
                                </button>
                              </>
                            )}
                            {tx.escrow.status === 'held' && (
                              <button
                                onClick={() => handleForceRelease(tx._id, tx.orderId)}
                                className="px-2 py-1 text-[9px] font-black uppercase bg-green-50 text-green-600 rounded hover:bg-green-100"
                              >
                                Release
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
    </div>
  );
}
