import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import TwoFactorBanner from './TwoFactorBanner.tsx';

export default function Layout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  // We can add logic for that later if needed, mostly handled by Sidebar NavLink clicks

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 antialiased overflow-hidden selection:bg-white selection:text-black">
      {/* Sidebar handles its own responsive rendering based on these props */}
      <Sidebar 
        isDesktopCollapsed={isDesktopCollapsed} 
        toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300">
        <TwoFactorBanner />
        <Header 
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
        />
        <main className="flex-1 overflow-auto bg-[#050505] p-4 lg:p-10 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
