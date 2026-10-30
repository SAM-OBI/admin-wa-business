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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Bank Appeal Queue</h1>
                <p className="text-sm text-sv-text-secondary mt-1 max-w-3xl">
                    Vendor bank accounts flagged by the name-match engine for a low similarity score. Review the vendor's explanation and any attached documents, then approve to verify the account for payouts or reject with a reason.
                </p>
            </div>

            <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-sv-surface-muted/60 border-b border-sv-border">
                            <tr>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Vendor</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Bank Account</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Match Score</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-left text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Vendor's Reason</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Submitted</th>
                                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sv-border">
                            {queue.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-sv-text-muted font-bold">
                                    No bank-account appeals pending review.
                                </td></tr>
                            ) : queue.map((row) => (
                                <tr key={row.accountId} className="hover:bg-sv-surface-muted/40 transition-colors align-top">
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <p className="font-bold text-sv-text-primary text-xs">{row.userName}</p>
                                        <p className="text-[10px] text-sv-text-muted">{row.email}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <p className="font-bold text-sv-text-primary text-xs">{row.bankAccountName}</p>
                                        <p className="text-[10px] text-sv-text-muted">{row.bankName}</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                        <span className={`font-black text-xs ${row.nameSimilarity >= 0.4 ? 'text-sv-warning' : 'text-sv-danger'}`}>
                                            {Math.round((row.nameSimilarity || 0) * 100)}%
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-[280px]">
                                        {row.appealReason ? (
                                            <>
                                                <p className="text-[11px] text-sv-text-secondary italic">"{row.appealReason}"</p>
                                                {!!row.appealDocumentUrls?.length && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {row.appealDocumentUrls.map((url, idx) => (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-sv-primary hover:underline">
                                                                <FaFileAlt size={9} /> Doc {idx + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-[10px] text-sv-text-muted">Vendor hasn't submitted a reason yet — flagged automatically at review-queue entry.</p>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                        <p className="text-[10px] font-bold text-sv-text-muted">{new Date(row.submittedAt).toLocaleDateString()}</p>
                                        <p className="text-[9px] text-sv-text-muted">{Math.floor(row.ageMinutes / 60)}h ago</p>
                                    </td>
                                    <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleResolve(row, 'approve')}
                                                disabled={actioningId === row.accountId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sv-success-soft text-sv-success rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-40 transition-opacity"
                                            >
                                                <FaCheckCircle size={10} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleResolve(row, 'reject')}
                                                disabled={actioningId === row.accountId}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sv-danger-soft text-sv-danger rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-40 transition-opacity"
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
