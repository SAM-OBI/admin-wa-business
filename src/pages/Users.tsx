import { useEffect, useState, useCallback } from 'react';
import { adminService, User } from '../api/admin.service';
import { FiCheckCircle, FiXCircle, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { HardenedSearchInput } from '../components/search/HardenedSearchInput';
import { ErrorState } from '../components/ErrorState';
import { logger } from '../utils/logger';
import { Link } from 'react-router-dom';
import { showError } from '../utils/swal';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
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
    if (togglingUserId) return;
    const verb = user.isActive ? 'suspend' : 'revive';
    if (!window.confirm(`Are you sure you want to ${verb} ${user.name || user.email}?`)) return;

    setTogglingUserId(user._id);
    try {
      await adminService.toggleUserStatus(user._id, user.isActive);
      // Optimistic update
      setUsers(users.map(u =>
        u._id === user._id ? { ...u, isActive: !u.isActive } : u
      ));
    } catch (error: any) {
      logger.error('Failed to update user status:', error);
      showError(error.response?.data?.message || `Failed to ${verb} user`);
      fetchUsers(pagination.page);
    } finally {
      setTogglingUserId(null);
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sv-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary tracking-tight uppercase">Registry Oversight</h1>
          <p className="text-sv-text-muted font-medium mt-1 uppercase text-xs tracking-[0.2em]">Platform Identity & Access Governance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="USERS">Users</option>
              <option value="VENDORS">Vendors</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-sv-surface-muted border border-sv-border text-sv-text-secondary text-xs font-black uppercase tracking-widest rounded-xl focus:outline-none focus:border-sv-primary transition-all cursor-pointer"
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

      <div className="bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-sv-border bg-sv-surface-muted/50">
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Identity Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Authorization</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Trust Signal</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Access State</th>
                <th className="px-6 py-4 text-[10px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-sv-surface-muted/60 transition-colors group">
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase rounded border ${
                      user.role === 'ADMIN' ? 'bg-sv-tag-soft text-sv-tag border-sv-tag/20' :
                      user.role === 'VENDORS' ? 'bg-sv-info-soft text-sv-info border-sv-info/30' :
                      'bg-sv-surface-muted text-sv-text-secondary border-sv-border'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getVerificationBadge(user.verification)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-sv-success' : 'bg-sv-danger'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'text-sv-success' : 'text-sv-danger'}`}>
                        {user.isActive ? 'Active' : 'Halted'}
                      </span>
                    </div>
                    <div className="text-[9px] text-sv-text-muted font-black uppercase mt-1 tracking-tighter">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/dashboard/users/${user._id}`}
                        className="text-[10px] font-black uppercase text-sv-text-primary hover:text-sv-primary flex items-center gap-1.5 transition-colors border border-sv-border px-3 py-1.5 rounded-lg bg-sv-surface-muted"
                      >
                        Deep Dive <FiExternalLink size={12} />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingUserId === user._id}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.isActive
                            ? 'text-sv-danger border-sv-danger/30 hover:bg-sv-danger-soft'
                            : 'text-sv-success border-sv-success/30 hover:bg-sv-success-soft'
                        }`}
                      >
                        {togglingUserId === user._id ? '...' : (user.isActive ? 'Suspend' : 'Revive')}
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
                  <td colSpan={5} className="px-6 py-16 text-center">
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
        <div className="px-6 py-4 border-t border-sv-border bg-sv-surface-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">
            Registry Index <span className="text-sv-text-primary mx-1">{filteredUsers.length}</span> of <span className="text-sv-text-primary mx-1">{pagination.total}</span> Identities
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              PREV
            </button>
            <span className="text-[10px] font-black text-sv-text-secondary uppercase tracking-widest bg-sv-surface-muted px-3 py-1.5 rounded-md border border-sv-border">
               SEGMENT {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 border border-sv-border rounded-lg text-sv-text-primary disabled:opacity-20 disabled:cursor-not-allowed hover:bg-sv-surface-muted transition-all text-xs font-bold"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
