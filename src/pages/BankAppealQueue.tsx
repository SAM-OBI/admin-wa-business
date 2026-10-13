import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFileAlt } from 'react-icons/fa';
import { adminService } from '../api/admin.service';
import { toast } from 'react-hot-toast';
import { logger } from '../utils/logger';
import PageLoader from '../components/PageLoader';

interface AppealRow {
    userId: string;
    accountId: string;
    userName: string;
    email: string;
    bankAccountName: string;
    bankName: string;
    nameSimilarity: number;
    bankTier: number;
    appealReason: string | null;
    appealDocumentUrls: string[];
    submittedAt: string;
    ageMinutes: number;
}

/**
 * 🛡️ [BANK-APPEAL-RESOLUTION-1] A vendor's bank account can land here when
 * its NUBAN-resolved name doesn't closely match their registered name
 * (evaluateBankNameMatch) — this is their one path to ever becoming
 * verified again. securityMonitoring.controller.ts's getReviewQueue /
 * resolveBankAccountAppeal existed but had no mounted route and no UI at
 * all before this; an appeal submitted here used to sit pending forever.
 */
export default function BankAppealQueue() {
    const [queue, setQueue] = useState<AppealRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getBankAppealQueue();
            if (res.success) {
                setQueue(res.data.queue);
            }
        } catch (error) {
            logger.error('Failed to fetch bank appeal queue:', error);
            toast.error('Failed to load the bank appeal queue');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const handleResolve = async (row: AppealRow, decision: 'approve' | 'reject') => {
        const defaultReason = decision === 'approve'
            ? 'Supporting documents/reason reviewed and confirmed to belong to this vendor.'
            : '';
        const reason = prompt(
            `${decision === 'approve' ? 'Approve' : 'Reject'} this appeal for ${row.userName} (${row.bankAccountName})?\n\nEnter a review note (min 5 characters) — this is sent to the vendor:`,
            defaultReason
        );
        if (!reason || reason.trim().length < 5) {
            if (reason !== null) toast.error('A review note of at least 5 characters is required.');
            return;
        }
        setActioningId(row.accountId);
        try {
            await adminService.resolveBankAppeal(row.userId, row.accountId, decision, reason.trim());
            toast.success(`Appeal ${decision === 'approve' ? 'approved' : 'rejected'}.`);
            setQueue((prev) => prev.filter((r) => r.accountId !== row.accountId));
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${decision} appeal`);
            logger.error(`Failed to ${decision} bank appeal:`, error);
        } finally {
            setActioningId(null);
        }
    };

    if (loading && queue.length === 0) return <PageLoader />;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display uppercase tracking-tight">Bank Appeal Queue</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Vendor bank accounts flagged by the name-match engine for a low similarity score. Review the vendor's explanation and any attached documents, then approve to verify the account for payouts or reject with a reason.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Bank Account</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Match Score</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Vendor's Reason</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Submitted</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {queue.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400 font-bold">
                                    No bank-account appeals pending review.
                                </td></tr>
                            ) : queue.map((row) => (
                                <tr key={row.accountId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors align-top">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{row.userName}</p>
                                        <p className="text-[10px] text-gray-400">{row.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white text-xs">{row.bankAccountName}</p>
                                        <p className="text-[10px] text-gray-400">{row.bankName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-black text-xs ${row.nameSimilarity >= 0.4 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {Math.round((row.nameSimilarity || 0) * 100)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-[280px]">
                                        {row.appealReason ? (
                                            <>
                                                <p className="text-[11px] text-gray-600 dark:text-gray-300 italic">"{row.appealReason}"</p>
                                                {!!row.appealDocumentUrls?.length && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {row.appealDocumentUrls.map((url, idx) => (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                                                                <FaFileAlt size={9} /> Doc {idx + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-[10px] text-gray-400">Vendor hasn't submitted a reason yet — flagged automatically at review-queue entry.</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-[10px] font-bold text-gray-500">{new Date(row.submittedAt).toLocaleDateString()}</p>
                                        <p className="text-[9px] text-gray-400">{Math.floor(row.ageMinutes / 60)}h ago</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleResolve(row, 'approve')}
                                                disabled={actioningId === row.accountId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 disabled:opacity-40 transition-colors"
                                            >
                                                <FaCheckCircle size={10} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleResolve(row, 'reject')}
                                                disabled={actioningId === row.accountId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-40 transition-colors"
                                            >
                                                <FaTimesCircle size={10} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
