import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiMail, FiArrowLeft, FiLock } from 'react-icons/fi';
import { AnimatePresence } from 'framer-motion';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';
import VerifyChallengeModal from '../components/VerifyChallengeModal';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [challengeData, setChallengeData] = useState<{
    challengeId: string;
    factors: any[];
    userId?: string;
    emailMask?: string;
  } | null>(null);
  
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { forgotPassword } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await forgotPassword(email);
      
      if (response && response.data?.requiresChallenge) {
        setChallengeData({
          challengeId: response.data.challengeId,
          factors: response.data.factors,
          userId: response.data.userId,
          emailMask: response.data.emailMask
        });
        setStatus('idle');
      } else {
        setStatus('success');
      }
    } catch (error: any) {
      setStatus('error');
      showError(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleChallengeSuccess = (data: any) => {
    setChallengeData(null);
    if (data.token) {
        setVerifiedToken(data.token);
    } else {
        // Fallback for unexpected response structure
        setStatus('success');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    showLoading('Updating password...');
    try {
        await api.post(`/auth/reset-password`, {
            token: verifiedToken,
            password: newPassword
        });
        closeLoading();
        showSuccess('Password updated successfully', 'Security Update');
        setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
        closeLoading();
        showError(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="min-h-screen bg-sv-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-sv-text-primary tracking-tight">
          {verifiedToken ? 'Secure New Password' : 'Access Recovery'}
        </h2>
        <p className="mt-2 text-center text-sm text-sv-text-secondary font-medium">
          {verifiedToken 
            ? 'Establish a new high-entropy password for your account' 
            : 'Enter your administrative email to initiate recovery'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-sv-surface py-8 sm:py-10 px-6 sm:px-8 shadow-2xl rounded-3xl border border-sv-border">
          
          {verifiedToken ? (
            /* Phase 3: New Password Form */
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-[11px] font-bold text-sv-text-secondary uppercase tracking-widest mb-2">New Access Secret</label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-sv-text-muted" />
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sv-surface-muted bg-sv-surface-muted focus:bg-sv-surface focus:border-sv-primary focus:ring-4 focus:ring-sv-primary/10 transition-all outline-none font-medium text-sv-text-primary"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sv-text-secondary uppercase tracking-widest mb-2">Confirm Secret</label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-sv-text-muted" />
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sv-surface-muted bg-sv-surface-muted focus:bg-sv-surface focus:border-sv-primary focus:ring-4 focus:ring-sv-primary/10 transition-all outline-none font-medium text-sv-text-primary"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4.5 bg-sv-primary text-sv-text-inverse font-bold rounded-2xl hover:bg-sv-primary-hover transition-all active:scale-[0.98]"
              >
                Update Identity Secret
              </button>
            </form>
          ) : status === 'success' ? (
            /* Phase 2: Sent Fallback (legacy or no account found) */
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-sv-success-soft rounded-2xl flex items-center justify-center mx-auto text-sv-success border border-sv-success/20">
                <FiMail size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-sv-text-primary">Request Dispatched</h3>
                <p className="text-sm text-sv-text-secondary leading-relaxed font-medium">
                  If your email is registered in our secure vault, instructions and a verification code have been dispatched.
                </p>
              </div>
              <div className="pt-4 border-t border-sv-border">
                <Link to="/" className="text-xs font-bold text-sv-text-muted uppercase tracking-widest hover:text-sv-text-primary transition-colors inline-flex items-center gap-2">
                  <FiArrowLeft /> Return to Authentication
                </Link>
              </div>
            </div>
          ) : (
            /* Phase 1: Email Request */
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[11px] font-bold text-sv-text-secondary uppercase tracking-widest mb-2">Service Email</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-sv-text-muted transition-colors group-focus-within:text-sv-primary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sv-surface-muted bg-sv-surface-muted focus:bg-sv-surface focus:border-sv-primary focus:ring-4 focus:ring-sv-primary/10 transition-all outline-none font-medium text-sv-text-primary"
                    placeholder="admin@shopvia.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4.5 bg-sv-primary text-sv-text-inverse font-bold rounded-2xl hover:bg-sv-primary-hover transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {status === 'loading' ? 'Verifying...' : 'Initiate Recovery'}
              </button>

              <div className="flex items-center justify-center pt-2">
                 <Link to="/" className="text-xs font-bold text-sv-text-muted uppercase tracking-widest hover:text-sv-text-primary transition-colors inline-flex items-center gap-2">
                    <FiArrowLeft /> Back to Login
                 </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <AnimatePresence>
        {challengeData && (
          <VerifyChallengeModal
            challengeId={challengeData.challengeId}
            factors={challengeData.factors}
            userId={challengeData.userId}
            emailMask={challengeData.emailMask}
            onSuccess={handleChallengeSuccess}
            onCancel={() => setChallengeData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPassword;
