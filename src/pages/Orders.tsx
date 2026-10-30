import { useEffect, useState, useCallback } from 'react';
import { adminService, Order, OrderAuditTrail, OrderListItem } from '../api/admin.service';
import { FiShoppingBag } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import OrderDetailsModal from '../components/OrderDetailsModal';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';

export default function Orders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // 🛡️ [#8D] Fetched alongside order details, not blocking the modal's
  // initial render — a slower/failed aggregation shouldn't stop the
  // operator from seeing the core order they already asked for.
  const [auditTrail, setAuditTrail] = useState<OrderAuditTrail | null>(null);
  const [auditTrailLoading, setAuditTrailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: ''
  });

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getOrders({
        search: searchTerm,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        page,
        limit: pagination.limit
      });
      
      if (data.data?.orders) {
          setOrders(data.data.orders);
          setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
          setOrders(data.data);
      } else {
          setOrders([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setError(error.response?.data?.message || 'We couldn\'t load orders right now.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters.status, filters.paymentStatus, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchOrders(newPage);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    setAuditTrail(null);
    try {
      const response = await api.get(`/admin/orders/${orderId}/details`);
      if (response.data.data) {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      return;
    }

    setAuditTrailLoading(true);
    try {
      const auditResponse = await adminService.getOrderAuditTrail(orderId);
      setAuditTrail(auditResponse.data || null);
    } catch (error) {
      console.error('Failed to fetch order audit trail:', error);
    } finally {
      setAuditTrailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setAuditTrail(null);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight uppercase">Operational Ledger</h1>
          <p className="text-sv-text-muted font-medium mt-1 uppercase text-xs tracking-[0.2em]">Platform-Wide Transactional Infrastructure</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">Order Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH BY ID..."
            className="w-full sm:w-56"
            context="ADMIN"
          />
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface-muted/50">
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Counterparty</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Merchant Account</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Flow State</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {orders.map((order) => (
                <tr 
                  key={order._id} 
                  className="hover:bg-sv-surface-muted/60 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetails(order._id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sv-surface-muted rounded-lg text-sv-text-muted border border-sv-border group-hover:text-sv-text-primary transition-colors">
                        <FiShoppingBag size={14} />
                      </div>
                      <span className="font-black text-sv-text-primary text-sm tracking-tighter">
                        {order.orderId ? `#${order.orderId}` : `#${order._id.slice(-6).toUpperCase()}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-sv-text-primary text-sm tracking-tight">{order.user?.name || 'GUEST_ENTITY'}</div>
                    <div className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest mt-0.5">{order.user?.email || 'ANONYMOUS_SESSION'}</div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-[10px] text-sv-text-secondary font-black uppercase tracking-widest border border-sv-border bg-sv-surface-muted px-3 py-1.5 rounded-lg inline-block">
                        {order.store?.name || order.store?.storeName || 'NULL_ORIGIN'}
                     </div>
                  </td>
                  <td className="px-6 py-4 font-black text-sv-text-primary text-sm">
                    ₦{(order.totalAmount / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                      order.status === 'delivered' ? 'bg-sv-success-soft text-sv-success border-sv-success/30' : 
                      order.status === 'cancelled' ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30' : 
                      'bg-sv-warning-soft text-sv-warning border-sv-warning/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-tighter group-hover:text-sv-text-secondary transition-colors">
                        {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[9px] text-sv-text-muted/80 font-bold mt-1 tracking-widest">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
              
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <ErrorState message={error} onRetry={() => fetchOrders(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiShoppingBag className="text-sv-text-muted w-12 h-12" />
                      <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">No settlements found in operational ledger.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Global Pagination Hub */}
        <div className="px-6 py-4 border-t border-sv-border bg-sv-surface-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Ledger Index <span className="text-sv-text-primary mx-1">{orders.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Entries
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          auditTrail={auditTrail}
          auditTrailLoading={auditTrailLoading}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
