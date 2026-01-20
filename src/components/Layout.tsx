import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';

export default function Layout() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  // We can add logic for that later if needed, mostly handled by Sidebar NavLink clicks

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar handles its own responsive rendering based on these props */}
      <Sidebar 
        isDesktopCollapsed={isDesktopCollapsed} 
        toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300">
        <Header 
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
        />
        <main className="flex-1 overflow-auto bg-gray-50/50 p-4 lg:p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
