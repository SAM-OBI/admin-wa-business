import { useEffect, useState, useCallback } from 'react';
import { adminService, Vendor } from '../api/admin.service';
import { FiSearch, FiShield, FiExternalLink, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState({
    status: '',
    verificationStatus: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getVendors({
         page: pagination.page,
         limit: pagination.limit,
         search: searchTerm,
         accountStatus: filters.status,
         verificationStatus: filters.verificationStatus
      });
      
      if (response.data && response.data.vendors) {
         setVendors(response.data.vendors);
         setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
         setVendors([]);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters.status, filters.verificationStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchVendors]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      if (vendor.isActive) {
        const reason = prompt('Enter reason for suspension:');
        if (!reason) return;
        await adminService.suspendVendor(vendor._id, reason);
      } else {
        await adminService.activateVendor(vendor._id);
      }
      // Optimistic update
      setVendors(vendors.map(v => 
        v._id === vendor._id ? { ...v, isActive: !v.isActive } : v
      ));
    } catch (error) {
      console.error('Failed to update vendor status:', error);
      fetchVendors();
    }
  };

  const handleVerification = async (vendorId: string, status: 'verified' | 'rejected') => {
    try {
      let reason;
      if (status === 'rejected') {
        reason = prompt('Enter reason for rejection:');
        if (!reason) return;
      }
      await adminService.updateVendorVerification(vendorId, status, reason);
      fetchVendors();
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  const filteredVendors = vendors;

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600 bg-green-50';
    if (score < 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getVerificationBadge = (verification?: Vendor['verification']) => {
    const status = verification?.status || 'unverified';
    const colors = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      unverified: 'bg-gray-100 text-gray-700',
      locked: 'bg-orange-100 text-orange-700'
    };

    const icons = {
      verified: <FiCheckCircle className="mr-1" />,
      pending: <FiAlertCircle className="mr-1" />,
      rejected: <FiXCircle className="mr-1" />,
      unverified: <FiXCircle className="mr-1" />,
      locked: <FiAlertCircle className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vendors Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor vendor performance and risk</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

           <select
            value={filters.verificationStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </select>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Info</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{vendor.storeName || 'No Store'}</div>
                    <div className="text-sm text-gray-500">Joined {new Date(vendor.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getVerificationBadge(vendor.verification)}
                    {vendor.verification?.status === 'pending' && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleVerification(vendor._id, 'verified')}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerification(vendor._id, 'rejected')}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      vendor.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {vendor.isActive ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                      {vendor.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-sm font-medium ${getRiskColor(vendor.riskProfile?.score || 0)}`}>
                      <FiShield />
                      {vendor.riskProfile?.score || 0}/100
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/dashboard/vendors/${vendor._id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        Details <FiExternalLink />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(vendor)}
                        className={`text-sm font-medium px-3 py-1 rounded-md transition ${
                          vendor.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {vendor.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredVendors.length}</span> of <span className="font-medium">{pagination.total}</span> vendors
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
