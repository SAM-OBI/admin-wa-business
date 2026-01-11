import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, UserDetails as UserDetailsType } from '../api/admin.service';
import { 
  FiArrowLeft, FiShoppingCart, FiDollarSign, FiStar, FiCalendar,
  FiCheckCircle, FiXCircle, FiUser, FiMail, FiPhone, FiMapPin
} from 'react-icons/fi';

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
      const updatedUser = await adminService.updateUserVerification(user._id, updateData);
      setUser(prev => prev ? { ...prev, verification: updatedUser.verification } : null);
    } catch (error) {
      console.error('Failed to update verification:', error);
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
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">User not found</h2>
          <Link to="/users" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const defaultAddress = user.addresses?.find(addr => addr.isDefault);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/users" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Users
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{user.orderStats?.totalOrders || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₦{(user.orderStats?.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reviews Written</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{user.reviewStats?.totalReviews || 0}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiStar className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Account Age</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{user.accountAge} days</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="text-purple-600" size={24} />
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
                  <p className="font-medium text-gray-800">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{user.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiCalendar className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium text-gray-800">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {defaultAddress && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Default Address</p>
                    <p className="font-medium text-gray-800">
                      {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.state}, {defaultAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          {user.recentOrders && user.recentOrders.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {user.recentOrders.map((order: any) => (
                  <div key={order._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">Order #{order._id.slice(-6)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.store?.name || 'Unknown Store'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">₦{order.totalAmount.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Reviews</h2>
              <div className="space-y-3">
                {user.recentReviews.map((review: any) => (
                  <div key={review._id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiStar className="text-yellow-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800">{review.product?.name}</p>
                          <span className="text-sm font-semibold text-yellow-600">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Complaints Filed</h2>
              <div className="space-y-3">
                {user.complaints.map((complaint: any) => (
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
                <span className="text-gray-600">Role</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'VENDORS' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Status</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email Verified</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.isVerified ? <FiCheckCircle className="mr-1" /> : <FiXCircle className="mr-1" />}
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              {user.verification && (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-600 text-sm">BVN</span>
                    <div className="flex items-center gap-2">
                       <span className={`text-xs ${user.verification.bvnVerified ? 'text-green-600' : 'text-gray-400'}`}>
                        {user.verification.bvnVerified ? '✓ Verified' : 'Not verified'}
                      </span>
                      {!user.verification.bvnVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('bvn', true)}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Verify
                        </button>
                      )}
                      {user.verification.bvnVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('bvn', false)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">NIN</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${user.verification.ninVerified ? 'text-green-600' : 'text-gray-400'}`}>
                        {user.verification.ninVerified ? '✓ Verified' : 'Not verified'}
                      </span>
                      {!user.verification.ninVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('nin', true)}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Verify
                        </button>
                      )}
                       {user.verification.ninVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('nin', false)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Voter's Card</span>
                     <div className="flex items-center gap-2">
                      <span className={`text-xs ${user.verification.votersVerified ? 'text-green-600' : 'text-gray-400'}`}>
                        {user.verification.votersVerified ? '✓ Verified' : 'Not verified'}
                      </span>
                      {!user.verification.votersVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('voters', true)}
                          className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          Verify
                        </button>
                      )}
                       {user.verification.votersVerified && (
                        <button 
                          onClick={() => handleVerificationUpdate('voters', false)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Activity Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Age</span>
                <span className="font-bold text-gray-800">{user.accountAge} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-bold text-gray-800">{user.orderStats?.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Orders</span>
                <span className="font-bold text-green-600">{user.orderStats?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-bold text-gray-800">
                  ₦{(user.orderStats?.totalSpent || 0).toLocaleString()}
                </span>
              </div>
              {user.reviewStats && user.reviewStats.totalReviews > 0 && (
                <>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Reviews Written</span>
                    <span className="font-bold text-gray-800">{user.reviewStats.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Rating Given</span>
                    <span className="font-bold text-yellow-600">
                      {user.reviewStats.averageRating.toFixed(1)}/5
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Addresses</h2>
              <div className="space-y-3">
                {user.addresses.map((address, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      address.isDefault 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50'
                    }`}
                  >
                    {address.isDefault && (
                      <span className="text-xs font-semibold text-blue-600 mb-1 block">
                        DEFAULT
                      </span>
                    )}
                    <p className="text-sm text-gray-700">
                      {address.street}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.country}
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
