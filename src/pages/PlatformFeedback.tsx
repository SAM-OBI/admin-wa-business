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
        } catch {
            console.error('Failed to fetch feedback details');
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
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'read': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">App Feedback</h1>
                    <p className="text-gray-500 text-sm">Review user and vendor feedback about the platform</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Categories</option>
                        <option value="general">General</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature_request">Feature Request</option>
                    </select>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {feedbacks.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <FiMessageSquare className="mx-auto text-4xl text-gray-300 mb-2" />
                            <p className="text-gray-500">No feedback found</p>
                        </div>
                    ) : (
                        feedbacks.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-xl font-bold">
                                            {item.rating}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${item.category === 'bug' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {item.category.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <FiCalendar /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 font-medium whitespace-pre-wrap">{item.comment}</p>
                                            
                                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                                <FiUser /> 
                                                <span className="font-semibold">{item.user?.name || 'Unknown User'}</span>
                                                <span className="bg-gray-100 px-1.5 rounded text-gray-600 capitalize">({item.userType})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <select 
                                            value={item.status}
                                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none cursor-pointer hover:border-blue-400"
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
            
            {/* Pagination ... simplified for now */}
             <div className="flex justify-center mt-6 gap-2">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span className="px-3 py-1 text-gray-500">Page {page} of {totalPages}</span>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
