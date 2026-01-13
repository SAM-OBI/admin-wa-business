import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, VendorDetails as VendorDetailsType } from '../api/admin.service';
import { 
  FiArrowLeft, FiShield, FiPackage, FiShoppingCart, FiDollarSign, 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiUser, FiMail, FiPhone,
  FiCalendar, FiAlertTriangle, FiExternalLink
} from 'react-icons/fi';

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showId, setShowId] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
    }
  }, [id, fetchVendorDetails]);

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
    let reason;
    if (status === 'rejected') {
      reason = prompt('Enter reason for rejection:');
      if (!reason) return;
    }
    try {
      await adminService.updateVendorVerification(id!, status, reason);
      fetchVendorDetails();
    } catch (error) {
      console.error('Failed to update verification:', error);
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/vendors" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Vendors
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{vendor.name}</h1>
            <p className="text-gray-500 mt-1">{vendor.email}</p>
          </div>
          
          <div className="flex gap-2">
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Suspend Vendor
              </button>
            ) : (
              <button
                onClick={handleActivate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Activate Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{vendor.productCount || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{vendor.orderStats?.totalOrders || 0}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₦{(vendor.orderStats?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Risk Score</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{vendor.riskProfile?.score || 0}/100</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiShield className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{vendor.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{vendor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{vendor.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiCalendar className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-800">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Information */}
          {vendor.store && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Store Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Store Name</p>
                  <p className="font-medium text-gray-800">{vendor.store.storeName}</p>
                </div>
                {vendor.store.storeDescription && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700">{vendor.store.storeDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Profile */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Risk Profile</h2>
              {getRiskBadge()}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Risk Score</span>
                <span className="font-bold">{vendor.riskProfile?.score || 0}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (vendor.riskProfile?.score || 0) < 30 ? 'bg-green-600' :
                    (vendor.riskProfile?.score || 0) < 70 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${vendor.riskProfile?.score || 0}%` }}
                ></div>
              </div>
            </div>

            {vendor.riskProfile?.flags && vendor.riskProfile.flags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Risk Flags</h3>
                <div className="space-y-2">
                  {vendor.riskProfile.flags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <FiAlertTriangle className="text-red-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">{flag.type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-red-700">{flag.description}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(flag.date).toLocaleDateString()}
                          {flag.resolved && <span className="ml-2 text-green-600">✓ Resolved</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Complaints */}
          {vendor.recentComplaints && vendor.recentComplaints.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Complaints</h2>
              <div className="space-y-3">
                {vendor.recentComplaints.map((complaint: any) => (
                  <div key={complaint._id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{complaint.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Status</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.isActive ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                  {vendor.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verification</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  vendor.verification?.status === 'verified' ? 'bg-green-100 text-green-700' :
                  vendor.verification?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  vendor.verification?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  vendor.verification?.status === 'locked' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {vendor.verification?.status === 'verified' && <FiCheckCircle className="mr-1" />}
                  {vendor.verification?.status === 'pending' && <FiAlertCircle className="mr-1" />}
                  {vendor.verification?.status === 'rejected' && <FiXCircle className="mr-1" />}
                  {vendor.verification?.status === 'locked' && <FiShield className="mr-1" />}
                  {vendor.verification?.status || 'unverified'}
                </span>
              </div>

              {/* Government ID Section */}
              {vendor.verification?.status !== 'unverified' && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Government ID ({vendor.verification?.method || 'N/A'})</p>
                  
                  {vendor.verification?.idNumber && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium font-mono text-sm">
                        {showId ? vendor.verification.idNumber : '•'.repeat(Math.min(vendor.verification.idNumber.length, 10))}
                        </span>
                        <button 
                        onClick={() => setShowId(!showId)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                        {showId ? 'Hide' : 'View'}
                        </button>
                    </div>
                  )}

                  {/* ID Document Link */}
                  {(vendor.verification?.documentUrl || (vendor as any).governmentIdUrl) && (
                    <div className="mt-2">
                      <a 
                        href={vendor.verification?.documentUrl || (vendor as any).governmentIdUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                         <FiExternalLink size={14} /> View Document
                      </a>
                    </div>
                  )}
                </div>
              )}

              {!vendor.isActive && vendor.accountStatus?.reason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Suspension Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{vendor.accountStatus.reason}</p>
                  {vendor.accountStatus.suspendedAt && (
                    <p className="text-xs text-red-600 mt-2">
                      Suspended on {new Date(vendor.accountStatus.suspendedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {vendor.verification?.status === 'rejected' && vendor.verification.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{vendor.verification.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Subscription Plan</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Plan</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  vendor.subscription?.plan === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                  vendor.subscription?.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                  vendor.subscription?.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {vendor.subscription?.plan?.toUpperCase() || 'FREE'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  vendor.subscription?.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.subscription?.status || 'inactive'}
                </span>
              </div>

              {vendor.subscription?.productUsage !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Product Usage</span>
                    <span className="font-bold text-gray-800">
                      {vendor.subscription.productUsage} / {
                        vendor.subscription.plan === 'gold' ? '∞' :
                        vendor.subscription.plan === 'premium' ? '100+' :
                        vendor.subscription.plan === 'basic' ? '50' :
                        '10'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        vendor.subscription.plan === 'gold' ? 'bg-yellow-600' :
                        vendor.subscription.plan === 'premium' ? 'bg-purple-600' :
                        vendor.subscription.plan === 'basic' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}
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

              {vendor.subscription?.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="text-gray-800 font-medium">
                    {new Date(vendor.subscription.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {vendor.subscription?.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-800 font-medium">
                    {new Date(vendor.subscription.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {vendor.subscription?.autoRenew !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-600">Auto-Renew</span>
                  <span className={`text-sm font-semibold ${
                    vendor.subscription.autoRenew ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {vendor.subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-bold text-gray-800">{vendor.orderStats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-bold text-green-600">{vendor.orderStats?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold text-gray-800">
                  ₦{(vendor.orderStats?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-bold text-blue-600">
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
