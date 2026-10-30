import { useEffect, useState, useCallback } from 'react';
import { adminService, CourtCase } from '../api/admin.service';
import { FiFileText } from 'react-icons/fi';
import CourtCaseDetailsModal from '../components/CourtCaseDetailsModal';
import { ErrorState } from '../components/ErrorState';

export default function CourtCases() {
  const [cases, setCases] = useState<CourtCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchCases = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCourtCases({
        status: statusFilter,
        page,
        limit: pagination.limit
      });
      if (data.data?.cases) {
         setCases(data.data.cases);
         setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
         setCases(data.data);
      } else {
         setCases([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch court cases:', error);
      setError(error.response?.data?.message || 'We couldn\'t load court cases right now.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit]);

  useEffect(() => {
    fetchCases(1);
  }, [fetchCases]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCases(newPage);
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
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Court Cases</h1>
          <p className="text-sv-text-muted text-sm mt-1">Legal disputes and arbitrations</p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface text-sv-text-primary text-sm shadow-xs"
          >
            <option value="">All Cases</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Parties</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Filing Date</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {cases.map((courtCase) => (
                <tr
                  key={courtCase._id}
                  className="hover:bg-sv-surface-muted transition-colors cursor-pointer"
                  onClick={() => setSelectedCaseId(courtCase._id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FiFileText className="text-sv-text-muted text-lg shrink-0" />
                      <span className="font-semibold text-sv-text-primary">{courtCase.caseNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-medium text-sv-text-primary">{courtCase.plaintiff}</span>
                      <span className="text-sv-text-muted mx-2">vs</span>
                      <span className="font-medium text-sv-text-primary">{courtCase.defendant}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sv-text-secondary">
                    {new Date(courtCase.filingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                      courtCase.status === 'open' ? 'bg-sv-info-soft text-sv-info' : 'bg-sv-surface-muted text-sv-text-secondary border border-sv-border'
                    }`}>
                      {courtCase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-sv-primary hover:text-sv-primary-hover text-sm font-semibold transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCaseId(courtCase._id);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              
              {error && (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <ErrorState message={error} onRetry={() => fetchCases(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && cases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sv-text-secondary">
                    No court cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-sv-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-semibold text-sv-text-primary">{cases.length}</span> of <span className="font-semibold text-sv-text-primary">{pagination.total}</span> cases
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-sv-border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted text-sv-text-primary transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-sv-text-secondary">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 border border-sv-border rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted text-sv-text-primary transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Court Case Details Modal */}
      {selectedCaseId && (
        <CourtCaseDetailsModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onUpdate={() => {
            setSelectedCaseId(null);
            fetchCases(pagination.page);
          }}
        />
      )}
    </div>
  );
}
