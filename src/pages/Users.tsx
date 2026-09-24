import { useEffect, useState, useCallback } from 'react';
import { adminService, User } from '../api/admin.service';
import { FiCheckCircle, FiXCircle, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import { ErrorState } from '../components/ErrorState';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // 🛡️ [ADR-005] Same fix as Vendors.tsx — a failed fetch used to be
  // indistinguishable from "genuinely zero users."
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers<any>({
        search: searchTerm,
        role: filters.role,
        status: filters.status,
        page,
        limit: pagination.limit
      });
      // Handle response structure { users: [], pagination: {} }
      if (data.data?.users) {
         setUsers(data.data.users);
         setPagination(data.data.pagination);
      } else if (Array.isArray(data.data)) {
         // Fallback for array response
         setUsers(data.data);
      } else {
         setUsers([]);
      }
    } catch (err: any) {
      logger.error('Failed to fetch users:', err);
      setError(err?.response?.data?.message || 'We couldn\'t load users right now.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.limit]);

  useEffect(() => {
    fetchUsers(1);
  }, [filters, fetchUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchUsers(newPage);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await adminService.toggleUserStatus(user._id, user.isActive);
      // Optimistic update
      setUsers(users.map(u => 
        u._id === user._id ? { ...u, isActive: !u.isActive } : u
      ));
    } catch (error) {
      logger.error('Failed to update user status:', error);
      fetchUsers(pagination.page);
    }
  };

  const filteredUsers = users;

  const getVerificationBadge = (verification?: User['verification']) => {
    const status = verification?.status || 'unverified';
    const isAnyVerified = verification?.bvnVerified || verification?.ninVerified || verification?.votersVerified;
    
    const colors = {
      verified: 'bg-sv-success-soft text-sv-success',
      pending: 'bg-sv-warning-soft text-sv-warning',
      rejected: 'bg-sv-danger-soft text-sv-danger',
      unverified: 'bg-sv-surface-muted text-sv-text-secondary',
      locked: 'bg-sv-warning-soft text-sv-warning',
      failed: 'bg-sv-danger-soft text-sv-danger'
    };

    const icons = {
      verified: <FiCheckCircle className="mr-1" />,
      pending: <FiAlertCircle className="mr-1" />,
      rejected: <FiXCircle className="mr-1" />,
      unverified: <FiXCircle className="mr-1" />,
      locked: <FiAlertCircle className="mr-1" />,
      failed: <FiXCircle className="mr-1" />
    };

    const displayStatus = isAnyVerified ? 'verified' : status;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${colors[displayStatus]}`}>
        {icons[displayStatus]}
        {displayStatus}
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
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Registry Oversight</h1>
          <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Platform Identity & Access Governance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="USERS">Users</option>
              <option value="VENDORS">Vendors</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-sv-surface-elevated/50 border border-sv-border text-sv-text-muted text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <HardenedSearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            placeholder="SEARCH ENTITIES..."
            className="w-full sm:w-72"
            context="ADMIN"
          />
        </div>
      </div>

      <div className="bg-sv-surface-elevated/50 rounded-2xl border border-sv-border backdrop-blur-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface/5">
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Identity Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Authorization</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Trust Signal</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Access State</th>
                <th className="px-8 py-5 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-sv-surface-muted transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-xl bg-sv-surface-muted flex items-center justify-center text-sv-text-secondary font-black border border-sv-border group-hover:border-sv-primary/30 transition-all text-lg shadow-inner">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-5">
                        <div className="font-black text-sv-text-primary text-sm tracking-tight">{user.name}</div>
                        <div className="text-[10px] text-sv-text-muted font-bold uppercase tracking-widest mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase rounded border ${
                      user.role === 'ADMIN' ? 'bg-sv-tag-soft text-sv-tag border-sv-tag/20' :
                      user.role === 'VENDORS' ? 'bg-sv-info-soft text-sv-info border-sv-info/30' :
                      'bg-sv-surface-muted text-sv-text-secondary border-sv-border'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {getVerificationBadge(user.verification)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {user.isActive ? 'Active' : 'Halted'}
                      </span>
                    </div>
                    <div className="text-[9px] text-sv-text-muted font-black uppercase mt-1 tracking-tighter">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/dashboard/users/${user._id}`}
                        className="text-[10px] font-black uppercase text-white hover:text-zinc-300 flex items-center gap-1.5 transition-colors border border-white/5 px-3 py-1.5 rounded-lg bg-white/[0.03]"
                      >
                        Deep Dive <FiExternalLink size={12} />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all border ${
                          user.isActive
                            ? 'text-red-500 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                      >
                        {user.isActive ? 'Suspend' : 'Revive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {error ? (
                <tr>
                  <td colSpan={5}>
                    <ErrorState message={error} onRetry={() => fetchUsers(pagination.page)} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiAlertCircle className="text-sv-text-muted w-12 h-12" />
                      <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.3em] italic">No matching identities in registry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Global Pagination Hub */}
        <div className="px-8 py-6 border-t border-sv-border bg-sv-surface/5 flex items-center justify-between">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{filteredUsers.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Identities
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
