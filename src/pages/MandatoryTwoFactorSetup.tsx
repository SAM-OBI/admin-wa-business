import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiCheckCircle, FiLogOut } from 'react-icons/fi';
import { adminService } from '../api/admin.service';
import { useAuthStore } from '../store/authStore';
import { showError } from '../utils/swal';
import SecurityQuestionModal from '../components/SecurityQuestionModal';

/**
 * 🛡️ [ADMIN HARDENING] Forced 2FA enrollment for admin accounts.
 * Reached only via the restricted mode:'mfa_setup' token issued by login() when
 * an admin has no 2FA configured — that token is rejected by protect() for every
 * route except /auth/2fa/setup and /auth/2fa/verify, so this page is the only
 * thing an admin in this state can actually do besides log out.
 */
export default function MandatoryTwoFactorSetup() {
  const [step, setStep] = useState<'intro' | 'qr' | 'success'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await adminService.setup2FA();
      if (data.data?.qrCodeUrl) {
        setQrCode(data.data.qrCodeUrl);
        setStep('qr');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToQuestions = () => {
    if (totpCode.length !== 6) return;
    setShowQuestionsModal(true);
  };

  const handleQuestionsSubmit = async (questions: { question: string; answer: string }[]) => {
    setLoading(true);
    try {
      const res = await adminService.setup2FAVerify(totpCode, questions);
      setRecoveryCodes(res.data?.recoveryCodes || []);
      // The real session token — the restricted setup token is done being useful.
      if (res.data?.accessToken) {
        sessionStorage.setItem('token', res.data.accessToken);
        sessionStorage.setItem('is_logged_in', 'true');
      }
      setStep('success');
      setShowQuestionsModal(false);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-6">
          <FiShield size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Two-Factor Setup Required</h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Administrative accounts must have 2FA enabled before continuing. This only takes a minute.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md p-4 sm:p-0">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/60 rounded-[40px] border border-slate-100">
          {step === 'intro' && (
            <div className="text-center space-y-6">
              <p className="text-sm text-slate-600">
                You'll need an authenticator app (Google Authenticator, Authy, or similar) on your phone.
              </p>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Begin Setup'}
              </button>
            </div>
          )}

          {step === 'qr' && qrCode && (
            <div className="space-y-6">
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-800 mb-3">Scan this QR Code</p>
                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 mb-4 border border-white shadow-sm rounded-lg" />
                <div className="w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Enter 6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-center tracking-[0.4em] font-mono text-xl focus:ring-2 focus:ring-slate-900 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleContinueToQuestions}
                disabled={loading || totpCode.length !== 6}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <FiCheckCircle className="text-emerald-500 mx-auto" size={48} />
              <div>
                <h3 className="text-lg font-bold text-slate-900">2FA Enabled</h3>
                <p className="text-sm text-slate-500 mt-1">Save these recovery codes somewhere safe — each can be used once if you lose access to your authenticator.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 font-mono text-xs">
                {recoveryCodes.map((code, i) => (
                  <div key={i} className="p-1">{code}</div>
                ))}
              </div>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all"
              >
                Continue to Dashboard
              </button>
            </div>
          )}

          {step !== 'success' && (
            <button
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="w-full mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <FiLogOut size={12} /> Cancel and Sign Out
            </button>
          )}
        </div>
      </div>

      <SecurityQuestionModal
        isOpen={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        onSubmit={handleQuestionsSubmit}
      />
    </div>
  );
}