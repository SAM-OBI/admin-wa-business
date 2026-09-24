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
             } catch {
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
                const token = response.data.token || response.data.data?.accessToken;
                if (token) {
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('is_logged_in', 'true');
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-sv-surface rounded-2xl shadow-xl max-w-md w-full p-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-sv-info-soft rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-sv-text-primary">Security Verification</h2>
                    <p className="text-sv-text-secondary mt-2">
                        We detected a login from a new IP address. Please enter the verification code sent to your email.
                    </p>
                </div>

                {/* Code Input */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-sv-text-secondary mb-2 text-center">
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
                        className="w-full px-4 py-4 text-center text-3xl font-bold tracking-[1em] rounded-xl border-2 border-sv-border focus:border-sv-primary focus:ring-4 focus:ring-sv-primary/10 outline-none transition-all placeholder:tracking-normal"
                        autoFocus
                        disabled={loading}
                    />
                    
                    {attemptsLeft !== null && (
                        <p className="text-sm text-sv-warning mt-3 text-center font-medium">
                            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-sv-danger-soft border border-sv-danger/30 rounded-xl flex items-center gap-3">
                        <span className="text-sv-danger">⚠️</span>
                        <p className="text-sm text-sv-danger font-medium">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={handleVerify}
                        disabled={loading || code.length !== 4}
                        className="w-full py-4 bg-sv-primary text-sv-text-inverse font-bold rounded-xl hover:bg-sv-primary-hover transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Access'}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleResendCode}
                            disabled={loading}
                            className="w-full py-3 text-sm text-sv-text-secondary font-medium bg-sv-surface-muted rounded-lg hover:bg-sv-border transition disabled:opacity-50"
                        >
                            Resend Code
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full py-3 text-sm text-sv-text-secondary font-medium bg-sv-surface-muted rounded-lg hover:bg-sv-border transition"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>


            </motion.div>
        </div>
    );
}
