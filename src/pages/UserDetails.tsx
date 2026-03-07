import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, UserDetails as UserDetailsType } from '../api/admin.service';
import { 
  FiArrowLeft, FiShoppingCart, FiDollarSign, FiStar, FiCalendar,
  FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiLock, FiUnlock
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { Address } from '../api/admin.service';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getUserById(id!);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleVerificationUpdate = async (type: 'bvn' | 'nin' | 'voters', status: boolean) => {
    if (!user) return;
    try {
      const updateData = { [type]: status };
      const response = await adminService.updateUserVerification(user._id, updateData);
      setUser(prev => prev ? { ...prev, verification: response.data.verification } : null);
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  const handleUnlock = async () => {
    if (!user) return;
    if (confirm('Are you sure you want to unlock this user? This will reset their verification attempts.')) {
        try {
            const response = await adminService.updateUserVerification(user._id, { status: 'unverified' });
            setUser(prev => prev ? { ...prev, verification: response.data.verification } : null);
        } catch (error) {
            console.error('Failed to unlock user:', error);
        }
    }
  };

  const handleLegalHoldToggle = async () => {
    if (!user) return;
    
    if ((user as any).legalHold) {
       const { value: justification } = await Swal.fire({
          title: 'Remove Legal Hold',
          input: 'textarea',
          inputLabel: 'Justification for removing legal hold',
          inputPlaceholder: 'Mandatory NDPR justification...',
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value || value.length < 5) return 'Justification must be at least 5 characters!'
          }
       });

       if (justification) {
          try {
             await adminService.removeLegalHold(user._id, justification);
             Swal.fire('Success', 'Legal hold removed.', 'success');
             fetchUserDetails();
          } catch (err: any) { 
             Swal.fire('Error', err.response?.data?.message || 'Failed to remove legal hold', 'error');
          }
       }
    } else {
       const { value: reason } = await Swal.fire({
          title: 'Active Legal Hold',
          text: 'This will prevent the user from deleting their account or data.',
          input: 'textarea',
          inputLabel: 'Reason for legal hold',
          inputPlaceholder: 'Law enforcement request, internal investigation, etc.',
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value || value.length < 5) return 'Reason must be at least 5 characters!'
          }
       });

       if (reason) {
          try {
             await adminService.setLegalHold(user._id, reason);
             Swal.fire('Success', 'Account placed under legal hold.', 'success');
             fetchUserDetails();
          } catch (err: any) { 
             Swal.fire('Error', err.response?.data?.message || 'Failed to set legal hold', 'error');
          }
       }
    }
  };



  const handleImpersonate = async () => {
    if (!user) return;
    
    const { value: reason } = await Swal.fire({
      title: 'Initialize Impersonation',
      text: 'You are about to securely access this account. This action is audited.',
      input: 'textarea',
      inputLabel: 'Justification for impersonation',
      inputPlaceholder: 'Customer support, debugging, compliance investigation...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || value.length < 5) return 'Reason must be at least 5 characters!'
      }
    });

    if (reason) {
      try {
        const response = await adminService.impersonateUser(user._id, { reason });
        const { accessToken, user: impersonatedUser } = response.data;
        
        // Build the target URL for the storefront
        const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'https://shopvia.ng';
        const targetUrl = `${storefrontUrl}/auth/impersonate?accessToken=${accessToken}&user=${encodeURIComponent(JSON.stringify(impersonatedUser))}`;
        
        // Open in a new tab
        window.open(targetUrl, '_blank');
        Swal.fire('Session Initialized', 'Impersonation session opened in a new tab.', 'success');
      } catch (err: any) {
        Swal.fire('Security Error', err.response?.data?.message || 'Failed to initialize session', 'error');
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id, fetchUserDetails]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identity Not Found</h2>
          <Link to="/dashboard/users" className="text-zinc-500 hover:text-white mt-4 inline-block text-xs font-black uppercase tracking-widest transition-colors">
            ← Return to Registry
          </Link>
        </div>
      </div>
    );
  }

  const defaultAddress = user.addresses?.find(addr => addr.isDefault);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/users" 
          className="inline-flex items-center text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Users
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-widest">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <button
               onClick={handleImpersonate}
               className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
               <FiShield /> Login As
            </button>
            {(user as any).legalHold && (
               <div className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                  <FiLock /> Legal Hold Active
               </div>
            )}
            {user.verification?.status === 'locked' && (
                <button
                  onClick={handleUnlock}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 text-sm"
                >
                  <FiUnlock /> Unlock Account
                </button>
            )}
            <button
               onClick={handleLegalHoldToggle}
               className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold border ${
                  (user as any).legalHold 
                  ? 'bg-zinc-800 text-white border-white/10 hover:bg-zinc-700' 
                  : 'bg-transparent text-red-500 border-red-500/20 hover:bg-red-500/10'
               }`}
            >
               {(user as any).legalHold ? <FiUnlock /> : <FiLock />}
               {(user as any).legalHold ? 'Remove Legal Hold' : 'Place Legal Hold'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Orders</p>
              <p className="text-3xl font-black text-white mt-1">{user.orderStats?.totalOrders || 0}</p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiShoppingCart className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Spent</p>
              <p className="text-3xl font-black text-white mt-1">
                ₦{(user.orderStats?.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiDollarSign className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reviews</p>
              <p className="text-3xl font-black text-white mt-1">{user.reviewStats?.totalReviews || 0}</p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiStar className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Account Age</p>
              <p className="text-3xl font-black text-white mt-1">{user.accountAge}d</p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiCalendar className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Information */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Identity Profile</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <FiUser className="text-zinc-500" />
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Legal Name</p>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-zinc-500" />
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-zinc-500" />
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-white">{user.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiCalendar className="text-zinc-500" />
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Joined On</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {defaultAddress && (
              <div className="mt-6 pt-6 border-t border-zinc-800/60">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-zinc-500 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Primary Shipping</p>
                    <p className="text-sm font-bold text-white">
                      {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.state}, {defaultAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          {user.recentOrders && user.recentOrders.length > 0 && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Recent Activity</h2>
              <div className="space-y-2">
                {user.recentOrders.map((order: any) => (
                  <div key={order._id} className="p-4 border border-zinc-800/40 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5">
                            <FiShoppingCart className="text-zinc-500" size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-widest">Order #{order._id.slice(-6)}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                                {order.store?.name || 'Unknown Store'} • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white tracking-tight">₦{order.totalAmount.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase rounded-full mt-1 ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {user.recentReviews && user.recentReviews.length > 0 && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Feedback Archive</h2>
              <div className="space-y-3">
                {user.recentReviews.map((review: any) => (
                  <div key={review._id} className="p-4 border border-zinc-800/40 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        <FiStar className="text-amber-500" size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-white uppercase tracking-widest">{review.product?.name}</p>
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-2 font-medium line-clamp-2">{review.comment}</p>
                        <p className="text-[9px] text-zinc-600 font-black uppercase mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints */}
          {user.complaints && user.complaints.length > 0 && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Grievance Ledger</h2>
              <div className="space-y-3">
                {user.complaints.map((complaint: any) => (
                  <div key={complaint._id} className="p-4 border border-zinc-800/40 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p className="font-black text-white text-xs uppercase tracking-widest">{complaint.title}</p>
                        <p className="text-xs text-zinc-500 font-medium mt-1.5 line-clamp-2">{complaint.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded border shrink-0 ${
                        complaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        complaint.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-3">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Account Status */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Security Context</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Access Role</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border ${
                  user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                  user.role === 'VENDORS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active State</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                  user.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {user.isActive ? <FiCheckCircle className="mr-1.5" /> : <FiXCircle className="mr-1.5" />}
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">KYC Verification</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                  user.verification?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  user.verification?.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  user.verification?.status === 'locked' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                }`}>
                  {user.verification?.status === 'verified' && <FiCheckCircle className="mr-1.5" />}
                  {user.verification?.status === 'pending' && <FiShield className="mr-1.5 animate-pulse" />} 
                  {user.verification?.status === 'locked' && <FiLock className="mr-1.5" />}
                  {user.verification?.status || 'unverified'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Identity</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                  user.isVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {user.isVerified ? <FiCheckCircle className="mr-1.5" /> : <FiXCircle className="mr-1.5" />}
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              {user.verification && (
                <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest mb-2 opacity-50">Government Attestations</p>
                  
                  <div className="flex justify-between items-center bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800/40">
                    <div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">BVN</span>
                      <span className="font-bold text-white text-xs">
                        {user.governmentId?.bvn || 'NOT PROVIDED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black uppercase ${user.verification.bvnVerified ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {user.verification.bvnVerified && '✓ Trusted'}
                      </span>
                      {!user.verification.bvnVerified && user.governmentId?.bvn && (
                        <button 
                          onClick={() => handleVerificationUpdate('bvn', true)}
                          className="text-[9px] font-black uppercase px-2 py-1 bg-white text-black rounded hover:bg-zinc-200 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800/40">
                    <div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">NIN</span>
                      <span className="font-bold text-white text-xs">
                        {user.governmentId?.nin || 'NOT PROVIDED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase ${user.verification.ninVerified ? 'text-emerald-500' : 'text-zinc-600'}`}>
                         {user.verification.ninVerified && '✓ Trusted'}
                      </span>
                      {!user.verification.ninVerified && user.governmentId?.nin && (
                        <button 
                          onClick={() => handleVerificationUpdate('nin', true)}
                          className="text-[9px] font-black uppercase px-2 py-1 bg-white text-black rounded hover:bg-zinc-200 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800/40">
                    <div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Voter's Card</span>
                      <span className="font-bold text-white text-xs">
                        {user.governmentId?.votersCard || 'NOT PROVIDED'}
                      </span>
                    </div>
                     <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase ${user.verification.votersVerified ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        {user.verification.votersVerified && '✓ Trusted'}
                      </span>
                      {!user.verification.votersVerified && user.governmentId?.votersCard && (
                        <button 
                          onClick={() => handleVerificationUpdate('voters', true)}
                          className="text-[9px] font-black uppercase px-2 py-1 bg-white text-black rounded hover:bg-zinc-200 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Execution Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Account Age</span>
                <span className="text-sm font-black text-white">{user.accountAge} Cycles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gross Volume</span>
                <span className="text-sm font-black text-white">₦{(user.orderStats?.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fulfillment Rate</span>
                <span className="text-sm font-black text-emerald-500">
                    {user.orderStats?.totalOrders ? Math.round((user.orderStats.completedOrders / user.orderStats.totalOrders) * 100) : 0}%
                </span>
              </div>
              {user.reviewStats && user.reviewStats.totalReviews > 0 && (
                <div className="pt-4 border-t border-zinc-800/60">
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reputation Score</span>
                        <span className="text-sm font-black text-amber-500">
                        {user.reviewStats.averageRating.toFixed(1)}/5.0
                        </span>
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Logistic Hubs</h2>
              <div className="space-y-3">
                {user.addresses.map((address: Address, index: number) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border ${
                      address.isDefault 
                        ? 'bg-zinc-800/50 border-white/20' 
                        : 'bg-zinc-800/20 border-zinc-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entry #{index + 1}</p>
                        {address.isDefault && (
                        <span className="text-[9px] font-black text-white bg-zinc-700 px-2 py-0.5 rounded uppercase tracking-widest">
                            Primary
                        </span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-white mb-1">
                      {address.street}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium lowercase">
                      {address.city}, {address.state} • {address.country}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
