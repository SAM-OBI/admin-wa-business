import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { FiBell, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { Link } from 'react-router-dom';

export default function Header() {
  const { admin, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const stats = await adminService.getDashboardStats();
      const newNotifications = [];
      
      if (stats.pendingComplaints > 0) {
        newNotifications.push({
          type: 'complaint',
          message: `${stats.pendingComplaints} pending complaints`,
          link: '/complaints',
          count: stats.pendingComplaints
        });
      }
      
      if (stats.unverifiedVendors > 0) {
        newNotifications.push({
          type: 'vendor',
          message: `${stats.unverifiedVendors} unverified vendors`,
          link: '/vendors?filter=unverified', // We will implement this filter logic
          count: stats.unverifiedVendors
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = notifications.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome back, {admin?.name}
          </h2>
          <p className="text-sm text-gray-500">Manage your platform efficiently</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            >
              <FiBell className="text-xl text-gray-600" />
              {!loading && totalCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif, index) => (
                      <Link 
                        key={index}
                        to={notif.link}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-full mt-1">
                            <FiAlertCircle className="text-sm" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">Action required</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{admin?.name}</p>
              <p className="text-xs text-gray-500">{admin?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
              title="Logout"
            >
              <FiLogOut className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
