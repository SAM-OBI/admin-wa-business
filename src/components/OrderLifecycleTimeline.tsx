import { useEffect, useState } from 'react';
import { FiCreditCard, FiShield, FiTruck, FiSearch, FiCheckCircle, FiSlash, FiAlertTriangle } from 'react-icons/fi';
import { Order } from '../types';

type StageStatus = 'done' | 'current' | 'pending' | 'frozen' | 'skipped';

interface Stage {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: StageStatus;
  detail: string;
  timestamp?: string;
  countdownTo?: string;
}

const STATUS_STYLE: Record<StageStatus, { dot: string; line: string; text: string }> = {
  done: { dot: 'bg-emerald-500 border-emerald-500', line: 'bg-emerald-500/40', text: 'text-emerald-400' },
  current: { dot: 'bg-amber-500 border-amber-500 animate-pulse', line: 'bg-zinc-700', text: 'text-amber-400' },
  pending: { dot: 'bg-zinc-800 border-zinc-700', line: 'bg-zinc-800', text: 'text-zinc-500' },
  frozen: { dot: 'bg-red-500 border-red-500', line: 'bg-red-500/40', text: 'text-red-400' },
  skipped: { dot: 'bg-zinc-800 border-zinc-700', line: 'bg-zinc-800', text: 'text-zinc-600' }
};

/**
 * Live "time remaining" ticker, self-contained (admin-dashboard is a
 * separate app from the vendor/buyer frontend — it has no access to that
 * app's useCountdown hook/DisputeCountdown/SettlementReleaseCountdown
 * components, so this reimplements the same skew-compensation idea against
 * order.serverTime at the minimal scope this one visualization needs).
 */
function useLiveCountdown(deadline?: string, serverTime?: string) {
  // 🛡️ Lazy initializers are React's documented exception to the
  // render-purity rule (they run once, at mount) — skewMs doesn't need to
  // be recomputed every render anyway, since serverTime is fixed per mount.
  const [skewMs] = useState(() => serverTime ? Date.now() - new Date(serverTime).getTime() : 0);
  const [now, setNow] = useState(() => Date.now() - skewMs);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now() - skewMs), 60_000);
    return () => clearInterval(id);
  }, [deadline, skewMs]);

  if (!deadline) return null;
  const diffMs = new Date(deadline).getTime() - now;
  if (diffMs <= 0) return 'expired';

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
  if (hours >= 1) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function StageCountdown({ deadline, serverTime }: { deadline?: string; serverTime?: string }) {
  const remaining = useLiveCountdown(deadline, serverTime);
  if (!remaining) return null;
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-1">
      ⏱ {remaining === 'expired' ? 'Window closed' : remaining}
    </p>
  );
}

/**
 * 🛡️ [DISPUTE-COUNTDOWN-GAP-5] Structured payment → protection → delivery
 * → inspection → release visualization — previously there was no view of
 * an order's Buyer Protection lifecycle on the admin dashboard at all, only
 * a generic chronological event log (order.timeline, still shown separately
 * below this). Every field this reads (escrowState, settlementState,
 * disputeDeadline, settlementReleaseAt, deliveredAt, dates.receivedAt) is
 * backend-authoritative and already present on the order document — this
 * is a read-only derivation, same discipline as order.serializer.ts's
 * deriveOrderFinancialStatus, just re-expressed as discrete stages instead
 * of one collapsed status code.
 */
