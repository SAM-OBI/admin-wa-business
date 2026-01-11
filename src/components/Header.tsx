import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { FiBell, FiAlertCircle } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { Link } from 'react-router-dom';
import { UserProfileDropdown } from './UserProfileDropdown';

export default function Header() {
  const { admin, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await adminService.getNotifications({ limit: 5 });
      if (data.data?.notifications) {
         setNotifications(data.data.notifications);
         setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
        await adminService.markNotificationRead(id);
        fetchNotifications(); // Refresh
    } catch (error) {
        console.error('Failed to mark read', error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
      if (!notif.isRead) {
          await markAsRead(notif._id);
      }
      setShowNotifications(false);
  };

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
              {!loading && unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button 
                    onClick={() => {
                        adminService.markAllNotificationsRead().then(fetchNotifications);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif, index) => (
                      <Link 
                        key={notif._id || index}
                        to={notif.metadata?.link || notif.link || '#'}
                        onClick={() => handleNotificationClick(notif)}
                        className={`block px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full mt-1 ${!notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <FiAlertCircle className="text-sm" />
                          </div>
                          <div>
                            <p className={`text-sm text-gray-800 ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
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

          <UserProfileDropdown user={admin} logout={logout} settingsPath="/settings" />
        </div>
      </div>
    </header>
  );
}
