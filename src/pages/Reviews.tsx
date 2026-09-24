import { useEffect, useState, useCallback } from 'react';
import { adminService, Review } from '../api/admin.service';
import { FiStar } from 'react-icons/fi';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // 'responded' or 'pending'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });



  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
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
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.limit]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  /* const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchReviews(newPage);
    }
  }; */

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // 🛡️ [REVIEWS-CONTRACT] 'published' was never a real backend status —
  // the real Review model enum is pending/approved/rejected/flagged. This
  // was the only status-dependent rendering in the file (traced before
  // changing it) — no other status-driven branches or actions exist here.
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-sv-success-soft text-sv-success';
      case 'rejected': return 'bg-sv-danger-soft text-sv-danger';
      case 'flagged': return 'bg-sv-warning-soft text-sv-warning';
      default: return 'bg-sv-surface-muted text-sv-text-secondary'; // 'pending'
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sv-text-primary">Reviews & Ratings</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor product reviews and feedback</p>
        </div>

        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface"
          >
            <option value="">All Reviews</option>
            <option value="pending">Pending Reply</option>
            <option value="responded">Responded</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review._id} className="bg-sv-surface rounded-xl shadow-sm border border-sv-border p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                {renderStars(review.rating)}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusStyle(review.status)}`}>
                {review.status}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4 flex-1">"{review.comment}"</p>
            
            <div className="mt-auto pt-4 border-t border-gray-100 text-sm">
              <div className="font-medium text-gray-900">{review.productName}</div>
              <div className="text-gray-500">by {review.userName}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-full py-12 text-center text-sv-text-secondary bg-sv-surface rounded-xl border border-sv-border">
            No reviews found.
          </div>
        )}
      </div>
    </div>
  );
}
