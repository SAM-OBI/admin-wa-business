import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
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
    vendor?: { name?: string; email?: string };
    order?: {
        _id: string;
        orderId?: string;
        status?: string;
        paymentInfo?: { method?: string };
        store?: { name?: string; slug?: string };
    };
}

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
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display uppercase tracking-tight">Refund Case Queue</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Buyer-initiated cancellations and refund requests awaiting review. Approving starts the real gateway refund; nothing here settles automatically.
                    </p>
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-primary cursor-pointer"
                >
                    <option value="OPEN">Open (needs review)</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REFUND_FAILED">Refund Failed</option>
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Store / Vendor</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Waiting</th>
                                {status === 'OPEN' && (
                                    <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Decision</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {cases.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400 font-bold">
                                    Nothing in this state right now.
                                </td></tr>
                            ) : cases.map((c) => (
                                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors align-top">
                                    <td className="px-6 py-4">
                                        <p className="font-mono font-bold text-gray-900 dark:text-white text-xs">#{c.order?.orderId || c.order?._id?.slice(-6).toUpperCase()}</p>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{c.order?.paymentInfo?.method || 'nomba'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{c.order?.store?.name || 'Unknown store'}</p>
                                        <p className="text-[9px] text-gray-400">{c.vendor?.name} · {c.vendor?.email}</p>
                                    </td>
                                    <td className="px-6 py-4 max-w-[260px]">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{c.reasonCode}</p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{c.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-gray-900 dark:text-white text-xs">₦{(c.refundAmount / 100).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
                                            <FaClock size={10} /> {new Date(c.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    {status === 'OPEN' && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <input
                                                    value={notes[c._id] || ''}
                                                    onChange={(e) => setNotes((prev) => ({ ...prev, [c._id]: e.target.value }))}
                                                    placeholder="Resolution note (optional)"
                                                    className="w-48 px-2.5 py-1.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs rounded-lg focus:outline-none focus:border-primary"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => requestResolve(c._id, 'REJECTED')}
                                                        disabled={actioningId === c._id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 disabled:opacity-40 hover:bg-red-100 transition-all"
                                                    >
                                                        <FaTimesCircle size={11} /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => requestResolve(c._id, 'APPROVED')}
                                                        disabled={actioningId === c._id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 disabled:opacity-40 hover:bg-green-100 transition-all"
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

                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Showing <span className="text-gray-700 dark:text-gray-200">{cases.length}</span> of <span className="text-gray-700 dark:text-gray-200">{total}</span>
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
