import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../api/admin.service';
import { FiTag, FiSearch } from 'react-icons/fi';

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
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchCodes = useCallback(async (page = 1) => {
    setLoading(true);
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
    } catch (error) {
      console.error('Failed to fetch discount codes:', error);
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
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sv-text-primary">Marketing Hub</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor active discount codes across stores</p>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-sv-surface rounded-xl shadow-sm border border-sv-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sv-surface-muted border-b border-sv-border">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-sv-surface-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded text-blue-600">
                        <FiTag />
                      </div>
                      <span className="font-mono font-bold text-sv-text-primary">{code.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sv-text-secondary">
                    {code.storeId?.name || 'Unknown Store'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="capitalize font-medium">{code.type}</span>
                      <span className="text-sv-text-secondary ml-1">
                        ({code.type === 'percentage' ? `${code.value}%` : `₦${code.value}`})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sv-text-secondary">
                    {code.usedCount} / {code.usageLimit === 0 ? '∞' : code.usageLimit}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.status === 'active' ? 'bg-sv-success-soft text-sv-success' :
                      code.status === 'expired' ? 'bg-sv-danger-soft text-sv-danger' :
                      'bg-sv-surface-muted text-sv-text-secondary'
                    }`}>
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-sv-text-muted">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {codes.length === 0 && (
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
        <div className="px-6 py-4 border-t border-sv-border flex items-center justify-between">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-medium">{codes.length}</span> of <span className="font-medium">{pagination.total}</span> codes
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
    </div>
  );
}
