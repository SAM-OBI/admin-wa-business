import { useEffect, useState, useCallback } from 'react';
import { adminService, Complaint } from '../api/admin.service';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [challengeComplaintId, setChallengeComplaintId] = useState<string | null>(null);
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
    setError(null);
    try {
      const data = await adminService.getComplaints({
        status: filters.status,
        priority: filters.priority,
        search,
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
    } catch (error: any) {
      console.error('Failed to fetch complaints:', error);
      setError(error.response?.data?.message || 'We couldn\'t load complaints right now.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, search, pagination.limit]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchComplaints(newPage);
    }
  };

  const handleResolve = (id: string) => {
    if (resolvingId) return;
    // 🛡️ [ADMIN-STEP-UP-REPLICATE-1] /admin/complaints/:id/resolve is gated
    // behind requireSensitiveAction('RESOLVE_COMPLAINT'), which always 403s
    // without a fresh x-security-challenge-token (rbac.middleware.ts) - so
    // the challenge must run before the resolve call, same proactive
    // pattern VendorDetails.tsx uses for OVERRIDE_SUBSCRIPTION.
    setChallengeComplaintId(id);
    setIsChallengeOpen(true);
  };

  const handleChallengeSuccess = async (challengeToken: string) => {
    const id = challengeComplaintId;
    if (!id) return;
    setResolvingId(id);
    try {
      await adminService.resolveComplaint(id, challengeToken);
      setComplaints(complaints.map(c =>
        c._id === id ? { ...c, status: 'RESOLVED' } : c
      ));
    } catch (error: any) {
      console.error('Failed to resolve complaint:', error);
      alert(error.response?.data?.message || 'Failed to resolve complaint.');
    } finally {
      setResolvingId(null);
      setChallengeComplaintId(null);
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
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Complaints</h1>
          <p className="text-sv-text-secondary text-sm mt-1">Manage user issues and disputes</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <HardenedSearchInput
            value={search}
            onChange={setSearch}
            placeholder="SEARCH ISSUES..."
            className="w-full sm:w-64"
            context="ADMIN"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3.5 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary bg-sv-surface text-sv-text-primary text-xs font-bold shadow-xs"
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
            className="px-3.5 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary bg-sv-surface text-sv-text-primary text-xs font-bold shadow-xs"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-sv-surface-muted/60 border-b border-sv-border">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Issue</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">User</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Priority</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {complaints.map((complaint) => (
                <tr
                  key={complaint._id}
                  className="hover:bg-sv-surface-muted/40 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(complaint._id)}
                >
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className="font-medium text-sv-text-primary text-sm">{complaint.title}</div>
                    <div className="text-xs text-sv-text-secondary line-clamp-1 mt-0.5">{complaint.description}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      complaint.type === 'direct_transfer_unacknowledged' ? 'bg-sv-tag-soft text-sv-tag' : 'bg-sv-surface-muted text-sv-text-secondary border border-sv-border'
                    }`}>
                      {(complaint.type || 'other').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-sm text-sv-text-secondary">
                    {complaint.complainant?.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      complaint.priority === 'high' ? 'bg-sv-danger-soft text-sv-danger' :
                      complaint.priority === 'medium' ? 'bg-sv-warning-soft text-sv-warning' :
                      'bg-sv-success-soft text-sv-success'
                    }`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className="flex items-center gap-2">
                       {(complaint.status === 'OPEN' || complaint.status === 'INVESTIGATING') && <FiAlertCircle className="text-sv-warning" />}
                       {complaint.status === 'RESOLVED' && <FiCheckCircle className="text-sv-success" />}
                       <span className="capitalize text-xs font-medium text-sv-text-primary">{complaint.status}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                    {complaint.status !== 'RESOLVED' && complaint.status !== 'DISMISSED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(complaint._id);
                        }}
                        disabled={resolvingId === complaint._id}
                        className="text-sv-success hover:underline text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resolvingId === complaint._id ? 'Resolving...' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {error && (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12">
                    <ErrorState message={error} onRetry={() => fetchComplaints(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && complaints.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 text-center text-sv-text-secondary">
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

         {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-sv-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-semibold text-sv-text-primary">{complaints.length}</span> of <span className="font-semibold text-sv-text-primary">{pagination.total}</span> complaints
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-sv-border rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-colors text-sv-text-primary"
            >
              Previous
            </button>
            <span className="px-2 text-xs font-medium text-sv-text-muted">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 border border-sv-border rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-colors text-sv-text-primary"
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

      <AdminSecurityChallengeModal
        isOpen={isChallengeOpen}
        onClose={() => {
          setIsChallengeOpen(false);
          setChallengeComplaintId(null);
        }}
        action="RESOLVE_COMPLAINT"
        onSuccess={handleChallengeSuccess}
      />
    </div>
  );
}
