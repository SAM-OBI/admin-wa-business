import { useEffect, useState, useCallback } from 'react';
import { adminService, Order, OrderListItem } from '../api/admin.service';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import OrderDetailsModal from '../components/OrderDetailsModal';
import api from '../api/axios';

export default function Orders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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
    try {
      const response = await api.get(`/admin/orders/${orderId}/details`);
      if (response.data.data) {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Operational Ledger</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Platform-Wide Transactional Infrastructure</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
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
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
            >
              <option value="">Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="SEARCH BY ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-2 bg-zinc-900/50 border border-zinc-800/40 text-white text-xs font-bold placeholder:text-zinc-700 rounded-xl focus:outline-none focus:border-white/20 w-full sm:w-56 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Counterparty</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Merchant Account</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Volume</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Flow State</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {orders.map((order) => (
                <tr 
                  key={order._id} 
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  onClick={() => handleViewDetails(order._id)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-zinc-800 rounded-lg text-zinc-500 border border-white/5 group-hover:text-white transition-colors shadow-inner">
                        <FiShoppingBag size={14} />
                      </div>
                      <span className="font-black text-white text-sm tracking-tighter">
                        {order.orderId ? `#${order.orderId}` : `#${order._id.slice(-6).toUpperCase()}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-white text-sm tracking-tight">{order.user?.name || 'GUEST_ENTITY'}</div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{order.user?.email || 'ANONYMOUS_SESSION'}</div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest border border-white/5 bg-white/[0.02] px-3 py-1.5 rounded-lg inline-block">
                        {order.store?.name || order.store?.storeName || 'NULL_ORIGIN'}
                     </div>
                  </td>
                  <td className="px-8 py-6 font-black text-white text-sm">
                    ₦{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                     <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                      order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter group-hover:text-zinc-300 transition-colors">
                        {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-bold mt-1 tracking-widest">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
              
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiShoppingBag className="text-zinc-800 w-12 h-12" />
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No settlements found in operational ledger.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Global Pagination Hub */}
        <div className="px-8 py-6 border-t border-zinc-800/60 bg-white/[0.01] flex items-center justify-between">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Ledger Index <span className="text-white mx-1">{orders.length}</span> of <span className="text-white mx-1">{pagination.total}</span> Entries
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-md border border-white/5">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
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
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
