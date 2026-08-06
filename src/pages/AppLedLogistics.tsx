import { useEffect, useState, useCallback } from 'react';
import { FiTruck, FiSave } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';

interface AppLedOrder {
  _id: string;
  orderId?: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  totalAmount: number;
  deliveryFee?: number;
  createdAt: string;
  user?: { name?: string; email?: string; phone?: string };
  guestInfo?: { name?: string; email?: string };
  store?: { name?: string; storeName?: string };
}

const DELIVERY_STATUSES = ['processing', 'enroute', 'shipped', 'delivered', 'received', 'cancelled', 'returned'];

const STATUS_STYLE: Record<string, string> = {
  delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  received: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  returned: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function AppLedLogistics() {
  const [orders, setOrders] = useState<AppLedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { carrier: string; trackingNumber: string; status: string }>>({});
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAppLedOrders({ search: searchTerm, status, limit: 50 });
      const list: AppLedOrder[] = data.data?.orders || [];
      setOrders(list);
      setPagination({ total: data.data?.pagination?.total || list.length, hasMore: !!data.data?.pagination?.hasMore });
      setDrafts(Object.fromEntries(list.map(o => [o._id, {
        carrier: o.carrier || '',
        trackingNumber: o.trackingNumber || '',
        status: o.status
      }])));
    } catch (error) {
      console.error('Failed to fetch App-Led orders:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, status]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 400);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleSave = async (orderId: string) => {
    const draft = drafts[orderId];
    if (!draft) return;
    setSavingId(orderId);
    try {
      await adminService.updateAppLedDelivery(orderId, draft);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update App-Led delivery:', error);
    } finally {
      setSavingId(null);
    }
  };

  const updateDraft = (orderId: string, patch: Partial<{ carrier: string; trackingNumber: string; status: string }>) => {
    setDrafts(prev => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }));
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
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">App-Led Logistics</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">
            Orders where Shopvia owns delivery — liability, tracking &amp; fee retention
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
          >
            <option value="">Delivery Status</option>
            {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH ORDER / TRACKING..."
            className="w-full sm:w-64"
            context="ADMIN"
          />
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-white/[0.02]">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Order</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Store / Buyer</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Volume</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Carrier</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tracking #</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {orders.map((order) => {
                const draft = drafts[order._id] || { carrier: '', trackingNumber: '', status: order.status };
                const dirty = draft.carrier !== (order.carrier || '') || draft.trackingNumber !== (order.trackingNumber || '') || draft.status !== order.status;
                return (
                  <tr key={order._id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-800 rounded-lg text-zinc-500 border border-white/5 group-hover:text-white transition-colors shadow-inner">
                          <FiTruck size={14} />
                        </div>
                        <span className="font-black text-white text-sm tracking-tighter">
                          {order.orderId ? `#${order.orderId}` : `#${order._id.slice(-6).toUpperCase()}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest border border-white/5 bg-white/[0.02] px-2.5 py-1 rounded-lg inline-block mb-1">
                        {order.store?.name || order.store?.storeName || 'NULL_ORIGIN'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-bold">{order.user?.name || order.guestInfo?.name || 'Guest'}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-white text-sm">₦{(order.totalAmount / 100).toLocaleString()}</td>
                    <td className="px-6 py-5">
                      <select
                        value={draft.status}
                        onChange={(e) => updateDraft(order._id, { status: e.target.value })}
                        className={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border bg-transparent cursor-pointer focus:outline-none ${STATUS_STYLE[draft.status] || 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                      >
                        {DELIVERY_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <input
                        value={draft.carrier}
                        onChange={(e) => updateDraft(order._id, { carrier: e.target.value })}
                        placeholder="Carrier"
                        className="w-28 px-2.5 py-1.5 bg-zinc-800/60 border border-zinc-700/50 text-xs text-white rounded-lg focus:outline-none focus:border-white/20"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <input
                        value={draft.trackingNumber}
                        onChange={(e) => updateDraft(order._id, { trackingNumber: e.target.value })}
                        placeholder="Tracking #"
                        className="w-32 px-2.5 py-1.5 bg-zinc-800/60 border border-zinc-700/50 text-xs text-white rounded-lg focus:outline-none focus:border-white/20"
                      />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleSave(order._id)}
                        disabled={!dirty || savingId === order._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/[0.05] border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.1] transition-all"
                      >
                        <FiSave size={11} /> {savingId === order._id ? 'Saving' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiTruck className="text-zinc-800 w-12 h-12" />
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No App-Led orders found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 border-t border-zinc-800/60 bg-white/[0.01] flex items-center justify-between">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Showing <span className="text-white mx-1">{orders.length}</span> of <span className="text-white mx-1">{pagination.total}</span> App-Led orders
          </div>
        </div>
      </div>
    </div>
  );
}
