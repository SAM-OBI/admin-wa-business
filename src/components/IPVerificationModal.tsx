import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { showError, showSuccess } from '../utils/swal';

interface IPVerificationModalProps {
    userId: string;
    onSuccess: (userData: any) => void;
    onCancel: () => void;
}

export default function IPVerificationModal({ userId, onSuccess, onCancel }: IPVerificationModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Sanitize input - only allow numbers
        const sanitized = e.target.value.replace(/\D/g, '').substring(0, 4);
        setCode(sanitized);
        setError('');
    };

    // Helper to get cookie by name
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    // Warm up CSRF token on mount
    useEffect(() => {
        const warmUp = async () => {
             try {
                 await api.get('/auth/me');
             } catch (e) {
                 // Ignore error, we just want the cookie
             }
        };
        warmUp();
    }, []);

    const handleVerify = async () => {
        setError('');

        if (code.length !== 4) {
            setError('Please enter a 4-digit code');
            return;
        }

        setLoading(true);
        try {
            // Manually get token to ensure it's fresh
            const xsrfToken = getCookie('XSRF-TOKEN');
            
            const response = await api.post('/auth/verify-ip', {
                userId,
                code
            }, {
                headers: {
                    'X-XSRF-TOKEN': xsrfToken // Force explicit header
                }
            });

            if (response.data.success) {
                // Store token and user data
                if (response.data.token) {
                    // Token handled by cookie
                    localStorage.setItem('is_logged_in', 'true');
                }

                showSuccess('IP verified successfully', 'Success');

                onSuccess(response.data.data);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            const message = errorData?.message || 'Verification failed';
            
            setError(message);
            
            if (typeof errorData?.attemptsLeft === 'number') {
                setAttemptsLeft(errorData.attemptsLeft);
            }

            if (errorData?.attemptsLeft === 0) {
                showError('Maximum verification attempts exceeded. Please request a new code.', 'Too Many Attempts');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/resend-verification', {
                userId
            });

            if (response.data.success) {
                showSuccess('New code sent to your email', 'Success');
                setCode('');
                setAttemptsLeft(null);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to resend code';
            showError(message, 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length === 4) {
            handleVerify();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-[9999] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Security Verification</h2>
                    <p className="text-gray-600 mt-2">
                        We detected a login from a new IP address. Please enter the verification code sent to your email.
                    </p>
                </div>

                {/* Code Input */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={code}
                        onChange={handleCodeChange}
                        onKeyPress={handleKeyPress}
                        placeholder="0000"
                        maxLength={4}
                        className="w-full px-4 py-4 text-center text-3xl font-bold tracking-[1em] rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:tracking-normal"
                        autoFocus
                        disabled={loading}
                    />
                    
                    {attemptsLeft !== null && (
                        <p className="text-sm text-orange-600 mt-3 text-center font-medium">
                            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={handleVerify}
                        disabled={loading || code.length !== 4}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                    >
                        {loading ? 'Verifying...' : 'Verify Access'}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleResendCode}
                            disabled={loading}
                            className="w-full py-3 text-sm text-gray-600 font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                            Resend Code
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full py-3 text-sm text-gray-600 font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 text-center">
                     <p className="text-xs text-gray-500">
                        Secure logic powered by WhatsApp Vendors
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
