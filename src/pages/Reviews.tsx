import { useEffect, useState, useCallback } from 'react';
import { adminService, Review } from '../api/admin.service';
import { FiStar } from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(''); // 'responded' or 'pending'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });



  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: pagination.limit
      };
      if (filter === 'responded') params.responded = 'true';
      if (filter === 'pending') params.responded = 'false';

      const data = await adminService.getReviews(params);
      if (data.data?.reviews) {
         setReviews(data.data.reviews);
         setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
         setReviews(data.data);
      } else {
         setReviews([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      setError(error.response?.data?.message || 'We couldn\'t load reviews right now.');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.limit]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchReviews(newPage);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-sv-warning fill-current' : 'text-sv-border'}`}
      />
    ));
  };

  // 🛡️ [REVIEWS-CONTRACT] 'published' was never a real backend status —
  // the real Review model enum is pending/approved/rejected/flagged. This
  // was the only status-dependent rendering in the file (traced before
  // changing it) — no other status-driven branches or actions exist here.
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-sv-success-soft text-sv-success border border-sv-success/30';
      case 'rejected': return 'bg-sv-danger-soft text-sv-danger border border-sv-danger/30';
      case 'flagged': return 'bg-sv-warning-soft text-sv-warning border border-sv-warning/30';
      default: return 'bg-sv-surface-muted text-sv-text-secondary border border-sv-border'; // 'pending'
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Reviews & Ratings</h1>
          <p className="text-sv-text-muted text-sm mt-1">Monitor product reviews and feedback</p>
        </div>

        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface text-sv-text-primary text-sm shadow-xs"
          >
            <option value="">All Reviews</option>
            <option value="pending">Pending Reply</option>
            <option value="responded">Responded</option>
          </select>
        </div>
      </div>

      {error && (
        <ErrorState message={error} onRetry={() => fetchReviews(pagination.page)} />
      )}

      {!error && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusStyle(review.status)}`}>
                  {review.status}
                </span>
              </div>
              
              <p className="text-sv-text-secondary text-sm leading-relaxed mb-4">"{review.comment}"</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-sv-border text-sm">
              <div className="font-semibold text-sv-text-primary truncate">{review.productName}</div>
              <div className="text-sv-text-muted text-xs mt-0.5">by {review.userName}</div>
              <div className="text-xs text-sv-text-muted mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-full py-16 text-center text-sv-text-secondary bg-sv-surface rounded-2xl border border-sv-border shadow-xs">
            No reviews found.
          </div>
        )}
      </div>
      )}

      {!error && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 border border-sv-border rounded-xl text-sm font-semibold text-sv-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all shadow-xs"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-sv-text-secondary px-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 border border-sv-border rounded-xl text-sm font-semibold text-sv-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all shadow-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
