import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaStore, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { adminService } from '../api/admin.service';
import { logger } from '../utils/logger';
import PageLoader from '../components/PageLoader';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';

interface RefundCaseRow {
    _id: string;
    status: string;
    reasonCode: string;
    description: string;
    refundAmount: number;
    createdAt: string;
    // 🛡️ [VENDOR-CANCEL-REFUND-1]
    initiatedBy?: 'BUYER' | 'VENDOR' | 'SYSTEM';
    flaggedForAbuseReview?: boolean;
    flagReason?: string;
    vendorReasonCode?: 'OUT_OF_STOCK' | 'BUYER_REQUESTED' | 'UNSERVICEABLE_ADDRESS' | 'OTHER';
    vendor?: { name?: string; email?: string };
    order?: {
        _id: string;
        orderId?: string;
        status?: string;
        paymentInfo?: { method?: string };
        store?: { name?: string; slug?: string };
        cancellationReason?: string;
    };
}

// 🛡️ [VENDOR-CANCEL-REASON-ENUM-1] Same vocabulary the vendor dashboard's
// CancellationModal/DT reject dropdown send — vendorReasonCode is only ever
// set when initiatedBy === 'VENDOR'.
const VENDOR_REASON_LABELS: Record<string, string> = {
    OUT_OF_STOCK: 'Out of stock',
    BUYER_REQUESTED: 'Buyer requested cancellation',
    UNSERVICEABLE_ADDRESS: 'Unserviceable address',
    OTHER: 'Other'
};

/**
 * 🛡️ [CANCEL-TO-ADMIN-QUEUE-1] Before this, a buyer's free-cancellation
 * (order.controller.ts::cancelOrder) auto-approved and settled its own
 * RefundCase with no human ever seeing the cancellation reason — and even
 * if one had wanted to review it manually, refund.routes.ts was never
 * mounted on the backend at all, so there was no way to list or resolve a
 * case regardless. This is the first real queue: defaults to OPEN (cases
 * genuinely waiting on a decision), Approve starts the real settlement
 * chain toward a gateway refund, Reject leaves the order's escrow exactly
 * as it was before cancellation was attempted.
 */
