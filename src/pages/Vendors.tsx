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
      const response = await adminService.getVendors<any>({
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
      const reason = status === 'rejected' ? (prompt('Enter reason for rejection:') || undefined) : undefined;
      if (status === 'rejected' && !reason) return;
      await adminService.updateVendorVerification(vendorId, status, reason);
      fetchVendors();
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  const filteredVendors = vendors;


  const getVerificationBadge = (verification?: Vendor['verification']) => {
    const status = verification?.status || 'unverified';
    const colors = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      unverified: 'bg-gray-100 text-gray-700',
      locked: 'bg-orange-100 text-orange-700',
      failed: 'bg-red-100 text-red-700'
    };

    const icons = {
      verified: <FiCheckCircle className="mr-1" />,
      pending: <FiAlertCircle className="mr-1" />,
      rejected: <FiXCircle className="mr-1" />,
      unverified: <FiXCircle className="mr-1" />,
      locked: <FiShield className="mr-1" />,
      failed: <FiXCircle className="mr-1" />
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Vendors Management</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Institutional Oversight & Risk Governance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

             <select
              value={filters.verificationStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
              className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/40 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-white/20 transition-all cursor-pointer"
            >
              <option value="">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="SEARCH PROTOCOLS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-2 bg-zinc-900/50 border border-zinc-800/40 text-white text-xs font-bold placeholder:text-zinc-700 rounded-xl focus:outline-none focus:border-white/20 w-full sm:w-72 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/40 backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Identity Metadata</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Registry Stats</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Compliance</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Risk & Level</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredVendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-black border border-white/5 group-hover:border-white/20 transition-all text-lg shadow-inner">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-5">
                        <div className="font-black text-white text-sm tracking-tight">{vendor.name}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{vendor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-zinc-200 text-sm">{vendor.storeName || 'NATIVE_UNBOUND'}</div>
                    <div className="text-[10px] text-zinc-600 font-black uppercase mt-1">INTAKE {new Date(vendor.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      {getVerificationBadge(vendor.verification)}
                      {vendor.verification?.status === 'pending' && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleVerification(vendor._id, 'verified')}
                            className="text-[9px] font-black uppercase px-2 py-1 bg-emerald-500 text-black rounded hover:bg-emerald-400 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerification(vendor._id, 'rejected')}
                            className="text-[9px] font-black uppercase px-2 py-1 bg-red-500 text-white rounded hover:bg-red-400 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border ${
                          vendor.sellerLevel === 4 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          vendor.sellerLevel === 3 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          vendor.sellerLevel === 2 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-zinc-800 text-zinc-500 border-white/5'
                        }`}>
                          LEVEL {vendor.sellerLevel || 1}
                        </span>
                        {vendor.isFeatured && (
                          <span className="px-2.5 py-1 bg-white text-black rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            <FiCheckCircle className="w-3 h-3" /> FEATURED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-black text-white uppercase">{vendor.activityScore || 0} XP</div>
                        <div className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                          (vendor.riskProfile?.score || 0) < 30 ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                          (vendor.riskProfile?.score || 0) < 70 ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                          'text-red-500 border-red-500/20 bg-red-500/5'
                        }`}>
                          RISK_IDX {vendor.riskProfile?.score || 0}%
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/dashboard/vendors/${vendor._id}`}
                        className="text-[10px] font-black uppercase text-white hover:text-zinc-300 flex items-center gap-1.5 transition-colors border border-white/5 px-3 py-1.5 rounded-lg bg-white/[0.03]"
                      >
                        ANALYZE <FiExternalLink size={12} />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(vendor)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all border ${
                          vendor.isActive
                            ? 'text-red-500 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                      >
                        {vendor.isActive ? 'TERMINATE_SESSION' : 'REVIVE_ACCESS'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiAlertCircle className="text-zinc-800 w-12 h-12" />
                      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No active entities detected in registry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination Hub */}
        <div className="px-8 py-6 border-t border-zinc-800/60 bg-white/[0.01] flex items-center justify-between">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Registry Index <span className="text-white mx-1">{filteredVendors.length}</span> of <span className="text-white mx-1">{pagination.total}</span> Entities
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-3 py-1.5 rounded-md border border-white/5">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-zinc-800/60 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/[0.05] transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
