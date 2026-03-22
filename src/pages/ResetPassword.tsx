import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiLock, FiCheckCircle, FiShield, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'idle' : 'error');

  useEffect(() => {
    if (!token) {
      showError('Invalid or missing security token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showError('Credential Mismatch: Secrets do not match.');
      return;
    }
    
    if (password.length < 8) {
      showError('Security Policy: Secret must be at least 8 characters.');
      return;
    }

    setStatus('loading');
    showLoading('Updating identity secrets...');

    try {
      if (token) {
        await resetPassword(token, password);
        closeLoading();
        setStatus('success');
        showSuccess('Credentials updated successfully. Redirecting to vault access.', 'Operational Success');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error: any) {
      closeLoading();
      setStatus('error');
      showError(error.response?.data?.message || 'Failed to update credentials. The token may be expired.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Define New Secret
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Securely update your administrative credentials
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md p-4 sm:p-0">
        <div className="bg-white py-12 px-10 shadow-2xl shadow-slate-200/60 rounded-[40px] border border-slate-100 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mb-6">
                  <FiCheckCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Success Verified</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Your identity secret has been successfully re-established. 
                  Redirecting to authentication in 3 seconds...
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6" 
                onSubmit={handleSubmit}
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">New Identity Secret</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium text-slate-900"
                      placeholder="••••••••"
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirm Identity Secret</label>
                  <div className="relative group">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none font-medium text-slate-900"
                      placeholder="••••••••"
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Establish Security <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-6 border-t border-slate-50">
                    <Link to="/login" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors inline-flex items-center gap-2">
                        <FiArrowLeft /> Return to Authentication
                    </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Secure Badge */}
          <div className="absolute top-4 right-4 text-slate-50 opacity-10 pointer-events-none">
            <FiShield size={120} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
