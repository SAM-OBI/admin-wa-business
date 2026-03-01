import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { FiAlertOctagon, FiAlertTriangle, FiInfo } from 'react-icons/fi';

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
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
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
      case 'critical': return <FiAlertOctagon className="text-red-500" />;
      case 'warning': return <FiAlertTriangle className="text-yellow-500" />;
      default: return <FiInfo className="text-blue-500" />;
    }
  };

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">System activity and security logs</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

           <select
            value={filters.userType}
            onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Users</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 capitalize">
                       {getSeverityIcon(log.severity)}
                       <span className="text-sm font-medium text-gray-700">{log.severity}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{log.user?.name || 'System'}</div>
                    <div className="text-xs text-gray-500">{log.user?.email || log.user?.role}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{pagination.total}</span> logs
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
    </div>
  );
}
