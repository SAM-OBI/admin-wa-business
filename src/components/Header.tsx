import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { FiBell, FiAlertCircle, FiMenu } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { Link } from 'react-router-dom';
import { UserProfileDropdown } from './UserProfileDropdown';

interface HeaderProps {
  toggleMobileSidebar?: () => void;
}

export default function Header({ toggleMobileSidebar }: HeaderProps) {
  const { admin, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <header className="bg-white border-b border-gray-100/80 backdrop-blur-sm sticky top-0 z-30 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
           {/* Mobile Menu Toggle */}
           <button 
             onClick={toggleMobileSidebar}
             className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
           >
             <FiMenu size={24} />
           </button>

           <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">
              Welcome back, {admin?.name?.split(' ')[0]}
            </h2>
            <p className="hidden md:block text-sm text-gray-500 font-medium">Manage your platform efficiently</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition relative group border border-transparent hover:border-gray-200"
            >
              <FiBell className="text-xl text-gray-400 group-hover:text-gray-600 transition-colors" />
              {!loading && unreadCount > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button 
                    onClick={() => {
                        adminService.markAllNotificationsRead().then(fetchNotifications);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-400 flex flex-col items-center">
                    <FiBell className="text-3xl mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="max-h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {notifications.map((notif, index) => (
                      <Link 
                        key={notif._id || index}
                        to={notif.metadata?.link || notif.link || '#'}
                        onClick={() => handleNotificationClick(notif)}
                        className={`block px-4 py-3.5 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-blue-50/40 relative before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full mt-0.5 shrink-0 ${!notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <FiAlertCircle className="text-sm" />
                          </div>
                          <div>
                            <p className={`text-sm text-gray-800 leading-snug ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium tracking-wide">{new Date(notif.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block" />

          <UserProfileDropdown user={admin} logout={logout} settingsPath="/settings" />
        </div>
      </div>
    </header>
  );
}
