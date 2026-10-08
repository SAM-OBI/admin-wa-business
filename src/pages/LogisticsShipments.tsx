import { useEffect, useState, useCallback } from 'react';
import { FiTruck, FiAlertCircle, FiPackage } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * 🛡️ [LOGISTICS-SHIPMENT-SHELL-1] Read-only view of real DeliveryShipment
 * documents. An empty table here is the honest, expected state until a
 * real VENDOR_LED delivery order has been placed since this shipped — no
 * fabricated rows, no placeholder shipments.
 */

interface ShipmentRow {
  _id: string;
  orderId?: { orderId?: string; totalAmount?: number } | string;
  storeId?: { name?: string } | string;
  provider: string;
  status: string;
  quotedAmountKobo?: number;
  packageWeightKg?: number;
  trackingNumber?: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  CREATED: 'bg-sv-surface-muted text-sv-text-muted border-sv-border',
  AWAITING_PICKUP: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  IN_TRANSIT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DELIVERED: 'bg-sv-success-soft text-sv-success border-sv-success/30',
  EXCEPTION: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30',
  CANCELLED: 'bg-sv-danger-soft text-sv-danger border-sv-danger/30'
};

function LogisticsShipmentsInner() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [overview, setOverview] = useState<{ byStatus: Record<string, number>; byProvider: Record<string, number> } | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminService.getShipments({ status: status || undefined, limit: 50 });
      setShipments(res.data?.shipments || []);
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || 'Could not load shipments.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await adminService.getShipmentsOverview();
      setOverview(res.data || null);
    } catch {
      // Overview is a nice-to-have summary strip — a failure here must
      // never block the table itself from rendering.
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center text-center gap-3">
        <FiAlertCircle className="text-red-600 text-2xl" />
        <p className="text-xs text-red-700 font-bold uppercase tracking-tight">{loadError}</p>
        <button onClick={fetchShipments} className="text-xs font-black uppercase tracking-widest text-red-700 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Shipments</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">
            Real delivery records, one per delivery order
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl"
        >
          <option value="">All Statuses</option>
          {['CREATED', 'AWAITING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* 🛡️ Overview cards fetched/rendered independently of the table below
          — a failure here (caught above, silently) never blocks the table. */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Object.entries(overview.byStatus).map(([key, count]) => (
            <div key={key} className="bg-sv-surface-elevated/50 rounded-xl border border-sv-border p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-sv-text-muted">{key.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-black text-white mt-1">{count}</p>
            </div>
          ))}
          {Object.keys(overview.byStatus).length === 0 && (
            <div className="col-span-full bg-sv-surface-elevated/50 rounded-xl border border-sv-border p-4 flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
              <FiPackage /> No shipments yet
            </div>
          )}
        </div>
      )}

      <div className="bg-sv-surface-elevated/50 rounded-2xl border border-sv-border backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface/5">
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Order</th>
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Store</th>
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Provider</th>
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Weight</th>
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Fee</th>
                <th className="px-6 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {shipments.map((shipment) => {
                const order = typeof shipment.orderId === 'object' ? shipment.orderId : null;
                const store = typeof shipment.storeId === 'object' ? shipment.storeId : null;
                return (
                  <tr key={shipment._id} className="hover:bg-sv-surface-muted transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sv-surface-muted rounded-lg text-sv-text-muted border border-sv-border">
                          <FiTruck size={14} />
                        </div>
                        <span className="font-black text-sv-text-primary text-sm tracking-tighter">
                          {order?.orderId ? `#${order.orderId}` : `#${shipment._id.slice(-6).toUpperCase()}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-sv-text-muted">{store?.name || '—'}</td>
                    <td className="px-6 py-5 text-xs font-bold text-sv-text-muted">{shipment.provider}</td>
                    <td className="px-6 py-5 text-xs text-sv-text-muted">{shipment.packageWeightKg ? `${shipment.packageWeightKg}kg` : '—'}</td>
                    <td className="px-6 py-5 text-xs font-black text-sv-text-primary">{shipment.quotedAmountKobo ? `₦${(shipment.quotedAmountKobo / 100).toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_STYLE[shipment.status] || STATUS_STYLE.CREATED}`}>
                        {shipment.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {shipments.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-zinc-500 uppercase tracking-widest">No shipments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsShipments() {
  return (
    <ErrorBoundary name="Shipments">
      <LogisticsShipmentsInner />
    </ErrorBoundary>
  );
}
