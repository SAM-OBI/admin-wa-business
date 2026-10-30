import { FiX, FiPackage, FiCalendar, FiDollarSign, FiMapPin, FiUser, FiTruck, FiAlertCircle } from 'react-icons/fi';
import { Order, OrderAuditTrail } from '../api/admin.service';
import OrderLifecycleTimeline from './OrderLifecycleTimeline';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  // 🛡️ [#8D] Optional — the modal renders correctly with these absent
  // (e.g. while the aggregation is still loading, or if it failed), never
  // blocking on them.
  auditTrail?: OrderAuditTrail | null;
  auditTrailLoading?: boolean;
}

export default function OrderDetailsModal({ order, onClose, auditTrail, auditTrailLoading }: OrderDetailsModalProps) {
  const isDirectTransfer = order.paymentInfo?.method === 'transfer';
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-sv-success-soft text-sv-success border border-sv-success/30';
      case 'cancelled': return 'bg-sv-danger-soft text-sv-danger border border-sv-danger/30';
      case 'shipped': return 'bg-sv-info-soft text-sv-info border border-sv-info/30';
      default: return 'bg-sv-warning-soft text-sv-warning border border-sv-warning/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-sv-surface border border-sv-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-sv-surface/95 backdrop-blur-md border-b border-sv-border px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-sv-text-primary tracking-tight">Order Details</h2>
            <p className="text-xs sm:text-sm text-sv-text-secondary mt-0.5">Order #{order._id.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sv-surface-muted rounded-xl transition text-sv-text-secondary hover:text-sv-text-primary"
            aria-label="Close modal"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Status and Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
              <p className="text-xs sm:text-sm text-sv-text-secondary font-medium mb-2">Order Status</p>
              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
              <p className="text-xs sm:text-sm text-sv-text-secondary font-medium mb-2">Payment Status</p>
              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                order.paymentInfo?.status === 'paid' 
                  ? 'bg-sv-success-soft text-sv-success border border-sv-success/30' 
                  : 'bg-sv-warning-soft text-sv-warning border border-sv-warning/30'
              }`}>
                {order.paymentInfo?.status || 'Pending'}
              </span>
            </div>
            {/* 🛡️ [#8D] Payment method was never displayed anywhere in this
                modal before, despite being on the type already. */}
            <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
              <p className="text-xs sm:text-sm text-sv-text-secondary font-medium mb-2">Payment Method</p>
              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                isDirectTransfer 
                  ? 'bg-sv-tag-soft text-sv-tag border border-sv-tag/30' 
                  : 'bg-sv-info-soft text-sv-info border border-sv-info/30'
              }`}>
                {isDirectTransfer ? 'Direct Transfer' : (order.paymentInfo?.method || 'Unknown')}
              </span>
            </div>
          </div>

          {/* 🛡️ [#8D] Direct Transfer investigation panel — Shopvia never
              holds this money; these are purely status/timestamp signals
              for an operator investigating a DT order, not financial data. */}
          {isDirectTransfer && (
            <div className="bg-sv-tag-soft/40 border border-sv-tag/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiTruck className="text-sv-tag text-lg" />
                <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Direct Transfer Status</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-sv-text-secondary text-xs">Free-cancellation deadline</p>
                  <p className="text-sv-text-primary font-bold text-xs sm:text-sm">{order.freeCancellationDeadline ? new Date(order.freeCancellationDeadline).toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sv-text-secondary text-xs">Vendor funds acknowledgement</p>
                  <p className="text-sv-text-primary font-bold text-xs sm:text-sm">
                    {order.directTransferFundsReceivedAt
                      ? `Acknowledged ${new Date(order.directTransferFundsReceivedAt).toLocaleString()}`
                      : 'Not yet acknowledged'}
                  </p>
                </div>
                {order.paymentInfo?.buyerReportedAmountKobo != null && (
                  <div>
                    <p className="text-sv-text-secondary text-xs">Buyer-reported amount paid</p>
                    <p className="text-sv-text-primary font-bold text-xs sm:text-sm">₦{(order.paymentInfo.buyerReportedAmountKobo / 100).toLocaleString()} <span className="text-xs text-sv-text-muted font-normal">(unverified, informational only)</span></p>
                  </div>
                )}
                {order.cancellationReason && (
                  <div>
                    <p className="text-sv-text-secondary text-xs">Cancellation reason</p>
                    <p className="text-sv-text-primary font-bold text-xs sm:text-sm">{order.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!isDirectTransfer && order.vendorFirstActionAt && (
            <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4 text-sm">
              <p className="text-sv-text-secondary text-xs">Vendor first action</p>
              <p className="text-sv-text-primary font-bold text-xs sm:text-sm">{new Date(order.vendorFirstActionAt).toLocaleString()}</p>
            </div>
          )}

          {/* 🛡️ [#8D] Linked complaints/reports for this order — previously
              invisible from this modal entirely. */}
          {auditTrailLoading && (
            <div className="text-sm text-sv-text-muted">Loading complaint/refund history…</div>
          )}
          {auditTrail && auditTrail.complaints.length > 0 && (
            <div className="bg-sv-warning-soft/40 border border-sv-warning/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiAlertCircle className="text-sv-warning text-lg" />
                <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Linked Complaints ({auditTrail.complaints.length})</h3>
              </div>
              <div className="space-y-2">
                {auditTrail.complaints.map((c) => (
                  <div key={c._id} className="text-sm bg-sv-surface rounded-xl p-3 border border-sv-border/60">
                    <p className="font-bold text-sv-text-primary">{c.title} <span className="text-xs text-sv-text-muted font-normal">({(c.type || 'other').replace(/_/g, ' ')})</span></p>
                    <p className="text-sv-text-secondary mt-1">{c.description}</p>
                    <p className="text-xs text-sv-text-muted mt-1">Status: {c.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {auditTrail && auditTrail.refundCase && (
            <div className="bg-sv-success-soft/40 border border-sv-success/30 rounded-xl p-4 text-sm">
              <h3 className="font-bold text-sv-text-primary mb-2 text-sm sm:text-base">Refund Case</h3>
              <p className="text-sv-text-secondary font-medium">Status: {auditTrail.refundCase.status} · Amount: ₦{(auditTrail.refundCase.refundAmount / 100).toLocaleString()}</p>
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiUser className="text-sv-text-secondary" />
              <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Customer Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-sv-text-secondary"><span className="font-bold text-sv-text-primary">Name:</span> {order.user.name}</p>
              <p className="text-sv-text-secondary"><span className="font-bold text-sv-text-primary">Email:</span> {order.user.email}</p>
              <p className="text-sv-text-secondary"><span className="font-bold text-sv-text-primary">Phone:</span> {order.user.phone}</p>
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
            <h3 className="font-bold text-sv-text-primary mb-2 text-sm sm:text-base">Store</h3>
            <p className="text-sv-text-secondary text-sm">{'name' in order.store ? order.store.name : order.store.storeName}</p>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiMapPin className="text-sv-text-secondary" />
                <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Shipping Address</h3>
              </div>
              <p className="text-sv-text-secondary text-sm">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} 
                {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
              </p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FiPackage className="text-sv-text-secondary" />
              <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-sv-surface border border-sv-border rounded-xl p-3 sm:p-4">
                  {item.product.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg border border-sv-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sv-text-primary text-sm sm:text-base truncate">{item.product.name}</p>
                    <p className="text-xs sm:text-sm text-sv-text-secondary">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-black text-sv-text-primary text-sm sm:text-base sm:text-right">₦{((item.priceSnapshot.unitPriceKobo * item.quantity) / 100).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-sv-surface-muted border border-sv-border/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiDollarSign className="text-sv-text-secondary" />
              <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Order Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sv-text-secondary text-sm">
                <span>Subtotal</span>
                <span>₦{(order.totalAmount / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sv-text-primary text-base sm:text-lg pt-2 border-t border-sv-border">
                <span>Total</span>
                <span>₦{(order.totalAmount / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 🛡️ [DISPUTE-COUNTDOWN-GAP-5] Structured lifecycle view — see
              OrderLifecycleTimeline.tsx. Sits above the raw chronological
              event log below, which stays for full audit detail. */}
          <OrderLifecycleTimeline order={order} />

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiCalendar className="text-sv-text-secondary" />
                <h3 className="font-bold text-sv-text-primary text-sm sm:text-base">Order Timeline</h3>
              </div>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-sv-info rounded-full mt-2 shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-bold text-sv-text-primary text-xs sm:text-sm">{event.description}</p>
                      <p className="text-xs text-sv-text-muted">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Date */}
          <div className="text-xs sm:text-sm text-sv-text-muted pt-4 border-t border-sv-border">
            Order placed on {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-sv-surface/95 backdrop-blur-md border-t border-sv-border px-4 sm:px-6 py-4 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-sv-surface-muted hover:bg-sv-border/40 text-sv-text-primary border border-sv-border rounded-xl transition font-bold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

