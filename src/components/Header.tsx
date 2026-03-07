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
    <header className="bg-[#0A0A0A]/80 border-b border-zinc-800/40 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
           {/* Mobile Menu Toggle */}
           <button 
             onClick={toggleMobileSidebar}
             className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400"
           >
             <FiMenu size={24} />
           </button>

           <div>
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">
              {admin?.name?.split(' ')[0]} <span className="text-zinc-500">/ Dashboard</span>
            </h2>
            <p className="hidden md:block text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Industrial Governance Node</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 hover:bg-zinc-800/50 rounded-xl transition-all relative group border border-zinc-800/0 hover:border-zinc-800/50"
            >
              <FiBell className="text-xl text-zinc-500 group-hover:text-white transition-colors" />
              {!loading && unreadCount > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-white text-black text-[9px] font-black rounded-full border border-black shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0F0F0F] rounded-xl shadow-2xl border border-zinc-800/50 py-2 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="font-bold text-[11px] uppercase tracking-widest text-white">System Notifications</h3>
                  <button 
                    onClick={() => {
                        adminService.markAllNotificationsRead().then(fetchNotifications);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white font-black uppercase tracking-tight transition"
                  >
                    Clear All
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center text-zinc-600 flex flex-col items-center">
                    <FiBell className="text-3xl mb-2 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-tighter">No active alerts</p>
                  </div>
                ) : (
                  <div className="max-h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    {notifications.map((notif, index) => (
                      <Link 
                        key={notif._id || index}
                        to={notif.metadata?.link || notif.link || '#'}
                        onClick={() => handleNotificationClick(notif)}
                        className={`block px-4 py-4 hover:bg-zinc-800/30 transition border-b border-zinc-800/30 last:border-0 ${!notif.isRead ? 'bg-white/[0.02] relative before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-white' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${!notif.isRead ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            <FiAlertCircle size={14} />
                          </div>
                          <div>
                            <p className={`text-sm text-white leading-tight ${!notif.isRead ? 'font-bold' : 'font-medium opacity-80'}`}>{notif.title}</p>
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-zinc-600 mt-2 font-black uppercase tracking-widest">{new Date(notif.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-800/50 mx-2 hidden md:block" />

          <UserProfileDropdown user={admin} logout={logout} settingsPath="/dashboard/settings" />
        </div>
      </div>
    </header>
  );
}
