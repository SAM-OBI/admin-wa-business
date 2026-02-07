import { useEffect, useState, useCallback } from 'react';
import { adminService, StoreDomain } from '../api/admin.service';
import { FiSearch, FiCheckCircle, FiXCircle, FiAlertCircle, FiGlobe, FiShield } from 'react-icons/fi';
import { showToast, showError, showSuccess } from '../utils/swal';

export default function Domains() {
  const [domains, setDomains] = useState<StoreDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    status: ''
  });

  const [selectedDomain, setSelectedDomain] = useState<StoreDomain | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'verified' | 'rejected' | 'failed'>('verified');
  const [actionReason, setActionReason] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDomains = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminService.getDomains({
        search: searchTerm,
        status: filters.status,
        page,
        limit: pagination.limit
      });
      
      if (data.data?.stores) {
         setDomains(data.data.stores);
         setPagination(data.data.pagination);
      } else {
         setDomains([]);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      showError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.limit]);

  useEffect(() => {
    fetchDomains(1);
  }, [filters, fetchDomains]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDomains(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchDomains]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchDomains(newPage);
    }
  };

  const openActionModal = (domain: StoreDomain, type: 'verified' | 'rejected' | 'failed') => {
    setSelectedDomain(domain);
    setActionType(type);
    setActionReason('');
    setJustification('');
    setShowActionModal(true);
  };

  const handleManageDomain = async () => {
    if (!selectedDomain) return;
    if (!justification) {
        showToast('Justification is required for this action', 'warning');
        return;
    }

    setIsSubmitting(true);
    try {
      await adminService.manageDomain(selectedDomain._id, {
        status: actionType,
        reason: actionReason,
        justification
      });
      
      showSuccess(`Domain ${actionType} successfully`);
      setShowActionModal(false);
      fetchDomains(pagination.page);
    } catch (error: any) {
      console.error('Failed to manage domain:', error);
      showError(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      failed: 'bg-orange-100 text-orange-700'
    };

    const icons = {
      verified: <FiCheckCircle className="mr-1" />,
      pending: <FiAlertCircle className="mr-1" />,
      rejected: <FiXCircle className="mr-1" />,
      failed: <FiAlertCircle className="mr-1" />
    };

    const statusMap: any = colors;
    const iconMap: any = icons;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[status] || 'bg-gray-100 text-gray-700'}`}>
        {iconMap[status] || <FiGlobe className="mr-1" />}
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Domains</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and verify custom domains for vendor stores</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains or stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Store & Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom Domain</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sync</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-500 font-medium">Loading domains...</span>
                          </div>
                      </td>
                  </tr>
              ) : domains.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <FiGlobe size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No custom domains found matching your criteria.</p>
                          </div>
                      </td>
                  </tr>
              ) : domains.map((store) => (
                <tr key={store._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold text-gray-900">{store.name}</div>
                        <div className="text-xs text-gray-500">{store.owner.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-mono text-sm text-blue-600 font-medium flex items-center gap-1">
                            {store.customDomain.domain}
                            <a href={`https://${store.customDomain.domain}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500">
                                <FiExternalLink size={12} />
                            </a>
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Slug: {store.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(store.customDomain.status)}
                    {store.customDomain.errorMessage && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={store.customDomain.errorMessage}>
                            {store.customDomain.errorMessage}
                        </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {store.customDomain.dnsCheckedAt ? new Date(store.customDomain.dnsCheckedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {store.customDomain.status !== 'verified' && (
                        <button
                          onClick={() => openActionModal(store, 'verified')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Force Verify"
                        >
                          <FiCheckCircle size={18} />
                        </button>
                      )}
                      {store.customDomain.status === 'verified' && (
                        <button
                          onClick={() => openActionModal(store, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revoke / Reject"
                        >
                          <FiShield size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => openActionModal(store, 'failed')}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Mark Failed"
                      >
                         <FiXCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && domains.length > 0 && (
            <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{domains.length}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> domains
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition shadow-sm"
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-4 text-sm font-medium text-gray-600">
                        {pagination.page} / {pagination.pages}
                    </div>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="px-4 py-1.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition shadow-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedDomain && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                          {actionType === 'verified' ? 'Verify Domain' : actionType === 'rejected' ? 'Revoke Domain' : 'Flag Domain Failed'}
                      </h3>
                      <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600">
                          <FiXCircle size={24} />
                      </button>
                  </div>

                  <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                          <FiGlobe className="shrink-0" size={24} />
                          <div>
                              <p className="font-bold text-sm">{selectedDomain.customDomain.domain}</p>
                              <p className="text-xs opacity-80">Store: {selectedDomain.name}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {actionType !== 'verified' && (
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Failure/Rejection</label>
                                  <textarea 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px]"
                                    placeholder="Explain why this domain is being flagged..."
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                  />
                              </div>
                          )}

                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Justification <span className="text-xs font-normal text-gray-400">(Administrative Audit Log)</span>
                              </label>
                              <textarea 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                                placeholder="Why are you taking this manual action?"
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                required
                              />
                              <p className="text-[10px] text-gray-400 mt-1 italic">
                                  * This action will be logged in the security audit trail and associated with your admin account.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 flex gap-3 justify-end">
                      <button 
                        onClick={() => setShowActionModal(false)}
                        className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleManageDomain}
                        disabled={isSubmitting || !justification}
                        className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition flex items-center gap-2 ${
                            actionType === 'verified' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' :
                            actionType === 'rejected' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                            'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                        } disabled:opacity-50`}
                      >
                          {isSubmitting ? (
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          ) : (
                              'Confirm Action'
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function FiExternalLink(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
