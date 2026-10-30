import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { FiFilter, FiUser, FiCalendar, FiStar } from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';

export default function PlatformReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    // 🛡️ [ADMIN-STEP-UP-REPLICATE-1] /admin/platform-reviews/:id is gated by
    // requireSensitiveAction('MODERATE_PLATFORM_REVIEW') — was called with no
    // challenge token at all, so every moderation action always 403'd.
    const [moderateChallenge, setModerateChallenge] = useState<{ isOpen: boolean; id: string | null; newStatus: string | null }>({
        isOpen: false, id: null, newStatus: null
    });
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [openReplyId, setOpenReplyId] = useState<string | null>(null);
    const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

    const fetchReviews = useCallback(async (reset: boolean) => {
        setLoading(true);
        try {
            const response = await adminService.getPlatformReviews({
                limit: 10,
                status: filterStatus,
                cursor: reset ? undefined : cursor
            });
            if (response.data) {
                setReviews(prev => reset ? response.data.reviews : [...prev, ...response.data.reviews]);
                setHasMore(response.data.pagination.hasMore);
                setCursor(response.data.pagination.nextCursor);
            }
        } catch (error: any) {
            console.error('Failed to fetch platform reviews', error);
            Swal.fire({
                icon: 'error',
                title: 'Could not load reviews',
                text: error.response?.data?.message || 'Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000
            });
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    useEffect(() => {
        fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const handleStatusUpdate = (id: string, newStatus: string) => {
        setModerateChallenge({ isOpen: true, id, newStatus });
    };

    const handleModerateChallengeSuccess = async (challengeToken: string) => {
        const { id, newStatus } = moderateChallenge;
        if (!id || !newStatus) return;
        try {
            await adminService.moderatePlatformReview(id, newStatus, undefined, challengeToken);
            setReviews(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: 'Review status updated',
                timer: 1500,
                showConfirmButton: false
            });
        } catch {
            Swal.fire('Error', 'Failed to update status', 'error');
        } finally {
            setModerateChallenge({ isOpen: false, id: null, newStatus: null });
        }
    };

    const handleSubmitReply = async (id: string) => {
        const comment = (replyDrafts[id] || '').trim();
        if (!comment) return;
        setSubmittingReplyId(id);
        try {
            await adminService.replyToPlatformReview(id, comment);
            setReviews(prev => prev.map(r => r._id === id ? { ...r, adminReply: { comment, createdAt: new Date().toISOString() } } : r));
            setOpenReplyId(null);
            setReplyDrafts(prev => ({ ...prev, [id]: '' }));
            Swal.fire({ icon: 'success', title: 'Reply posted', timer: 1500, showConfirmButton: false });
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to post reply', 'error');
        } finally {
            setSubmittingReplyId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-sv-warning-soft text-sv-warning';
            case 'approved': return 'bg-sv-success-soft text-sv-success';
            case 'rejected': return 'bg-sv-surface-muted text-sv-text-secondary';
            case 'flagged': return 'bg-sv-danger-soft text-sv-danger';
            default: return 'bg-sv-surface-muted text-sv-text-secondary';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Platform Reviews</h1>
                    <p className="text-sv-text-muted text-sm mt-1">How buyers rate Shopvia itself, not any specific store</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FiFilter className="text-sv-text-muted shrink-0" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto border border-sv-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sv-primary outline-none bg-sv-surface text-sv-text-primary shadow-xs"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="flagged">Flagged</option>
                    </select>
                </div>
            </div>

            {loading && reviews.length === 0 ? (
                <div className="flex justify-center p-12 min-h-[300px] items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reviews.length === 0 ? (
                        <div className="text-center py-16 bg-sv-surface rounded-2xl border border-sv-border shadow-xs">
                            <FiStar className="mx-auto text-4xl text-sv-border mb-3" />
                            <p className="text-sv-text-muted text-sm">No platform reviews found</p>
                        </div>
                    ) : (
                        reviews.map((item) => (
                            <div key={item._id} className="bg-sv-surface rounded-2xl p-4 sm:p-5 border border-sv-border shadow-xs hover:shadow-md transition">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        <div className="p-2.5 bg-sv-warning-soft rounded-xl text-sv-warning text-xl font-bold flex items-center gap-1.5 border border-sv-warning/20 shrink-0">
                                            <FiStar className="fill-sv-warning" /> {item.rating}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-xs text-sv-text-muted flex items-center gap-1">
                                                    <FiCalendar /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sv-text-primary font-medium text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{item.comment}</p>

                                            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-sv-text-muted">
                                                <FiUser />
                                                <span className="font-semibold text-sv-text-secondary">{item.user?.name || 'Unknown User'}</span>
                                                <span className="bg-sv-surface-muted px-2 py-0.5 rounded-full text-sv-text-secondary border border-sv-border">{item.user?.email}</span>
                                            </div>

                                            {/* 🛡️ [PLATFORM-REVIEW-ADMIN-REPLY-1] Shopvia's own reply to this
                                                review — shown publicly on the About page under the review. */}
                                            {item.adminReply?.comment ? (
                                                <div className="mt-3 ml-1 p-3.5 bg-sv-primary/10 border-l-2 border-sv-primary rounded-r-xl">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-sv-primary mb-1">↩ Shopvia replied</p>
                                                    <p className="text-sm text-sv-text-primary leading-relaxed">{item.adminReply.comment}</p>
                                                </div>
                                            ) : openReplyId === item._id ? (
                                                <div className="mt-3 space-y-2">
                                                    <textarea
                                                        value={replyDrafts[item._id] || ''}
                                                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                        placeholder="Write Shopvia's reply..."
                                                        className="w-full border border-sv-border rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-sv-primary resize-y min-h-[70px] bg-sv-surface text-sv-text-primary placeholder:text-sv-text-muted shadow-xs"
                                                        maxLength={1000}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSubmitReply(item._id)}
                                                            disabled={submittingReplyId === item._id}
                                                            className="px-3.5 py-1.5 bg-sv-primary text-sv-text-inverse rounded-xl text-xs font-bold disabled:opacity-50 shadow-xs hover:bg-sv-primary-hover transition-colors"
                                                        >
                                                            {submittingReplyId === item._id ? 'Posting...' : 'Post Reply'}
                                                        </button>
                                                        <button
                                                            onClick={() => setOpenReplyId(null)}
                                                            className="px-3.5 py-1.5 border border-sv-border rounded-xl text-xs font-semibold text-sv-text-secondary hover:bg-sv-surface-muted transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setOpenReplyId(item._id)}
                                                    className="mt-3 text-xs font-semibold text-sv-primary hover:underline block"
                                                >
                                                    Reply as Shopvia
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-sv-border">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                            className="text-xs border border-sv-border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer bg-sv-surface text-sv-text-primary hover:border-sv-primary focus:ring-1 focus:ring-sv-primary"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="flagged">Flagged</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        disabled={loading}
                        onClick={() => fetchReviews(false)}
                        className="px-5 py-2 border border-sv-border rounded-xl disabled:opacity-50 text-sm font-semibold text-sv-text-primary hover:bg-sv-surface-muted shadow-xs transition-colors"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            <AdminSecurityChallengeModal
                isOpen={moderateChallenge.isOpen}
                onClose={() => setModerateChallenge({ isOpen: false, id: null, newStatus: null })}
                action="MODERATE_PLATFORM_REVIEW"
                onSuccess={handleModerateChallengeSuccess}
            />
        </div>
    );
}
