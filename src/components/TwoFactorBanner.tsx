import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiX, FiArrowRight } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

export default function TwoFactorBanner() {
    const { admin, isAuthenticated } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Only show if authenticated, 2FA is NOT enabled, and not dismissed in this session
        const isDismissed = sessionStorage.getItem('2fa_banner_dismissed');
        const shouldShow = isAuthenticated && admin && !admin.isTwoFactorEnabled && !isDismissed;
        
        // Don't show on the settings page where they actually set it up
        const isSettingsPage = location.pathname.includes('/settings');

        setIsVisible(!!shouldShow && !isSettingsPage);
    }, [admin, isAuthenticated, location.pathname]);

    const handleDismiss = () => {
        sessionStorage.setItem('2fa_banner_dismissed', 'true');
        setIsVisible(false);
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
                    className="bg-blue-600 text-white relative overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FiShield className="text-xl" />
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
                                className="whitespace-nowrap bg-white text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-opacity-90 transition shadow-sm flex items-center gap-2"
                            >
                                Setup <FiArrowRight />
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-white/70 hover:text-white transition p-1"
                                aria-label="Dismiss banner"
                            >
                                <FiX />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
