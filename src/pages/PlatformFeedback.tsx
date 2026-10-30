import { useState, useEffect } from 'react';
import { adminService } from '../api/admin.service';
import { FiFilter, FiUser, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function PlatformFeedback() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filterCategory]);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await adminService.getFeedbacks({ 
                page, 
                limit: 10,
                type: filterCategory 
            });
            if (response.data) {
                setFeedbacks(response.data.feedbacks);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error: any) {
            console.error('Failed to fetch feedback details', error);
            Swal.fire({
                icon: 'error',
                title: 'Could not load feedback',
                text: error.response?.data?.message || 'Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await adminService.updateFeedbackStatus(id, newStatus);
            fetchFeedbacks();
            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: 'Feedback status updated',
                timer: 1500,
                showConfirmButton: false
            });
        } catch {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'new': return 'bg-sv-info-soft text-sv-info';
            case 'read': return 'bg-sv-surface-muted text-sv-text-secondary';
            case 'in_progress': return 'bg-sv-warning-soft text-sv-warning';
            case 'resolved': return 'bg-sv-success-soft text-sv-success';
            default: return 'bg-sv-surface-muted text-sv-text-secondary';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">App Feedback</h1>
                    <p className="text-sv-text-muted text-sm mt-1">Review user and vendor feedback about the platform</p>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FiFilter className="text-sv-text-muted shrink-0" />
                    <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full sm:w-auto border border-sv-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-sv-primary outline-none bg-sv-surface text-sv-text-primary shadow-xs"
                    >
                        <option value="">All Categories</option>
                        <option value="general">General</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature_request">Feature Request</option>
                    </select>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12 min-h-[300px] items-center">
                     <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {feedbacks.length === 0 ? (
                        <div className="text-center py-16 bg-sv-surface rounded-2xl border border-sv-border shadow-xs">
                            <FiMessageSquare className="mx-auto text-4xl text-sv-border mb-3" />
                            <p className="text-sv-text-muted text-sm">No feedback found</p>
                        </div>
                    ) : (
                        feedbacks.map((item) => (
                            <div key={item._id} className="bg-sv-surface rounded-2xl p-4 sm:p-5 border border-sv-border shadow-xs hover:shadow-md transition">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        <div className="p-2.5 bg-sv-primary/10 rounded-xl text-sv-primary text-xl font-bold border border-sv-primary/20 shrink-0">
                                            {item.rating}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.category === 'bug' ? 'bg-sv-danger-soft text-sv-danger border border-sv-danger/20' : 'bg-sv-surface-muted text-sv-text-secondary border border-sv-border'}`}>
                                                    {item.category?.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-sv-text-muted flex items-center gap-1">
                                                    <FiCalendar /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sv-text-primary font-medium text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{item.comment}</p>
                                            
                                            <div className="flex items-center gap-2 mt-3 text-xs text-sv-text-muted">
                                                <FiUser /> 
                                                <span className="font-semibold text-sv-text-secondary">{item.user?.name || 'Unknown User'}</span>
                                                <span className="bg-sv-surface-muted px-2 py-0.5 rounded-full text-sv-text-secondary border border-sv-border capitalize">({item.userType})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-sv-border">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                            {item.status?.replace('_', ' ')}
                                        </span>
                                        <select 
                                            value={item.status}
                                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                            className="text-xs border border-sv-border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer bg-sv-surface text-sv-text-primary hover:border-sv-primary focus:ring-1 focus:ring-sv-primary"
                                        >
                                            <option value="new">New</option>
                                            <option value="read">Read</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {/* Pagination */}
            <div className="flex items-center justify-center mt-6 gap-3">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-1.5 border border-sv-border rounded-xl text-sm font-semibold text-sv-text-primary disabled:opacity-50 hover:bg-sv-surface-muted transition-colors shadow-xs"
                >
                    Prev
                </button>
                <span className="px-2 text-sm text-sv-text-secondary">Page {page} of {totalPages}</span>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-1.5 border border-sv-border rounded-xl text-sm font-semibold text-sv-text-primary disabled:opacity-50 hover:bg-sv-surface-muted transition-colors shadow-xs"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
