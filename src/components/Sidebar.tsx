import { NavLink } from 'react-router-dom';
import { 
  FiHome, FiPackage, FiUsers, FiShoppingBag, 
  FiAlertCircle, FiMessageSquare, FiStar, 
  FiShield, FiFileText, FiSettings, FiTrendingUp, FiMail,
  FiMenu, FiChevronLeft, FiLock, FiTerminal, FiHash, FiSend, FiGitPullRequest
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
  { name: 'Security SOC', to: '/dashboard/security', icon: FiShield },
  { name: 'Audit Logs', to: '/dashboard/audit-logs', icon: FiFileText },
  { name: 'Account Consolidations', to: '/dashboard/consolidations', icon: FiGitPullRequest },
  { name: 'App Feedback', to: '/dashboard/feedback', icon: FiMessageSquare },
  { name: 'Support Inquiries', to: '/dashboard/support-inquiries', icon: FiMail },
  { name: 'Marketing', to: '/dashboard/marketing', icon: FiTrendingUp },
  { name: 'Ads Moderation', to: '/dashboard/ads-moderation', icon: FiTrendingUp },
  { name: 'ROI Hub', to: '/dashboard/performance', icon: FiTrendingUp },
  { name: 'Promo Hub', to: '/dashboard/promo-hub', icon: FiTrendingUp },
  { name: 'Product Moderation', to: '/dashboard/product-moderation', icon: FiPackage },
  { name: 'Newsletter', to: '/dashboard/newsletter', icon: FiSend },
  { name: 'Journal Moderation', to: '/dashboard/journal', icon: FiFileText },
  { name: 'Financial Audit', to: '/dashboard/financial-audit', icon: FiTrendingUp },
  { name: 'Settlement', to: '/dashboard/settlement', icon: FiLock },
  { name: 'Error Logs', to: '/dashboard/error-logs', icon: FiTerminal },
  { name: 'DLQ', to: '/dashboard/dlq', icon: FiHash },
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
        className={`bg-[#0A0A0A] border-r border-zinc-800/40 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none h-full
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopCollapsed ? 'lg:w-20' : 'lg:w-[260px]'}
          w-[260px]
        `}
      >
        {/* Header / Logo */}
        <div className={`p-4 border-b border-zinc-800/40 flex items-center h-20 shrink-0 ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo - Hidden on collapsed desktop */}
          <div className={`${isDesktopCollapsed ? 'hidden lg:hidden' : 'block'} flex flex-col overflow-hidden`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <span className="text-black font-black text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tighter uppercase">Shopvia</h1>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] leading-none mt-0.5">Control Panel</p>
              </div>
            </div>
          </div>

          {/* Toggle Buttons */}
          <button 
            onClick={toggleDesktop}
            className="hidden lg:flex p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-white transition-all duration-300"
          >
             {isDesktopCollapsed ? <FiMenu size={18} /> : <FiChevronLeft size={18} />}
          </button>
          
          {/* Close button for Mobile */}
          <button 
            onClick={closeMobile}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-500"
          >
            <FiChevronLeft size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
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
                    if (window.innerWidth < 1024) closeMobile();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative text-[10px] font-black uppercase tracking-[0.15em] ${
                    isActive && !isLocked
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white'
                      : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white border border-transparent'
                  } ${isDesktopCollapsed ? 'lg:justify-center px-2' : ''}`
                }
                title={isDesktopCollapsed ? item.name : ''}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`text-[17px] shrink-0 transition-all duration-300 ${
                        isActive && !isLocked ? 'text-black' : isLocked ? 'text-zinc-700' : 'group-hover:scale-110'
                      }`} />
                    
                    {!isDesktopCollapsed && (
                      <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                        {item.name}
                      </span>
                    )}
                    
                    {!isDesktopCollapsed && isLocked && (
                      <span className="ml-auto bg-zinc-800 text-zinc-400 text-[8px] font-black px-1.5 py-0.5 border border-zinc-700 rounded-sm">
                        RESTRICTED
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/40 shrink-0">
          <NavLink 
            to="/dashboard/settings"
            onClick={() => window.innerWidth < 1024 && closeMobile()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 w-full text-sm ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold shadow-[0_0_20px_rgba(255,255,255,0.03)] border border-white/5'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              } ${isDesktopCollapsed ? 'lg:justify-center px-2' : ''}`
            }
            title={isDesktopCollapsed ? 'Settings' : ''}
          >
            <FiSettings className="text-[19px] shrink-0" />
            {!isDesktopCollapsed && <span>Settings</span>}
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
