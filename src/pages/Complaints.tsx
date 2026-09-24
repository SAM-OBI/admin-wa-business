import { useEffect, useState, useCallback } from 'react';
import { adminService, Complaint } from '../api/admin.service';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import api from '../api/axios';

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });

  const fetchComplaints = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminService.getComplaints({
        status: filters.status,
        priority: filters.priority,
        page,
        limit: pagination.limit
      });
      if (data.data?.complaints) {
         setComplaints(data.data.complaints);
         setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
         setComplaints(data.data);
      } else {
         setComplaints([]);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, pagination.limit]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchComplaints(newPage);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await adminService.resolveComplaint(id);
      setComplaints(complaints.map(c =>
        c._id === id ? { ...c, status: 'RESOLVED' } : c
      ));
    } catch (error) {
      console.error('Failed to resolve complaint:', error);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await api.get(`/admin/complaints/${id}/details`);
      if (response.data.data) {
        setSelectedComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch complaint details:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user issues and disputes</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <HardenedSearchInput
            value=""
            onChange={() => {
              // Implementation would involve adding search param to fetchComplaints
            }}
            placeholder="SEARCH ISSUES..."
            className="w-full sm:w-64"
            context="ADMIN"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                {/* 🛡️ [#8D] type was already sent by the backend but never surfaced in this list. */}
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr 
                  key={complaint._id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(complaint._id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      complaint.type === 'direct_transfer_unacknowledged' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {(complaint.type || 'other').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {complaint.complainant?.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      complaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                      complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {(complaint.status === 'OPEN' || complaint.status === 'INVESTIGATING') && <FiAlertCircle className="text-yellow-500" />}
                       {complaint.status === 'RESOLVED' && <FiCheckCircle className="text-green-500" />}
                       <span className="capitalize">{complaint.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {complaint.status !== 'RESOLVED' && complaint.status !== 'DISMISSED' && (
                      <button
                        onClick={() => handleResolve(complaint._id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

         {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{complaints.length}</span> of <span className="font-medium">{pagination.total}</span> complaints
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={() => {
            setSelectedComplaint(null);
            fetchComplaints(pagination.page);
          }}
        />
      )}
    </div>
  );
}
