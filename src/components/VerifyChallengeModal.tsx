import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { showError, showSuccess, showToast } from '../utils/swal';
import { FaShieldAlt, FaEnvelope, FaSms, FaMobileAlt, FaArrowRight, FaSync } from 'react-icons/fa';

interface VerifyChallengeModalProps {
    challengeId: string;
    factors: Array<{
        type: 'EMAIL' | 'SMS' | 'TOTP';
        id: string;
        label: string;
        isPrimary: boolean;
    }>;
    userId?: string;
    emailMask?: string;
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

export default function VerifyChallengeModal({ 
    challengeId, 
    factors, 
    userId, 
    emailMask,
    onSuccess, 
    onCancel 
}: VerifyChallengeModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [currentFactor, setCurrentFactor] = useState(factors.find(f => f.isPrimary) || factors[0]);
    const [error, setError] = useState('');
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [resendSeconds, setResendSeconds] = useState(60);
    
    const { verifyChallenge, resendChallenge } = useAuthStore();

    // Resend Timer
    useEffect(() => {
        let interval: any;
        if (resendSeconds > 0) {
            interval = setInterval(() => setResendSeconds(s => s - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendSeconds]);

    const handleVerify = async () => {
        if (code.length < 4 || loading) return;
        
        setLoading(true);
        setError('');
        
        try {
            const result = await verifyChallenge({
                challengeId,
                otp: code,
                userId,
                deviceId: localStorage.getItem('deviceId') || undefined,
                deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
            });

            if (result.success) {
                showSuccess('Identity Verified', 'Access Granted');
                onSuccess(result.data);
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            const message = errorData?.message || 'Verification failed';
            setError(message);
            
            if (typeof errorData?.attemptsLeft === 'number') {
                setAttemptsLeft(errorData.attemptsLeft);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendSeconds > 0 || resending) return;
        
        setResending(true);
        try {
            await resendChallenge(challengeId);
            showToast('Verification code resent', 'success');
            setResendSeconds(60);
            setCode('');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    const factorIcon = (type: string) => {
        switch (type) {
            case 'EMAIL': return <FaEnvelope />;
            case 'SMS': return <FaSms />;
            case 'TOTP': return <FaMobileAlt />;
            default: return <FaShieldAlt />;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
                {/* Header Section */}
                <div className="bg-slate-50 px-8 py-8 border-b border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                    
                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-900">
                            <FaShieldAlt size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Verification</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium">
                            Authorized personnel identity check required
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Method Selector (if multiple) */}
                    {factors.length > 1 && (
                        <div className="mb-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 text-center">
                                Verification Method
                            </label>
                            <div className="flex justify-center gap-2">
                                {factors.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setCurrentFactor(f)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${
                                            currentFactor.id === f.id 
                                                ? 'bg-slate-900 border-slate-900 text-white' 
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        {factorIcon(f.type)}
                                        {f.type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center mb-8">
                        <p className="text-slate-600 text-sm font-medium">
                            {currentFactor.type === 'TOTP' 
                                ? 'Enter the security code from your authenticator app'
                                : `Verification code sent to ${currentFactor.label || emailMask || 'your registered contact'}`}
                        </p>
                    </div>

                    {/* Code Input */}
                    <div className="mb-6 group">
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                                    setCode(val);
                                    setError('');
                                }}
                                placeholder="••••••"
                                maxLength={6}
                                className="w-full px-4 py-5 text-center text-4xl font-black tracking-[0.6em] rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none placeholder:text-slate-200 placeholder:tracking-normal group-hover:border-slate-200"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        
                        <div className="flex justify-between mt-3 px-1">
                            {attemptsLeft !== null ? (
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${attemptsLeft <= 1 ? 'text-rose-500' : 'text-amber-500'}`}>
                                    {attemptsLeft} Attempts remaining
                                </span>
                            ) : <span />}
                            
                            {currentFactor.type !== 'TOTP' && (
                                <button
                                    onClick={handleResend}
                                    disabled={resendSeconds > 0 || resending}
                                    className={`text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                        resendSeconds > 0 || resending 
                                            ? 'text-slate-300 cursor-not-allowed' 
                                            : 'text-primary hover:text-primary/80 border-b border-primary/20'
                                    }`}
                                >
                                    <FaSync className={resending ? 'animate-spin' : ''} />
                                    {resending ? 'Sending...' : resendSeconds > 0 ? `Resend (${resendSeconds}s)` : 'Resend Code'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error State */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3"
                            >
                                <span className="text-rose-500 mt-0.5">⚠️</span>
                                <p className="text-xs text-rose-600 font-semibold leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Primary Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleVerify}
                            disabled={loading || code.length < 4}
                            className="w-full py-4.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Verify Identity</span>
                                    <FaArrowRight size={14} className="opacity-50" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full py-3.5 text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cancel Access Request
                        </button>
                    </div>
                </div>

                {/* Secure Footer */}
                <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Industrial-Grade Identity Lock Active
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
