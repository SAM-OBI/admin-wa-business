import { useEffect, useState, useCallback } from 'react';
import { adminService, CourtCase } from '../api/admin.service';
import { FiFileText } from 'react-icons/fi';
import CourtCaseDetailsModal from '../components/CourtCaseDetailsModal';

export default function CourtCases() {
  const [cases, setCases] = useState<CourtCase[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Failed to fetch court cases:', error);
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
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sv-text-primary">Court Cases</h1>
          <p className="text-gray-500 text-sm mt-1">Legal disputes and arbitrations</p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface"
          >
            <option value="">All Costs</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-sv-surface rounded-xl shadow-sm border border-sv-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Case Number</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Parties</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Filing Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider text-right">Actions</th>
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
                      <FiFileText className="text-sv-text-muted" />
                      <span className="font-medium text-sv-text-primary">{courtCase.caseNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-medium">{courtCase.plaintiff}</span>
                      <span className="text-sv-text-secondary mx-2">vs</span>
                      <span className="font-medium">{courtCase.defendant}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sv-text-secondary">
                    {new Date(courtCase.filingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      courtCase.status === 'open' ? 'bg-sv-info-soft text-sv-info' : 'bg-sv-surface-muted text-sv-text-secondary'
                    }`}>
                      {courtCase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
              
              {cases.length === 0 && (
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
        <div className="px-6 py-4 border-t border-sv-border flex items-center justify-between">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-medium">{cases.length}</span> of <span className="font-medium">{pagination.total}</span> cases
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-sv-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-sv-text-secondary">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-sv-border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sv-surface-muted"
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
