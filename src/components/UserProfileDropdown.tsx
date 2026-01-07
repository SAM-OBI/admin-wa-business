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

    const getInitials = (name: string) => {
         if (!name) return '';
         const parts = name.trim().split(/\s+/);
         if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase() + '.';
         return (parts[0][0] + '.' + parts[parts.length - 1][0]).toUpperCase();
    };

    const truncateEmail = (email: string) => {
        if (!email) return '';
        const [local, domain] = email.split('@');
        if (!local || !domain) return email;
        if (local.length > 3) {
             return `${local.substring(0, 3)}..@${domain}`;
        }
        return email;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
            >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{getInitials(user?.name) || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{truncateEmail(user?.email)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md relative">
                   {user?.name?.charAt(0).toUpperCase() || <FiUser />}
                   <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                        <FiChevronDown className="text-gray-400 text-[10px]" />
                   </div>
                </div>
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right transform transition-all duration-200 ease-out"
                >
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="p-2">
                            <Link 
                            to={settingsPath}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors w-full"
                        >
                            <FiSettings className="text-gray-400" />
                            Account Settings
                        </Link>

                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                            <FiLogOut className="text-red-400" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
