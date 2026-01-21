import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';
import { FiShield, FiLock } from 'react-icons/fi';

export default function TwoFactorAuth() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { verify2FA } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const tempToken = location.state?.tempToken;

    if (!tempToken) {
        navigate('/login', { replace: true });
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            showError('Please enter a 6-digit code', 'Invalid Code');
            return;
        }

        setLoading(true);
        showLoading('Verifying code...');

        try {
            await verify2FA(tempToken, code);
            closeLoading();
            showSuccess('Welcome back!', 'Verification Successful');
            navigate('/dashboard', { replace: true });
        } catch (error: any) {
            closeLoading();
            showError(error.response?.data?.message || 'Invalid or expired 2FA code', 'Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl w-full max-w-md px-8 py-10 relative z-10 mx-auto"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 mb-4">
                        <FiShield className="text-3xl text-[#D4AF37]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#4A3728] mb-2">Two-Factor Authentication</h1>
                    <p className="text-[#4A3728]/70 text-sm">
                        Enter the 6-digit verification code from your authenticator app to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#4A3728] text-center">
                            Authentication Code
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            className="block w-full px-4 py-4 bg-[#F5F5DC]/50 border-2 border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl focus:ring-4 focus:ring-[#D4AF37]/10 transition-all outline-none text-[#4A3728] text-center text-3xl font-bold tracking-[0.5em] placeholder-gray-300"
                            placeholder="000000"
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full bg-[#D8C3A5] hover:bg-[#D4AF37] text-[#4A3728] py-4 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <FiLock /> Verify & Login
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full text-sm text-[#4A3728]/60 hover:text-[#4A3728] transition-colors font-medium py-2"
                        >
                            Back to Login
                        </button>
                    </div>
                </form>

                <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-800 text-center leading-relaxed">
                        If you've lost access to your authenticator app, please contact the system administrator or use a recovery code.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
