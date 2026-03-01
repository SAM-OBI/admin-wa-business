import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { AuthLayout } from '../layouts/AuthLayout';
import { FaShieldAlt } from 'react-icons/fa';
import { showError, showSuccess, showLoading, closeLoading } from '../utils/swal';
import IPVerificationModal from '../components/IPVerificationModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showIPVerification, setShowIPVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSuccessfulLogin = () => {
    closeLoading();
    showSuccess('Access Granted', 'Welcome back, Admin');
    setTimeout(() => navigate('/'), 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
       showError('Please enter a valid email address.', 'Invalid Email');
       return;
    }

    showLoading('Authorizing...');

    try {
      const result = await login({ email, password });
      
      if (result && result.requires2FA) {
        closeLoading();
        navigate('/auth/2fa', { state: { tempToken: result.tempToken } });
        return;
      }

      handleSuccessfulLogin();
    } catch (err: any) {
      closeLoading();
      
      // Check for IP verification required (status 403)
      if (err.response?.status === 403 && err.response.data?.requiresIPVerification) {
        setPendingUserId(err.response.data.userId);
        setShowIPVerification(true);
        return; 
      }

      let errorMessage = err.response?.data?.message || 'Authorization failed.';
      showError(errorMessage, 'Security Alert');
    }
  };

  const handleIPVerificationSuccess = (user: any) => {
    setShowIPVerification(false);
    setPendingUserId(null);
    useAuthStore.setState({ 
      admin: user, 
      isAuthenticated: true,
      isLoading: false  
    });
    handleSuccessfulLogin();
  };

  const handleIPVerificationCancel = () => {
    setShowIPVerification(false);
    setPendingUserId(null);
  };

  return (
    <AuthLayout
      title="Platform Governance"
      subtitle="Authorized personnel only. Access is monitored and logged for security auditing."
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="mb-6">
           <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
              <FaShieldAlt size={20} />
           </div>
           <h2 className="text-xl font-display font-medium text-gray-900 mb-1 tracking-tight">Admin Console</h2>
           <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Identity Verification Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Administrative Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-slate-50 focus:bg-white text-sm text-slate-900"
              placeholder="admin@shopvia.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Secret</label>
              <Link to="/forgot-password" title="Recovery" className="text-[10px] font-bold text-primary uppercase tracking-tight hover:underline">
                Recovery
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition bg-slate-50 focus:bg-white text-sm text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-lg font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10 transition-all duration-200"
          >
            Authenticate Access
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
           <span>System Online: Node_ShopVia_Alpha</span>
        </div>
      </motion.div>

      {/* IP Verification Modal */}
      {showIPVerification && pendingUserId && (
        <IPVerificationModal
          userId={pendingUserId}
          onSuccess={handleIPVerificationSuccess}
          onCancel={handleIPVerificationCancel}
        />
      )}
    </AuthLayout>
  );
}