export default function RefundCaseQueue() {
    const [cases, setCases] = useState<RefundCaseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('OPEN');
    const [total, setTotal] = useState(0);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [challenge, setChallenge] = useState<{ isOpen: boolean; caseId: string | null; resolution: 'APPROVED' | 'REJECTED' | null }>({
        isOpen: false, caseId: null, resolution: null
    });

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getRefundCases({ status, limit: 50 });
            setCases(res.data?.cases || []);
            setTotal(res.data?.total || 0);
        } catch (error) {
            logger.error('Failed to fetch refund case queue:', error);
            toast.error('Failed to load the refund case queue');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const requestResolve = (caseId: string, resolution: 'APPROVED' | 'REJECTED') => {
        setChallenge({ isOpen: true, caseId, resolution });
    };

    const handleChallengeSuccess = async (challengeToken: string) => {
        const { caseId, resolution } = challenge;
        if (!caseId || !resolution) return;
        setActioningId(caseId);
        try {
            await adminService.resolveRefundCase(caseId, resolution, notes[caseId] || '', challengeToken);
            toast.success(resolution === 'APPROVED' ? 'Refund approved — settlement started.' : 'Refund rejected.');
            await fetchCases();
        } catch (error) {
            logger.error('Failed to resolve refund case:', error);
            toast.error('Failed to resolve this refund case');
        } finally {
            setActioningId(null);
            setChallenge({ isOpen: false, caseId: null, resolution: null });
        }
    };

    if (loading && cases.length === 0) return <PageLoader />;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Refund Case Queue</h1>
                    <p className="text-sm text-sv-text-secondary mt-1 max-w-2xl">
                        Buyer-initiated cancellations and refund requests awaiting review. Approving starts the real gateway refund; nothing here settles automatically.
                    </p>
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3.5 sm:px-4 py-2 bg-sv-surface border border-sv-border text-sv-text-primary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary cursor-pointer shadow-xs"
                >
                    <option value="OPEN">Open (needs review)</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REFUND_FAILED">Refund Failed</option>
                </select>
            </div>

            <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-sv-surface-muted/60 border-b border-sv-border">
                            <tr>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Order</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Store / Vendor</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Reason</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Amount</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Waiting</th>
                                {status === 'OPEN' && (
                                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Decision</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sv-border">
                            {cases.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-sv-text-muted font-bold">
                                    Nothing in this state right now.
                                </td></tr>
                            ) : cases.map((c) => (
                                <tr key={c._id} className={`hover:bg-sv-surface-muted/40 transition-colors align-top ${c.flaggedForAbuseReview ? 'bg-sv-warning-soft/20' : ''}`}>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <p className="font-mono font-bold text-sv-text-primary text-xs">#{c.order?.orderId || c.order?._id?.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] text-sv-text-muted uppercase tracking-widest mt-1">{c.order?.paymentInfo?.method || 'nomba'}</p>
                                        <span className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${c.initiatedBy === 'VENDOR' ? 'bg-sv-warning-soft text-sv-warning' : 'bg-sv-primary-soft text-sv-primary'}`}>
                                            {c.initiatedBy === 'VENDOR' ? <FaStore size={8} /> : <FaUser size={8} />}
                                            {c.initiatedBy === 'VENDOR' ? 'Vendor-cancelled' : 'Buyer-initiated'}
                                        </span>
                                        {c.flaggedForAbuseReview && (
                                            <p className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-sv-warning">
                                                <FaExclamationTriangle size={9} /> {c.flagReason || 'Flagged for review'}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <p className="font-bold text-sv-text-primary text-xs">{c.order?.store?.name || 'Unknown store'}</p>
                                        <p className="text-[10px] text-sv-text-muted">{c.vendor?.name} · {c.vendor?.email}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-[260px]">
                                        <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
                                            {c.vendorReasonCode ? VENDOR_REASON_LABELS[c.vendorReasonCode] : c.reasonCode}
                                        </p>
                                        <p className="text-xs text-sv-text-secondary mt-0.5">{c.description}</p>
                                        {c.order?.cancellationReason && (
                                            <p className="text-[10px] text-sv-danger mt-1 italic font-medium leading-relaxed">
                                                Reason: "{c.order.cancellationReason}"
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <span className="font-black text-sv-text-primary text-xs">₦{(c.refundAmount / 100).toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <p className="text-[10px] font-bold text-sv-text-muted flex items-center gap-1.5">
                                            <FaClock size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    {status === 'OPEN' && (
                                        <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <input
                                                    value={notes[c._id] || ''}
                                                    onChange={(e) => setNotes((prev) => ({ ...prev, [c._id]: e.target.value }))}
                                                    placeholder="Resolution note (optional)"
                                                    className="w-48 px-3 py-1.5 bg-sv-surface-muted border border-sv-border text-sv-text-primary placeholder:text-sv-text-muted text-xs rounded-lg focus:outline-none focus:border-sv-primary"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => requestResolve(c._id, 'REJECTED')}
                                                        disabled={actioningId === c._id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-sv-danger-soft text-sv-danger disabled:opacity-40 hover:opacity-80 transition-all"
                                                    >
                                                        <FaTimesCircle size={11} /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => requestResolve(c._id, 'APPROVED')}
                                                        disabled={actioningId === c._id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-sv-success-soft text-sv-success disabled:opacity-40 hover:opacity-80 transition-all"
                                                    >
                                                        <FaCheckCircle size={11} /> Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-sv-border">
                    <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
                        Showing <span className="text-sv-text-primary font-bold">{cases.length}</span> of <span className="text-sv-text-primary font-bold">{total}</span>
                    </p>
                </div>
            </div>

            <AdminSecurityChallengeModal
                isOpen={challenge.isOpen}
                onClose={() => setChallenge({ isOpen: false, caseId: null, resolution: null })}
                action="RESOLVE_REFUND_CASE"
                onSuccess={handleChallengeSuccess}
            />
        </div>
    );
}
