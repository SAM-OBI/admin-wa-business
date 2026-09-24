import { NavLink } from 'react-router-dom';
import { FiMenu, FiChevronLeft, FiSettings } from 'react-icons/fi';
import { useState } from 'react';
// useState imported above
import UpgradeModal from './UpgradeModal';

import { navigationGroups } from './navigation.config';

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
        className={`bg-sv-surface-elevated border-r border-sv-border flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none h-full
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopCollapsed ? 'lg:w-20' : 'lg:w-[260px]'}
          w-[260px]
        `}
      >
        {/* Header / Logo */}
        <div className={`p-4 border-b border-sv-border flex items-center h-20 shrink-0 ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo - Hidden on collapsed desktop */}
          <div className={`${isDesktopCollapsed ? 'hidden lg:hidden' : 'block'} flex flex-col overflow-hidden`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sv-primary flex items-center justify-center rounded-lg">
                <span className="text-sv-text-inverse font-black text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-sv-text-primary tracking-tighter uppercase">Shopvia</h1>
                <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-[0.15em] leading-none mt-0.5">Control Panel</p>
              </div>
            </div>
          </div>

          {/* Toggle Buttons */}
          <button
            onClick={toggleDesktop}
            className="hidden lg:flex p-2 rounded-lg hover:bg-sv-surface-muted text-sv-text-muted hover:text-sv-text-primary transition-all duration-300"
          >
             {isDesktopCollapsed ? <FiMenu size={18} /> : <FiChevronLeft size={18} />}
          </button>

          {/* Close button for Mobile */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-2 rounded-lg hover:bg-sv-surface-muted text-sv-text-muted"
          >
            <FiChevronLeft size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-sv-border hover:scrollbar-thumb-sv-text-muted">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              {!isDesktopCollapsed && (
                <p className="px-4 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-sv-text-muted">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
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
                          ? 'bg-sv-accent-soft text-sv-primary border border-sv-primary/20'
                          : 'text-sv-text-secondary hover:bg-sv-surface-muted hover:text-sv-text-primary border border-transparent'
                      } ${isDesktopCollapsed ? 'lg:justify-center px-2' : ''}`
                    }
                    title={isDesktopCollapsed ? item.name : ''}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`text-[17px] shrink-0 transition-all duration-300 ${
                            isActive && !isLocked ? 'text-sv-primary' : isLocked ? 'text-sv-text-muted' : 'group-hover:scale-110'
                          }`} />

                        {!isDesktopCollapsed && (
                          <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                            {item.name}
                          </span>
                        )}

                        {!isDesktopCollapsed && isLocked && (
                          <span className="ml-auto bg-sv-surface-muted text-sv-text-muted text-[8px] font-black px-1.5 py-0.5 border border-sv-border rounded-sm">
                            RESTRICTED
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sv-border shrink-0">
          <NavLink
            to="/dashboard/settings"
            onClick={() => window.innerWidth < 1024 && closeMobile()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 w-full text-sm ${
                isActive
                  ? 'bg-sv-surface-muted text-sv-text-primary font-semibold border border-sv-border'
                  : 'text-sv-text-secondary hover:bg-sv-surface-muted hover:text-sv-text-primary'
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
