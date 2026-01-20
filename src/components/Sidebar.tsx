import { NavLink } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiUsers, FiShoppingBag, 
  FiAlertCircle, FiMessageSquare, FiStar, 
  FiShield, FiFileText, FiSettings, FiTrendingUp,
  FiMenu, FiChevronLeft
} from 'react-icons/fi';
import { useState } from 'react';
// useState imported above
import UpgradeModal from './UpgradeModal';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: FiHome },
  { name: 'Products', to: '/dashboard/products', icon: FiPackage },
  { name: 'Users', to: '/dashboard/users', icon: FiUsers },
  { name: 'Vendors', to: '/dashboard/vendors', icon: FiShoppingBag },
  { name: 'Orders', to: '/dashboard/orders', icon: FiShoppingBag },
  { name: 'Complaints', to: '/dashboard/complaints', icon: FiAlertCircle },
  { name: 'Court Cases', to: '/dashboard/court-cases', icon: FiMessageSquare },
  { name: 'Reviews', to: '/dashboard/reviews', icon: FiStar },
  { name: 'Risk Management', to: '/dashboard/risk-management', icon: FiShield },
  { name: 'Audit Logs', to: '/dashboard/audit-logs', icon: FiFileText },
  { name: 'Marketing', to: '/dashboard/marketing', icon: FiTrendingUp },
];

interface SidebarProps {
  isDesktopCollapsed: boolean;
  toggleDesktop: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

export default function Sidebar({ isDesktopCollapsed, toggleDesktop, isMobileOpen, closeMobile }: SidebarProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`bg-white border-r border-gray-100 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none h-full
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Header / Logo */}
        <div className={`p-4 border-b border-gray-100 flex items-center h-20 shrink-0 ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo - Hidden on collapsed desktop */}
          <div className={`${isDesktopCollapsed ? 'hidden lg:hidden' : 'block'} flex flex-col overflow-hidden`}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">Admin Panel</h1>
            <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap tracking-wide">Wa Vendors</p>
          </div>

          {/* Fallback Icon for Collapsed State */}
          {isDesktopCollapsed && (
             <div className="hidden lg:flex items-center justify-center text-blue-600 font-bold text-xl">
               A
             </div>
          )}

          {/* Toggle Buttons */}
          <button 
            onClick={toggleDesktop}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition"
          >
             {isDesktopCollapsed ? <FiMenu size={20} /> : <FiChevronLeft size={20} />}
          </button>
          
          {/* Close button for Mobile */}
          <button 
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-50 text-gray-500"
          >
            <FiChevronLeft size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
          {navigation.map((item) => {
            const isLocked = false;
            
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    setShowUpgradeModal(true);
                  } else {
                    // Close mobile sidebar on navigation
                    if (window.innerWidth < 1024) closeMobile();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive && !isLocked
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${isDesktopCollapsed ? 'lg:justify-center' : ''}`
                }
                title={isDesktopCollapsed ? item.name : ''}
              >
                <item.icon className={`text-lg shrink-0 transition-colors ${
                    isLocked ? 'text-gray-400' : ''
                  }`} />
                
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isDesktopCollapsed ? 'lg:w-0 lg:opacity-0 hidden' : 'block'
                } ${isLocked ? 'text-gray-500' : ''}`}>
                  {item.name}
                </span>
                
                {!isDesktopCollapsed && isLocked && (
                  <span className="ml-auto bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    PRO
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <NavLink 
            to="/dashboard/settings"
            onClick={() => window.innerWidth < 1024 && closeMobile()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition w-full ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${isDesktopCollapsed ? 'lg:justify-center' : ''}`
            }
            title={isDesktopCollapsed ? 'Settings' : ''}
          >
            <FiSettings className="text-lg shrink-0" />
            <span className={`${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>Settings</span>
          </NavLink>
        </div>
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
        />
      </div>
    </>
  );
}
