import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { FiTag, FiSearch } from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';

interface DiscountCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  status: string;
  usedCount: number;
  usageLimit: number;
  storeId?: { name: string };
  createdAt: string;
}

export default function Marketing() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchCodes = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getMarketingDiscountCodes({
        page,
        limit: pagination.limit,
        search
      });
      if (data.data?.discountCodes) {
         setCodes(data.data.discountCodes);
         setPagination(data.data.pagination);
      } else {
         setCodes([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch discount codes:', error);
      setError(error.response?.data?.message || 'We couldn\'t load discount codes right now.');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => {
    fetchCodes(1);
  }, [fetchCodes]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCodes(newPage);
    }
  };

  if (loading && codes.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Marketing Hub</h1>
          <p className="text-sv-text-muted text-sm mt-1">Monitor active discount codes across stores</p>
        </div>

        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sv-text-muted" />
          <input
            type="text"
            placeholder="Search codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary bg-sv-surface text-sv-text-primary text-sm shadow-xs placeholder:text-sv-text-muted"
          />
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Code</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Store</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold text-sv-text-secondary uppercase tracking-wider text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-sv-surface-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sv-primary/10 rounded-lg text-sv-primary border border-sv-primary/20 shrink-0">
                        <FiTag />
                      </div>
                      <span className="font-mono font-bold text-sv-text-primary">{code.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sv-text-secondary">
                    {code.storeId?.name || 'Unknown Store'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="capitalize font-medium text-sv-text-primary">{code.type}</span>
                      <span className="text-sv-text-muted ml-1">
                        ({code.type === 'percentage' ? `${code.value}%` : `₦${code.value}`})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sv-text-secondary">
                    {code.usedCount} / {code.usageLimit === 0 ? '∞' : code.usageLimit}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      code.status === 'active' ? 'bg-sv-success-soft text-sv-success border border-sv-success/30' :
                      code.status === 'expired' ? 'bg-sv-danger-soft text-sv-danger border border-sv-danger/30' :
                      'bg-sv-surface-muted text-sv-text-secondary border border-sv-border'
                    }`}>
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-sv-text-muted">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <ErrorState message={error} onRetry={() => fetchCodes(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sv-text-secondary">
                    No discount codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-sv-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-semibold text-sv-text-primary">{codes.length}</span> of <span className="font-semibold text-sv-text-primary">{pagination.total}</span> codes
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
    </div>
  );
}
