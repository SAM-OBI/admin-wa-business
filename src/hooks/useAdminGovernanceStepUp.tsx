import { useCallback, useRef, useState } from 'react';
import AdminSecurityChallengeModal from '../components/AdminSecurityChallengeModal';

/**
 * 🛡️ [MFA-P0-PHASE-2A] Reusable governance step-up wrapper.
 *
 * governanceGuard() (backend) checks Session.lastMfaVerifiedAt freshness,
 * not a per-request token — so unlike the vendor frontend's
 * requireSensitiveAction pattern (where a challenge token must be attached
 * to the RETRIED request), refreshing governance MFA has no token to thread
 * through: once ADMIN_GOVERNANCE_REFRESH succeeds, the session itself is
 * fresh, and simply re-issuing the original request succeeds. That
 * difference is exactly why this is a small reusable hook rather than a
 * copy-pasted per-component pattern (the vendor frontend's own established
 * style, still followed here in spirit — this is NOT an axios interceptor;
 * each caller explicitly opts in by wrapping its own request with `execute`).
 *
 * Usage:
 *   const { execute, modal } = useAdminGovernanceStepUp();
 *   const handleClick = () => execute(() => api.post('/admin/...', body));
 *   return <>{...jsx...}{modal}</>;
 */
export function useAdminGovernanceStepUp() {
  const [isOpen, setIsOpen] = useState(false);
  const pendingRef = useRef<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    fn: () => Promise<unknown>;
  } | null>(null);

  const execute = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    return fn().catch((err: any) => {
      // governanceGuard() responds with a raw (non-sendResponse) JSON body —
      // requiresStepUp sits at the top level of response.data here, NOT
      // nested under response.data.data the way requireSensitiveAction's
      // sendResponse-wrapped 403s are. Deliberately checking only this exact
      // shape — conflating the two would blur governance MFA freshness with
      // the separate, action-specific sensitive-action challenge.
      const requiresGovernanceStepUp = err?.response?.status === 403 && err?.response?.data?.requiresStepUp === true;
      if (!requiresGovernanceStepUp) throw err;

      return new Promise<T>((resolve, reject) => {
        pendingRef.current = { resolve: resolve as (v: unknown) => void, reject, fn: fn as () => Promise<unknown> };
        setIsOpen(true);
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    pendingRef.current?.reject(new Error('Security verification cancelled'));
    pendingRef.current = null;
  }, []);

  const handleSuccess = useCallback(async () => {
    setIsOpen(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending) return;
    try {
      // No token to attach — governance freshness now lives on the session
      // itself, so re-issuing the exact same call is the entire retry.
      const result = await pending.fn();
      pending.resolve(result);
    } catch (err) {
      pending.reject(err);
    }
  }, []);

  const modal = (
    <AdminSecurityChallengeModal
      isOpen={isOpen}
      onClose={handleClose}
      action="ADMIN_GOVERNANCE_REFRESH"
      onSuccess={handleSuccess}
    />
  );

  return { execute, modal };
}
