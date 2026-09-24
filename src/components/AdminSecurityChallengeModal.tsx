import { useState, useEffect, useCallback } from 'react';
import { FiShield, FiKey, FiMail, FiX, FiCheckCircle, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import api from '../api/axios';

/**
 * 🛡️ [MFA-P0-PHASE-2A] Admin equivalent of the vendor-facing
 * SecurityChallengeModal (src/components/auth/SecurityChallengeModal.tsx in
 * the vendor frontend) — same create/verify contract
 * (POST /auth/security-challenge, POST /auth/security-challenge/verify),
 * same two-step init->verify flow, restyled to admin-dashboard's own plain
 * white/gray modal convention (matching ComplaintDetailsModal.tsx) rather
 * than the vendor frontend's separate design-token system — the two
 * frontends are confirmed-fragmented, unrelated styling systems (Phase 2B
 * theme trace), so this deliberately does not import vendor tokens.
 *
 * `action` is a free-form string matched server-side against exactly what
 * the caller needs verified — for the governance MFA refresh flow, always
 * 'ADMIN_GOVERNANCE_REFRESH' (see useAdminGovernanceStepUp). Kept as a prop
 * (not hardcoded) so this component can also serve a future admin
 * requireSensitiveAction flow without duplicating it — that's a distinct,
 * NOT-yet-authorized use case; this component alone doesn't create one.
 */
interface AdminSecurityChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  onSuccess: (token: string) => void;
}

export default function AdminSecurityChallengeModal({ isOpen, onClose, action, onSuccess }: AdminSecurityChallengeModalProps) {
  const [step, setStep] = useState<'init' | 'verify' | 'success'>('init');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [method, setMethod] = useState<'WHATSAPP' | 'TOTP' | 'EMAIL' | 'SMS'>('TOTP');
  const [error, setError] = useState('');

  const startChallenge = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/security-challenge', { action });
      setChallengeToken(response.data.data.challengeId);
      setMethod(response.data.data.method);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start security verification');
      setStep('init');
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    if (isOpen) {
      setStep('init');
      setCode('');
      setError('');
      startChallenge();
    }
  }, [isOpen, startChallenge]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/security-challenge/verify', {
        token: challengeToken,
        code,
        action
      });
      setStep('success');
      setTimeout(() => {
        onSuccess(challengeToken);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-sv-surface rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="border-b border-sv-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sv-info-soft flex items-center justify-center text-sv-info">
              <FiShield />
            </div>
            <div>
              <h3 className="text-base font-bold text-sv-text-primary">Security Verification</h3>
              <p className="text-xs text-sv-text-secondary">Administrative access requires recent MFA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sv-surface-muted rounded-lg transition">
            <FiX className="text-sv-text-muted" />
          </button>
        </div>

        <div className="p-6">
          {step === 'init' && loading && (
            <div className="py-10 text-center">
              <div className="w-10 h-10 border-4 border-sv-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-sm text-sv-text-secondary">Preparing security challenge...</p>
            </div>
          )}

          {step === 'init' && !loading && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 bg-sv-danger-soft rounded-full flex items-center justify-center mx-auto text-sv-danger text-2xl">
                <FiAlertTriangle />
              </div>
              <p className="text-sm text-sv-text-secondary">{error || 'Unable to start verification.'}</p>
              <button
                type="button"
                onClick={() => startChallenge()}
                className="px-6 py-2 bg-sv-primary text-sv-text-inverse rounded-lg text-sm font-semibold hover:bg-sv-primary-hover transition"
              >
                Try Again
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-sv-info-soft rounded-full flex items-center justify-center mx-auto text-sv-info text-2xl">
                  {method === 'EMAIL' ? <FiMail /> : <FiKey />}
                </div>
                <p className="text-sm text-sv-text-secondary px-4">
                  {method === 'TOTP'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : `We've sent a 6-digit code to your ${method === 'EMAIL' ? 'email' : 'device'}.`}
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-3xl font-bold tracking-[0.4em] py-4 bg-sv-surface-muted border-2 border-transparent focus:border-sv-primary rounded-lg outline-none transition"
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 p-3 bg-sv-danger-soft text-sv-danger rounded-lg text-sm">
                  <FiAlertTriangle className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 bg-sv-primary text-sv-text-inverse rounded-lg font-semibold hover:bg-sv-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify <FiChevronRight /></>
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-sv-success-soft rounded-full flex items-center justify-center mx-auto text-sv-success text-3xl">
                <FiCheckCircle />
              </div>
              <p className="text-base font-bold text-sv-text-primary">Identity Confirmed</p>
              <p className="text-sm text-sv-text-secondary">Retrying your request...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
