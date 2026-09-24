import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import TwoFactorBanner from './TwoFactorBanner.tsx';
import GovernanceBanner from './GovernanceBanner.tsx';

export default function Layout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  // We can add logic for that later if needed, mostly handled by Sidebar NavLink clicks

  return (
    <div className="flex h-screen bg-sv-bg text-sv-text-primary antialiased overflow-hidden selection:bg-sv-primary selection:text-sv-text-inverse">
      {/* Sidebar handles its own responsive rendering based on these props */}
      <Sidebar 
        isDesktopCollapsed={isDesktopCollapsed} 
        toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300">
        <GovernanceBanner />
        <TwoFactorBanner />
        <Header 
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
        />
        <main className="flex-1 overflow-auto bg-sv-bg p-4 lg:p-10 scroll-smooth scrollbar-thin scrollbar-thumb-sv-border scrollbar-track-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
