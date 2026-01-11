import { useState } from 'react';
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

    const handleVerify = async () => {
        setError('');

        if (code.length !== 4) {
            setError('Please enter a 4-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/verify-ip', {
                userId,
                code
            });

            if (response.data.success) {
                // Store token and user data
                if (response.data.token) {
                    localStorage.setItem('auth_token', response.data.token);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">New IP Detected</h2>
                    <p className="text-sm text-gray-600 mt-2">
                        For your security, we've sent a 4-digit verification code to your email
                    </p>
                </div>

                {/* Code Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        Enter Verification Code
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
                        className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 outline-none transition"
                        autoFocus
                        disabled={loading}
                    />
                    
                    {attemptsLeft !== null && (
                        <p className="text-sm text-orange-600 mt-2 text-center">
                            {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleVerify}
                        disabled={loading || code.length !== 4}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <button
                        onClick={handleResendCode}
                        disabled={loading}
                        className="w-full py-2 text-blue-600 font-medium hover:underline transition disabled:opacity-50"
                    >
                        Resend Code
                    </button>

                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-2 text-gray-600 font-medium hover:text-gray-900 transition"
                    >
                        Cancel
                    </button>
                </div>

                {/* Info */}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        💡 Didn't receive the email? Check your spam folder or click "Resend Code"
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
