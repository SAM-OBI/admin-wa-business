import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { FiFilter, FiUser, FiCalendar, FiStar } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function PlatformReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);

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
        } catch {
            console.error('Failed to fetch platform reviews');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    useEffect(() => {
        fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await adminService.moderatePlatformReview(id, newStatus);
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-sv-text-primary">Platform Reviews</h1>
                    <p className="text-gray-500 text-sm">How buyers rate Shopvia itself, not any specific store</p>
                </div>

                <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-sv-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sv-primary outline-none"
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
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12 bg-sv-surface rounded-xl border border-sv-border">
                            <FiStar className="mx-auto text-4xl text-gray-300 mb-2" />
                            <p className="text-gray-500">No platform reviews found</p>
                        </div>
                    ) : (
                        reviews.map((item) => (
                            <div key={item._id} className="bg-sv-surface rounded-xl p-5 border border-sv-border shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600 text-xl font-bold flex items-center gap-1">
                                            <FiStar className="fill-amber-500" /> {item.rating}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <FiCalendar /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-medium whitespace-pre-wrap">{item.comment}</p>

                                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                                <FiUser />
                                                <span className="font-semibold">{item.user?.name || 'Unknown User'}</span>
                                                <span className="bg-gray-100 px-1.5 rounded text-gray-600">{item.user?.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                        <select
                                            value={item.status}
                                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none cursor-pointer hover:border-blue-400"
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
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 text-sm font-semibold text-gray-600 hover:border-blue-400"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}
