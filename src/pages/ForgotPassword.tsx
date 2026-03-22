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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          {verifiedToken ? 'Secure New Password' : 'Access Recovery'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {verifiedToken 
            ? 'Establish a new high-entropy password for your account' 
            : 'Enter your administrative email to initiate recovery'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md p-4 sm:p-0">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/60 rounded-[32px] border border-slate-100">
          
          {verifiedToken ? (
            /* Phase 3: New Password Form */
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">New Access Secret</label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm Secret</label>
                <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium"
                        placeholder="••••••••"
                    />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]"
              >
                Update Identity Secret
              </button>
            </form>
          ) : status === 'success' ? (
            /* Phase 2: Sent Fallback (legacy or no account found) */
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100">
                <FiMail size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Request Dispatched</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  If your email is registered in our secure vault, instructions and a verification code have been dispatched.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <Link to="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors inline-flex items-center gap-2">
                  <FiArrowLeft /> Return to Authentication
                </Link>
              </div>
            </div>
          ) : (
            /* Phase 1: Email Request */
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Service Email</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium text-slate-900"
                    placeholder="admin@shopvia.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-[0.98]"
              >
                {status === 'loading' ? 'Verifying...' : 'Initiate Recovery'}
              </button>

              <div className="flex items-center justify-center pt-2">
                 <Link to="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors inline-flex items-center gap-2">
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
