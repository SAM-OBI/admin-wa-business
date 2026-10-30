import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { FiAlertOctagon, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { ErrorState } from '../components/ErrorState';

interface AuditLog {
  _id: string;
  user?: { name: string; email: string; role: string };
  action: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  targetEntity?: { type: string; id: string };
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    severity: '',
    action: '',
    userType: ''
  });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/audit-logs', {
        params: { ...filters, page, limit: pagination.limit }
      });
      // response.data -> { success, data: { logs: [], pagination: {} } }
      if (response.data.data?.logs) {
         setLogs(response.data.data.logs);
         setPagination(response.data.data.pagination);
      } else {
         setLogs([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      setError(error?.response?.data?.message || 'We couldn\'t load audit logs right now.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <FiAlertOctagon className="text-sv-danger" />;
      case 'warning': return <FiAlertTriangle className="text-sv-warning" />;
      default: return <FiInfo className="text-sv-info" />;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight">Audit Logs</h1>
          <p className="text-sv-text-secondary text-sm mt-1">System activity and security logs</p>
        </div>

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="px-3.5 py-2 text-xs font-bold border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary bg-sv-surface text-sv-text-primary shadow-xs"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

           <select
            value={filters.userType}
            onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
            className="px-3.5 py-2 text-xs font-bold border border-sv-border rounded-xl focus:outline-none focus:ring-2 focus:ring-sv-primary/20 focus:border-sv-primary bg-sv-surface text-sv-text-primary shadow-xs"
          >
            <option value="">All Users</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="bg-sv-surface rounded-2xl shadow-xs border border-sv-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-sv-surface-muted/60 border-b border-sv-border">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Severity</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Action</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">User</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider">Description</th>
                <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-semibold text-sv-text-secondary uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-sv-surface-muted/40 transition-colors">
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                     <div className="flex items-center gap-2 capitalize">
                       {getSeverityIcon(log.severity)}
                       <span className="text-sm font-medium text-sv-text-secondary">{log.severity}</span>
                     </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className="px-2 py-1 bg-sv-surface-muted rounded-lg text-xs font-mono text-sv-text-secondary border border-sv-border">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                    <div className="text-sm font-medium text-sv-text-primary">{log.user?.name || 'System'}</div>
                    <div className="text-xs text-sv-text-muted">{log.user?.email || log.user?.role}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-sm text-sv-text-secondary">
                    {log.description}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right text-sm text-sv-text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {error && (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-12">
                    <ErrorState message={error} onRetry={() => fetchLogs(pagination.page)} />
                  </td>
                </tr>
              )}

              {!error && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-sv-text-secondary">
                    No audit logs found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-sv-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-sv-text-secondary">
            Showing <span className="font-semibold text-sv-text-primary">{logs.length}</span> of <span className="font-semibold text-sv-text-primary">{pagination.total}</span> logs
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
    </div>
  );
}
