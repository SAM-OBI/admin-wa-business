import { useState, useEffect, useCallback } from 'react';
import { FaExclamationTriangle, FaEnvelope, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';
import PageLoader from '../components/PageLoader';

interface DtQueueRow {
    orderMongoId: string;
    orderId: string;
    status: string;
    createdAt: string;
    amountPaidKobo: number;
    buyerEmail: string | null;
    buyerName: string;
    buyerAddress: { address?: string; city?: string; state?: string; country?: string } | null;
    buyerConfirmedReceipt: boolean;
    vendorAcceptedTransfer: boolean;
    vendorEmail: string;
    vendorName: string;
    storeName: string;
    suspensionReason?: string;
}

/**
 * 🛡️ [VENDOR-SUSPENSION-PENDING-ORDERS-1] Direct Transfer orders stuck
 * under a suspended vendor. Shopvia never held this money — it went
 * straight into the vendor's own bank account — so there is nothing here
 * to refund with a button. This is a manual-contact worklist: everything
 * an admin needs to email the buyer directly and tell them what's going on.
 */
export default function DirectTransferResolutionQueue() {
    const [queue, setQueue] = useState<DtQueueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/oversight/direct-transfers/resolution-queue?page=${page}&pageSize=20`);
            if (res.data.success) {
                setQueue(res.data.data.queue);
                setTotalPages(res.data.data.pagination?.totalPages || 1);
            }
        } catch (error) {
            logger.error('Failed to fetch DT resolution queue:', error);
            toast.error('Failed to load the Direct Transfer resolution queue');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    if (loading && queue.length === 0) return <PageLoader />;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display uppercase tracking-tight">Direct Transfer Resolution Queue</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Unfulfilled Direct Transfer orders under suspended vendors. Shopvia holds none of this money — contact the buyer directly to explain the situation.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Buyer</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Confirmations</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Suspended Vendor</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Placed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {queue.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400 font-bold">
                                    Nothing needs manual resolution right now.
                                </td></tr>
                            ) : queue.map((row) => (
                                <tr key={row.orderMongoId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors align-top">
                                    <td className="px-6 py-4">
                                        <p className="font-mono font-bold text-gray-900 dark:text-white text-xs">#{row.orderId}</p>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">{row.status}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{row.buyerName}</p>
                                        {row.buyerEmail ? (
                                            <a href={`mailto:${row.buyerEmail}`} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                                                <FaEnvelope size={9} /> {row.buyerEmail}
                                            </a>
                                        ) : (
                                            <p className="text-[9px] text-gray-400 mt-1">No email on file</p>
                                        )}
                                        {row.buyerAddress?.address && (
                                            <p className="text-[9px] text-gray-400 flex items-start gap-1 mt-1 max-w-[220px]">
                                                <FaMapMarkerAlt size={9} className="mt-0.5 shrink-0" />
                                                {[row.buyerAddress.address, row.buyerAddress.city, row.buyerAddress.state].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-gray-900 dark:text-white text-xs">₦{(row.amountPaidKobo / 100).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <p className="text-[10px] font-bold flex items-center gap-1.5">
                                            {row.vendorAcceptedTransfer ? <FaCheckCircle className="text-green-500" size={11} /> : <FaTimesCircle className="text-gray-300" size={11} />}
                                            Vendor accepted transfer
                                        </p>
                                        <p className="text-[10px] font-bold flex items-center gap-1.5">
                                            {row.buyerConfirmedReceipt ? <FaCheckCircle className="text-green-500" size={11} /> : <FaTimesCircle className="text-gray-300" size={11} />}
                                            Buyer confirmed receipt
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{row.vendorName}</p>
                                        <p className="text-[9px] text-gray-400">{row.storeName} · {row.vendorEmail}</p>
                                        {row.suspensionReason && (
                                            <p className="text-[9px] text-sv-danger flex items-start gap-1 mt-1 max-w-[220px]">
                                                <FaExclamationTriangle size={9} className="mt-0.5 shrink-0" /> {row.suspensionReason}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-[10px] font-bold text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30"
                        >
                            Previous
                        </button>
                        <span className="text-[10px] font-bold text-gray-400">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
