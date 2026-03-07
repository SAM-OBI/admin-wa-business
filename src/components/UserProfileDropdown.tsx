import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';

interface UserProfileDropdownProps {
    user: any;
    logout: () => void;
    settingsPath?: string; // Default to /settings
}

export const UserProfileDropdown = ({ user, logout, settingsPath = '/settings' }: UserProfileDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const activeRole = user?.activeRole || user?.role;
    const roles = user?.roles || [user?.role];

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 hover:bg-zinc-800/50 p-2 rounded-lg transition-all focus:outline-none border border-transparent hover:border-zinc-800/50"
            >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white tracking-tight uppercase leading-none">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-1.5">{activeRole}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.1)] relative group-hover:scale-105 transition-transform">
                   {user?.name?.charAt(0).toUpperCase() || <FiUser />}
                </div>
                <FiChevronDown className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={14} />
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-3 w-64 bg-[#0F0F0F] rounded-xl shadow-2xl border border-zinc-800/50 overflow-hidden z-50 origin-top-right transform transition-all duration-200 ease-out"
                >
                    <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-white font-black text-sm border border-white/5">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-1.5">
                        {/* Role Switcher - Multi-Role Alignment */}
                        {roles.length > 1 && (
                            <div className="mb-2 p-2 pt-1">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 px-2">Identity Context</p>
                                <div className="space-y-1">
                                    {roles.includes('USERS') && activeRole !== 'USERS' && (
                                        <a 
                                            href={`${import.meta.env.VITE_STOREFRONT_URL || 'https://shopvia.ng'}/auth/switch?role=USERS`}
                                            className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                            Switch to Shopper
                                        </a>
                                    )}
                                    {roles.includes('VENDORS') && activeRole !== 'VENDORS' && (
                                        <a 
                                            href={`${import.meta.env.VITE_STOREFRONT_URL || 'https://shopvia.ng'}/auth/switch?role=VENDORS`}
                                            className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            Switch to Merchant
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        <Link 
                            to={settingsPath}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all"
                        >
                            <FiSettings size={14} className="opacity-50" />
                            System Preferences
                        </Link>

                        <div className="h-px bg-zinc-800/50 my-1.5 mx-2" />

                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all text-left"
                        >
                            <FiLogOut size={14} className="opacity-80" />
                            Terminate Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
