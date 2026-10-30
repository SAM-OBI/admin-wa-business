import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';
import { FiShield, FiLock, FiArrowLeft } from 'react-icons/fi';

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
            showError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        showLoading('Validating identity...');

        try {
            await verify2FA(tempToken, code);
            closeLoading();
            showSuccess('Identity verified. Access granted.', 'Operational Success');
            navigate('/dashboard', { replace: true });
        } catch (error: any) {
            closeLoading();
            showError(error.response?.data?.message || 'Invalid or expired identity token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sv-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                 <h2 className="mt-6 text-center text-3xl font-black text-sv-text-primary tracking-tight uppercase">
                    MFA Required
                 </h2>
                 <p className="mt-2 text-center text-sm text-sv-text-secondary font-medium">
                    Enter the code from your hardware or software authenticator
                 </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-sv-surface py-8 sm:py-12 px-6 sm:px-10 shadow-2xl rounded-3xl border border-sv-border">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sv-surface-muted border border-sv-border mb-6 text-sv-primary shadow-sm">
                            <FiShield size={36} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4 text-center">
                            <label className="block text-[11px] font-bold text-sv-text-muted uppercase tracking-[0.2em]">
                                Security Authorization Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                className="block w-full px-4 py-6 bg-sv-surface-muted border-2 border-transparent focus:bg-sv-surface focus:border-sv-primary rounded-2xl focus:ring-8 focus:ring-sv-primary/10 transition-all outline-none text-sv-text-primary text-center text-5xl font-black tracking-[0.5em] placeholder-sv-text-muted/40"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full bg-sv-primary text-sv-text-inverse py-5 rounded-2xl font-bold hover:bg-sv-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FiLock /> Authorize Access
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center pt-2">
                                <Link to="/login" className="text-xs font-bold text-sv-text-muted uppercase tracking-widest hover:text-sv-text-primary transition-colors inline-flex items-center gap-2">
                                    <FiArrowLeft /> Back to Login
                                </Link>
                            </div>
                        </div>
                    </form>

                    <div className="mt-10 p-5 bg-sv-warning-soft rounded-2xl border border-sv-warning/20">
                        <p className="text-[10px] text-sv-warning font-bold uppercase tracking-wider text-center leading-relaxed">
                            If you've lost access to your authenticator, please initiate <Link to="/forgot-password" title="Access Recovery" className="underline decoration-sv-warning/30 hover:decoration-sv-warning underline-offset-4 decoration-2">Access Recovery</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
