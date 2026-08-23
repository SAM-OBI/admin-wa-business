import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiMenu } from 'react-icons/fi';
import { UserProfileDropdown } from './UserProfileDropdown';
import { HardenedSearchInput } from './search/HardenedSearchInput';
import { GlobalSearchOverlay } from './search/GlobalSearchOverlay';
import { navigationGroups } from './navigation.config';

interface HeaderProps {
  toggleMobileSidebar?: () => void;
}

const toTitleCase = (segment: string) =>
  segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// 🛡️ [D-6 FIX] Derives the header title from the same navigationGroups list
// Sidebar renders from, rather than a second, separately-maintained title
// map — a route added to the sidebar automatically gets a correct header
// title with no further wiring. Routes not in the sidebar (the diagnostic
// pages intentionally left unexposed — see Sidebar.tsx) fall back to a
// title-cased version of the URL's last segment, so direct navigation there
// still shows something accurate rather than the old static text.
const getPageTitle = (pathname: string): string => {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'Dashboard';

  const allNavItems = navigationGroups.flatMap(g => g.items);
  const exact = allNavItems.find(item => item.to === pathname);
  if (exact) return exact.name;

  const byPrefix = allNavItems
    .filter(item => item.to !== '/dashboard' && pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (byPrefix) return byPrefix.name;

  if (pathname === '/dashboard/settings') return 'Settings';

  const lastSegment = pathname.split('/').filter(Boolean).pop();
  return lastSegment ? toTitleCase(lastSegment) : 'Dashboard';
};

export default function Header({ toggleMobileSidebar }: HeaderProps) {
  const { admin, logout } = useAuthStore();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [showSearch, setShowSearch] = useState(false);

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
              {pageTitle}
            </h2>
            <p className="hidden md:block text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{admin?.name?.split(' ')[0]} &middot; Industrial Governance Node</p>
          </div>

          {/* Global Admin Search (v104.2) */}
          <div className="hidden xl:block w-96 ml-8">
            <div onClick={() => setShowSearch(true)} className="cursor-pointer">
              <HardenedSearchInput 
                value="" 
                onChange={() => {}} 
                placeholder="GLOBAL DISCOVERY SEARCH..." 
                className="scale-90 pointer-events-none"
                context="ADMIN"
              />
            </div>
          </div>
          
          <GlobalSearchOverlay 
            isOpen={showSearch} 
            onClose={() => setShowSearch(false)} 
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/*
            🛡️ [D-3 FIX] Removed: this bell polled GET /admin/notifications
            every 15s, a route that doesn't exist on the backend (confirmed —
            no /api/v1/admin/* route matches it). The 404 was silently
            swallowed and the badge stayed permanently at 0, which read as
            "nothing needs attention" when the truth was "this was never
            wired up." Per the product decision on this finding: don't
            fabricate an /admin/notifications endpoint just to make a bell
            spin — the eventual correct signal here is an admin attention
            aggregation (what actionable things exist right now), not a
            notification feed. When that exists, it belongs in this slot.
          */}

          <div className="h-6 w-px bg-zinc-800/50 mx-2 hidden md:block" />

          <UserProfileDropdown user={admin} logout={logout} settingsPath="/dashboard/settings" />
        </div>
      </div>
    </header>
  );
}
