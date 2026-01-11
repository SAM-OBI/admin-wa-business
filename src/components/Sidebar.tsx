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
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // const { admin } = useAuthStore();

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between h-20">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-blue-600 whitespace-nowrap">Admin Panel</h1>
            <p className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">Wa Vendors</p>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <FiMenu size={20} /> : <FiChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          // Marketing is now available for all plans on Admin Panel
          const isLocked = false;
          
          return (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/dashboard'} // Only exact match for dashboard home
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  setShowUpgradeModal(true);
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition group relative ${
                  isActive && !isLocked
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`text-lg shrink-0 ${isLocked ? 'text-gray-400' : ''}`} />
              
              {!isCollapsed && (
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${isLocked ? 'text-gray-500' : ''}`}>
                  {item.name}
                </span>
              )}
              
              {!isCollapsed && isLocked && (
                <span className="ml-auto bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  PRO
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <NavLink 
          to="/dashboard/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-3 rounded-lg transition w-full ${
              isActive
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            } ${isCollapsed ? 'justify-center' : ''}`
          }
          title={isCollapsed ? 'Settings' : ''}
        >
          <FiSettings className="text-lg shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
      </div>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
