import { useState } from 'react';
import { FiX, FiStar, FiFlag, FiCheck } from 'react-icons/fi';
import api from '../api/axios';
import Swal from 'sweetalert2';

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  product?: {
    _id: string;
    name: string;
  };
  store: {
    name: string;
  };
  rating: number;
  comment: string;
  images?: string[];
  status: string;
  verifiedPurchase: boolean;
  vendorResponse?: string;
  createdAt: string;
}

interface ReviewModerationModalProps {
  review: Review;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ReviewModerationModal({ review, onClose, onUpdate }: ReviewModerationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleModerate = async (status: 'approved' | 'rejected' | 'flagged', reason?: string) => {
    setLoading(true);
    try {
      await api.patch(`/admin/reviews/${review._id}/moderate`, {
        status,
        moderationReason: reason
      });

      Swal.fire({
        icon: 'success',
        title: `Review ${status}`,
        timer: 2000
      });

      onUpdate();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to moderate review'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => handleModerate('approved');
  
  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Review',
      input: 'textarea',
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Enter reason for rejection...',
      showCancelButton: true
    });

    if (reason) {
      handleModerate('rejected', reason);
    }
  };

  const handleFlag = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Flag Review',
      input: 'textarea',
      inputLabel: 'Flag Reason',
      inputPlaceholder: 'Enter reason for flagging...',
      showCancelButton: true
    });

    if (reason) {
      handleModerate('flagged', reason);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Moderation</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                review.status === 'approved' ? 'bg-green-100 text-green-700' :
                review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                review.status === 'flagged' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {review.status}
              </span>
              {review.verifiedPurchase && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                  <FiCheck className="w-3 h-3" />
                  Verified Purchase
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rating */}
          <div className="flex items-center gap-2">
            {renderStars(review.rating)}
            <span className="text-gray-600 ml-2">{review.rating} out of 5</span>
          </div>

          {/* Review Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
          </div>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Attached Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {review.images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Review ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reviewer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Reviewer</h3>
              <p className="text-gray-700">{review.user.name}</p>
              <p className="text-sm text-gray-500">{review.user.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Product/Store</h3>
              {review.product && <p className="text-gray-700 text-sm">{review.product.name}</p>}
              <p className="text-sm text-gray-500">{review.store.name}</p>
            </div>
          </div>

          {/* Vendor Response */}
          {review.vendorResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Vendor Response</h3>
              <p className="text-gray-700 text-sm">{review.vendorResponse}</p>
            </div>
          )}

          {/* Review Date */}
          <div className="text-sm text-gray-500">
            Submitted on {new Date(review.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
          <div className="flex gap-3">
            {review.status !== 'approved' && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                Approve
              </button>
            )}
            {review.status !== 'rejected' && (
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                Reject
              </button>
            )}
            {review.status !== 'flagged' && (
              <button
                onClick={handleFlag}
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50"
              >
                <FiFlag className="inline mr-2" />
                Flag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