export default function OrderLifecycleTimeline({ order }: { order: Order }) {
  const isDT = order.paymentInfo?.method === 'transfer';
  const isDisputed = order.escrowState === 'DISPUTED' || order.settlementState === 'DISPUTED';
  const isReleased = order.escrowState === 'RELEASED' || order.settlementState === 'RELEASED' || order.status === 'received' || order.status === 'completed';
  const isRefunded = order.settlementState === 'REFUNDED' || order.escrowState === 'REFUNDED' || order.status === 'refunded';
  const deliveredAt = order.deliveredAt || order.dates?.deliveredAt;
  const receivedAt = order.dates?.receivedAt;
  const isDelivered = Boolean(deliveredAt) || ['delivered', 'received', 'completed'].includes(order.status);
  const isCancelled = order.status === 'cancelled';
  const isPaid = order.paymentInfo?.status === 'paid' || order.paymentInfo?.status === 'received';
  const disputeDeadlinePassed = order.disputeDeadline ? new Date(order.disputeDeadline) <= new Date() : false;

  const stages: Stage[] = [];

  // 1. Payment
  stages.push({
    key: 'payment',
    label: 'Payment',
    icon: <FiCreditCard size={14} />,
    status: isCancelled && !isPaid ? 'frozen' : (isPaid || isDT) ? 'done' : 'pending',
    detail: isDT ? 'Buyer-attested direct transfer to vendor' : isPaid ? 'Captured via gateway' : (isCancelled ? 'Never completed — order cancelled' : 'Awaiting payment'),
    timestamp: (isPaid || isDT) ? order.createdAt : undefined
  });

  // 2. Protection (escrow lock)
  if (isDT) {
    stages.push({ key: 'protection', label: 'Protection', icon: <FiShield size={14} />, status: 'skipped', detail: 'Direct Transfer — not Shopvia-escrowed, see Report an Issue instead' });
  } else {
    stages.push({
      key: 'protection',
      label: 'Protection',
      icon: <FiShield size={14} />,
      status: isCancelled && !isPaid ? 'pending' : (isPaid ? 'done' : 'pending'),
      detail: isPaid ? 'Funds held in Safe Settlement escrow' : 'Locks once payment is captured',
      timestamp: isPaid ? order.createdAt : undefined
    });
  }

  // 3. Delivery
  stages.push({
    key: 'delivery',
    label: 'Delivery',
    icon: <FiTruck size={14} />,
    status: isCancelled && !isDelivered ? 'frozen' : isDelivered ? 'done' : (isPaid || isDT) ? 'current' : 'pending',
    detail: isDelivered ? 'Marked delivered' : isCancelled ? 'Order cancelled before delivery' : 'In fulfillment',
    timestamp: deliveredAt
  });

  // 4. Inspection window
  if (isDT) {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'skipped', detail: 'Direct Transfer — no formal Buyer Protection inspection window' });
  } else if (isDisputed) {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'frozen', detail: 'Dispute open — funds frozen pending resolution' });
  } else if (receivedAt) {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'done', detail: 'Buyer confirmed receipt', timestamp: receivedAt });
  } else if (!isDelivered) {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'pending', detail: 'Opens on delivery' });
  } else if (order.disputeDeadline && !disputeDeadlinePassed) {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'current', detail: 'Buyer may confirm or dispute', countdownTo: order.disputeDeadline });
  } else {
    stages.push({ key: 'inspection', label: 'Inspection', icon: <FiSearch size={14} />, status: 'done', detail: 'Window closed, no dispute raised' });
  }

  // 5. Release
  if (isDT) {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'skipped', detail: 'Direct Transfer — vendor collects directly, no Shopvia payout' });
  } else if (isRefunded) {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'frozen', detail: 'Refunded to buyer — no vendor payout' });
  } else if (isReleased) {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'done', detail: 'Released to vendor' });
  } else if (isDisputed) {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'frozen', detail: 'Held pending dispute resolution' });
  } else if (order.settlementReleaseAt) {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'current', detail: 'Scheduled auto-release', countdownTo: order.settlementReleaseAt });
  } else {
    stages.push({ key: 'release', label: 'Release', icon: <FiCheckCircle size={14} />, status: 'pending', detail: 'Pending delivery + inspection' });
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Buyer Protection Lifecycle</h3>
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-0">
        {stages.map((stage, i) => {
          const style = STATUS_STYLE[stage.status];
          return (
            <div key={stage.key} className="flex md:flex-col md:flex-1 items-start gap-3 md:gap-0">
              <div className="flex md:flex-col items-center md:w-full">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white shrink-0 ${style.dot}`}>
                  {stage.status === 'frozen' ? <FiAlertTriangle size={14} /> : stage.status === 'skipped' ? <FiSlash size={14} /> : stage.icon}
                </div>
                {i < stages.length - 1 && (
                  <div className={`hidden md:block h-0.5 flex-1 w-full mt-4 ${style.line}`} />
                )}
              </div>
              <div className="md:mt-2 md:text-center md:px-2">
                <p className={`text-xs font-bold uppercase tracking-widest ${style.text}`}>{stage.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{stage.detail}</p>
                {stage.timestamp && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(stage.timestamp).toLocaleString()}</p>
                )}
                {stage.countdownTo && (
                  <StageCountdown deadline={stage.countdownTo} serverTime={order.serverTime} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
