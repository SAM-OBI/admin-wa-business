import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, VendorDetails as VendorDetailsType } from '../api/admin.service';
import { 
  FiArrowLeft, FiShield, FiPackage, FiShoppingCart, FiDollarSign, 
  FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone,
  FiCalendar, FiAlertTriangle, FiExternalLink, FiFileText, FiClock
} from 'react-icons/fi';

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showId, setShowId] = useState(false);
  const [trustHistory, setTrustHistory] = useState<any[]>([]);
  const [trustLoading, setTrustLoading] = useState(false);

  const fetchVendorDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getVendorById(id!);
      setVendor(response.data);
    } catch (error) {
      console.error('Failed to fetch vendor details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTrustHistory = useCallback(async () => {
    setTrustLoading(true);
    try {
      const response = await adminService.getVendorTrustHistory(id!);
      setTrustHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch trust history:', error);
    } finally {
      setTrustLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
      fetchTrustHistory();
    }
  }, [id, fetchVendorDetails, fetchTrustHistory]);

  const handleTrustOverride = async () => {
    const newScoreStr = prompt('Enter new trust score (0-100):');
    if (newScoreStr === null) return;
    const newScore = parseInt(newScoreStr);
    if (isNaN(newScore) || newScore < 0 || newScore > 100) {
      alert('Invalid score');
      return;
    }
    const reason = prompt('Enter reason for internal history:');
    if (!reason) return;
    const justification = prompt('Enter mandatory justification for policy audit:');
    if (!justification) return;

    try {
      await adminService.overrideVendorTrust(id!, { newScore, reason, justification });
      fetchVendorDetails();
      fetchTrustHistory();
    } catch (error) {
      console.error('Trust override failed:', error);
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;
    try {
      await adminService.suspendVendor(id!, reason);
      fetchVendorDetails();
    } catch (error) {
      console.error('Failed to suspend vendor:', error);
    }
  };

  const handleActivate = async () => {
    try {
      await adminService.activateVendor(id!);
      fetchVendorDetails();
    } catch (error) {
      console.error('Failed to activate vendor:', error);
    }
  };

  const handleVerification = async (status: 'verified' | 'rejected' | 'unverified') => {
    const reason = status === 'rejected' ? (prompt('Enter reason for rejection:') || undefined) : undefined;
    if (status === 'rejected' && !reason) return;
    try {
      await adminService.updateVendorVerification(id!, status, reason);
      fetchVendorDetails();
    } catch (error) {
      console.error('Failed to update verification:', error);
    }
  };

  const handleImpersonate = async () => {
    if (!vendor) return;
    
    const reason = prompt('Enter mandatory justification for impersonating this vendor:');
    if (!reason || reason.length < 5) {
      alert('A valid justification (min 5 chars) is required for audit.');
      return;
    }

    try {
      const response = await adminService.impersonateUser(vendor._id, { 
        reason, 
        targetRole: 'VENDORS' 
      });
      const { accessToken, user: impersonatedUser } = response.data;
      
      const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'https://shopvia.ng';
      const targetUrl = `${storefrontUrl}/auth/impersonate?accessToken=${accessToken}&user=${encodeURIComponent(JSON.stringify(impersonatedUser))}`;
      
      window.open(targetUrl, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize session');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Vendor not found</h2>
          <Link to="/vendors" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  const getRiskBadge = () => {
    const level = vendor.riskProfile?.level || 'low';
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[level]}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/vendors" 
          className="inline-flex items-center text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Vendors
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{vendor.name}</h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-widest">{vendor.email}</p>
          </div>
          
          <div className="flex gap-3">
            <button
               onClick={handleImpersonate}
               className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
               <FiShield /> Login As
            </button>
            {vendor.verification?.status === 'pending' && (
              <>
                <button
                  onClick={() => handleVerification('verified')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Approve Verification
                </button>
                <button
                  onClick={() => handleVerification('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reject Verification
                </button>
              </>
            )}
            {vendor.verification?.status === 'locked' && (
              <button
                onClick={() => handleVerification('unverified')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
              >
                <FiShield /> Unlock Account
              </button>
            )}
            {vendor.isActive ? (
              <button
                onClick={handleSuspend}
                className="px-4 py-2 bg-transparent text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition text-sm font-bold"
              >
                Suspend Vendor
              </button>
            ) : (
              <button
                onClick={handleActivate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Activate Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inventory</p>
              <p className="text-3xl font-black text-white mt-1">{vendor.productCount || 0}</p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiPackage className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Orders</p>
              <p className="text-3xl font-black text-white mt-1">{vendor.orderStats?.totalOrders || 0}</p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiShoppingCart className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gross Volume</p>
              <p className="text-3xl font-black text-white mt-1">
                ₦{(vendor.orderStats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <FiDollarSign className="text-zinc-400" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Activity</p>
              <p className="text-3xl font-black text-white mt-1">{vendor.activityScore || 0}</p>
              <p className="text-[8px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">Growth Pts</p>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
              <FiCheckCircle size={18} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-red-500/50 uppercase tracking-widest">Journal</p>
              <p className="text-3xl font-black text-white mt-1">{vendor.blogCount || 0}</p>
              <p className="text-[8px] text-red-500 font-bold uppercase tracking-[0.2em] mt-1">{vendor.flaggedBlogReports || 0} Flags Pending</p>
            </div>
            <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 text-red-400">
              <FiFileText size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 tracking-tight">Vendor Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
                   <FiUser className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Signatory</p>
                  <p className="font-bold text-white text-sm">{vendor.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
                   <FiMail className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Digital Contact</p>
                  <p className="font-bold text-white text-sm">{vendor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
                   <FiPhone className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Voice Link</p>
                  <p className="font-bold text-white text-sm">{vendor.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/5">
                   <FiCalendar className="text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Intake</p>
                  <p className="font-bold text-white text-sm">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Viral Distribution & Growth */}
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-white/5 transition-all" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-lg tracking-tight uppercase">Distribution Metrics</h3>
                {vendor.isFeatured && (
                   <span className="px-3 py-1 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3" /> Featured Verified
                   </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Viral Views</p>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-white">{vendor.store?.analytics?.totalViralViews || 0}</span>
                       <span className="text-[10px] font-black text-zinc-600 uppercase mb-1">Organic</span>
                    </div>
                 </div>

                 <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Social Velocity</p>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-white">{vendor.store?.analytics?.totalSocialShares || 0}</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase mb-1">High</span>
                    </div>
                 </div>
              </div>

              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Reputation Progress</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{vendor.activityScore || 0} / { (vendor.sellerLevel || 1) * 1000} XP</span>
                 </div>
                 <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-white transition-all duration-1000"
                      style={{ width: `${Math.min(((vendor.activityScore || 0) / ((vendor.sellerLevel || 1) * 1000)) * 100, 100)}%` }}
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* Store Information */}
          {vendor.store && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Store Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Store Registry</p>
                    <p className="font-bold text-white text-md">{vendor.store.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Platform Slug</p>
                    <p className="font-mono text-xs text-zinc-400 font-bold bg-zinc-800/50 px-2.5 py-1 rounded w-fit border border-white/5">{vendor.store.slug}</p>
                  </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Bonus Capabilities</p>
                   <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 border border-white/5 rounded text-[10px] font-black uppercase tracking-tighter">
                         +{vendor.store.bonusProductSlots || 0} Product Slots
                      </span>
                      {vendor.store.isFeatured && (
                        <span className="px-2.5 py-1 bg-white text-black rounded text-[10px] font-black uppercase tracking-tighter">
                           Priority Discoverability
                        </span>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Profile */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Threat Assessment</h2>
              {getRiskBadge()}
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                <span>Risk Index</span>
                <span className="text-white">{vendor.riskProfile?.score || 0}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 border border-white/5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (vendor.riskProfile?.score || 0) < 30 ? 'bg-emerald-500' :
                    (vendor.riskProfile?.score || 0) < 70 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${vendor.riskProfile?.score || 0}%` }}
                ></div>
              </div>
            </div>

            {vendor.riskProfile?.flags && vendor.riskProfile.flags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Anomalies Detected</h3>
                <div className="space-y-2">
                  {vendor.riskProfile.flags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <FiAlertTriangle className="text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase tracking-tight">{flag.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-zinc-400 mt-1">{flag.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{new Date(flag.date).toLocaleDateString()}</span>
                           {flag.resolved && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Resolved</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Journal Oversight (Phase 19) */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-black text-white uppercase tracking-widest tracking-tight">Recent Journal Articles</h2>
               <Link 
                 to="/dashboard/journal" 
                 className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-white/5 px-2 py-1 rounded"
               >
                 View All Hub
               </Link>
            </div>

            <div className="space-y-3">
               {vendor.recentBlogs && vendor.recentBlogs.length > 0 ? (
                 vendor.recentBlogs.map((blog: any) => (
                   <div key={blog._id} className="p-4 bg-zinc-800/20 border border-white/5 rounded-xl hover:border-zinc-700 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                           {blog.coverImage ? (
                             <img src={blog.coverImage} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-700">
                               <FiFileText size={16} />
                             </div>
                           )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[200px]">{blog.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className={`text-[8px] font-black uppercase tracking-widest ${blog.status === 'published' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                               {blog.status}
                             </span>
                             <span className="text-[8px] font-black text-zinc-700 uppercase">|</span>
                             <div className="flex items-center gap-1 text-[8px] font-black text-zinc-600 uppercase">
                               <FiClock size={10} />
                               {new Date(blog.createdAt).toLocaleDateString()}
                             </div>
                          </div>
                        </div>
                     </div>

                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                           onClick={async () => {
                             const reason = prompt('Reason for moderation:');
                             if (!reason) return;
                             try {
                               await adminService.moderateBlog(blog._id, { status: blog.status === 'published' ? 'removed' : 'published', reason });
                               fetchVendorDetails();
                             } catch { alert('Action failed'); }
                           }}
                           className="p-1.5 bg-black border border-white/5 rounded-md hover:border-red-500/50 hover:text-red-500 text-zinc-500"
                        >
                           <FiXCircle size={14} />
                        </button>
                        <a 
                          href={`https://shopvia.com/blog/${blog.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 bg-black border border-white/5 rounded-md hover:border-white hover:text-white text-zinc-500"
                        >
                           <FiExternalLink size={14} />
                        </a>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="py-6 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest italic border border-zinc-800/30 rounded-xl bg-black/20">
                    No articles published yet.
                 </div>
               )}
            </div>
          </div>

          {/* Trust & Reputation Oversight */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">Reputation Matrix</h2>
              <button 
                onClick={handleTrustOverride}
                className="text-[9px] font-black uppercase px-2 py-1 bg-zinc-800 text-zinc-500 hover:text-white rounded border border-white/5 transition-colors"
              >
                Manual Override
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score Index</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{vendor.reputation?.score ?? 50}</span>
                  <span className="text-[10px] font-black text-zinc-600 mb-1 uppercase">Aggregate</span>
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status Class</p>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-black ${
                     vendor.reputation?.level === 'excellent' ? 'text-emerald-500' : 
                     vendor.reputation?.level === 'high' ? 'text-white' :
                     vendor.reputation?.level === 'medium' ? 'text-zinc-400' :
                     'text-red-500'
                  }`}>
                    {vendor.reputation?.level === 'excellent' ? 'A+' : 
                     vendor.reputation?.level === 'high' ? 'A' :
                     vendor.reputation?.level === 'medium' ? 'B' :
                     vendor.reputation?.level === 'low' ? 'C' : 'N'}
                  </span>
                  <span className="text-[10px] font-black text-zinc-600 uppercase">
                    {vendor.reputation?.level || 'NEW'}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Reputation Delta Log</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {trustLoading ? (
                <div className="text-center py-4 text-zinc-500 text-[10px] font-black uppercase italic">Retrieving logs...</div>
              ) : trustHistory.length > 0 ? (
                trustHistory.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 bg-zinc-800/30 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{log.triggerEvent?.replace(/_/g, ' ') || 'SYSTEM RECALC'}</span>
                      <span className="text-[9px] font-black text-zinc-600 uppercase">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{log.reason}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded">{log.previousScore}</span>
                      <span className="text-zinc-600">→</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${log.newScore > log.previousScore ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {log.newScore}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-zinc-600 text-[10px] font-black uppercase italic">No reputation shifts detected.</div>
              )}
            </div>
          </div>

          {/* Internal Friction Logs (Complaints) */}
          {vendor.recentComplaints && vendor.recentComplaints.length > 0 && (
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
              <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Internal Friction Logs</h2>
              <div className="space-y-3">
                {vendor.recentComplaints.map((complaint: any) => (
                  <div key={complaint._id} className="p-4 bg-zinc-800/30 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{complaint.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">{complaint.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded border ${
                        complaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        complaint.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-3">
                      Logged: {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Access Protocol */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 tracking-tight">Access Protocol</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-800/30 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                  vendor.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {vendor.isActive ? <FiCheckCircle className="mr-1.5" /> : <FiXCircle className="mr-1.5" />}
                  {vendor.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-zinc-800/30 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                  vendor.verification?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  vendor.verification?.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  vendor.verification?.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  vendor.verification?.status === 'locked' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {vendor.verification?.status === 'verified' && <FiCheckCircle className="mr-1.5" />}
                  {(vendor.verification?.status === 'pending' || vendor.verification?.status === 'locked') && <FiShield className="mr-1.5" />}
                  {(vendor.verification?.status === 'rejected' || vendor.verification?.status === 'failed') && <FiXCircle className="mr-1.5" />}
                  {vendor.verification?.status || 'unverified'}
                </span>
              </div>

              {vendor.verification?.manualReviewDeadline && (
                <div className={`mt-4 p-4 rounded-xl border ${
                  vendor.verification.slaStatus === 'BREACHED' ? 'bg-red-500/10 border-red-500/20' :
                  vendor.verification.slaStatus === 'URGENT' ? 'bg-orange-500/10 border-orange-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SLA Accountability</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      vendor.verification.slaStatus === 'BREACHED' ? 'bg-red-600 text-white' :
                      vendor.verification.slaStatus === 'URGENT' ? 'bg-orange-500 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {vendor.verification.slaStatus}
                    </span>
                  </div>
                  <p className="text-xs text-white font-bold">
                    Deadline: {new Date(vendor.verification.manualReviewDeadline).toLocaleString()}
                  </p>
                  {vendor.verification.assignedAdminId && (
                    <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tight">
                      Handler ID: {vendor.verification.assignedAdminId}
                    </p>
                  )}
                </div>
              )}

              {vendor.verification?.status === 'locked' && (
                <div className="mt-2 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Security Lockout</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    System locked after {vendor.verification.attempts || 5} unauthorized verification cycles.
                  </p>
                </div>
              )}

              {vendor.verification?.status !== 'unverified' && (
                <div className="pt-4 border-t border-zinc-800/60">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Identification Proof</p>
                  
                  <div className="flex justify-between items-center bg-zinc-800/20 p-2.5 rounded-lg border border-white/5">
                     <span className="text-zinc-400 font-mono text-xs font-bold">
                        {showId ? vendor.verification?.idNumber : '••••••••••••'}
                     </span>
                     <button 
                        onClick={() => setShowId(!showId)}
                        className="text-[9px] font-black uppercase px-2 py-1 bg-zinc-800 text-zinc-400 rounded hover:text-white transition-colors"
                     >
                        {showId ? 'Mask' : 'Decipher'}
                     </button>
                  </div>

                  {(vendor.verification?.documentUrl || (vendor as any).governmentIdUrl) && (
                    <div className="mt-3">
                      <a 
                        href={vendor.verification?.documentUrl || (vendor as any).governmentIdUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-white hover:text-zinc-300 uppercase tracking-widest transition-colors"
                      >
                         <FiExternalLink size={14} /> View Document
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Subscription */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 tracking-tight">Active Plan</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Service Tier</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                  vendor.subscription?.plan === 'gold' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                  vendor.subscription?.plan === 'premium' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                  vendor.subscription?.plan === 'basic' ? 'bg-white/10 text-white border-white/20' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {vendor.subscription?.plan?.toUpperCase() || 'FREE'}
                </span>
              </div>

              {vendor.subscription?.productUsage !== undefined && (
                <div>
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    <span>Quota Consumption</span>
                    <span className="text-white">
                      {vendor.subscription.productUsage} / {
                        vendor.subscription.plan === 'gold' ? 'INFINITE' :
                        vendor.subscription.plan === 'premium' ? '100+' :
                        vendor.subscription.plan === 'basic' ? '50' : '10'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 border border-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500"
                      style={{ 
                        width: `${Math.min(
                          vendor.subscription.plan === 'gold' ? 100 :
                          vendor.subscription.plan === 'premium' ? (vendor.subscription.productUsage / 100) * 100 :
                          vendor.subscription.plan === 'basic' ? (vendor.subscription.productUsage / 50) * 100 :
                          (vendor.subscription.productUsage / 10) * 100,
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                   <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Cycle Activation</p>
                   <p className="text-xs font-bold text-white italic">{vendor.subscription?.startDate ? new Date(vendor.subscription.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                   <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Cycle Expiry</p>
                   <p className="text-xs font-bold text-zinc-400 italic">{vendor.subscription?.endDate ? new Date(vendor.subscription.endDate).toLocaleDateString() : 'FOREVER'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Metrics */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/40 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 tracking-tight">Execution Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Order Volume</span>
                <span className="text-sm font-black text-white">{vendor.orderStats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Successful Terminations</span>
                <span className="text-sm font-black text-emerald-500">{vendor.orderStats?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gross Revenue (NGN)</span>
                <span className="text-sm font-black text-white">
                  ₦{(vendor.orderStats?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-4 border-t border-zinc-800/60">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fulfillment Reliability</span>
                <span className="text-sm font-black text-white">
                  {vendor.orderStats?.totalOrders 
                    ? Math.round((vendor.orderStats.completedOrders / vendor.orderStats.totalOrders) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
