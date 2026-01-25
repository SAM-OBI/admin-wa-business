import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';

export default function TwoFactorBanner() {
    const { admin, isAuthenticated } = useAuthStore();
    const [manualDismiss, setManualDismiss] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isVisible = (() => {
        if (manualDismiss) return false;
        const isDismissed = sessionStorage.getItem('admin_2fa_banner_dismissed');
        const shouldShow = isAuthenticated && admin && !admin.isTwoFactorEnabled && !isDismissed;
        const isSettingsPage = location.pathname.includes('/settings');
        return !!shouldShow && !isSettingsPage;
    })();

    const handleDismiss = () => {
        sessionStorage.setItem('admin_2fa_banner_dismissed', 'true');
        setManualDismiss(true);
    };

    const handleSetup = () => {
        navigate('/dashboard/settings');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-blue-600 text-white relative overflow-hidden z-[45]"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FaShieldAlt className="text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                    <span className="hidden sm:inline">Secure Admin Account! </span>
                                    Enable Two-Factor Authentication now.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 ml-4">
                            <button
                                onClick={handleSetup}
                                className="whitespace-nowrap bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                            >
                                Setup Now
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-white/60 hover:text-white transition-colors"
                                aria-label="Dismiss banner"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
