import { useState } from 'react';
import { FiX } from 'react-icons/fi';

const STORAGE_KEY = 'shopvia_admin_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const decide = (value: 'accepted' | 'declined') => {
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-[200] px-4">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-xs text-slate-600 font-medium flex-1 leading-relaxed">
          This admin console uses cookies to keep you signed in and protect your session. No tracking or advertising cookies are used.
        </p>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => decide('declined')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => decide('accepted')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sv-primary text-sv-text-inverse text-xs font-bold hover:bg-sv-primary-hover transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => setVisible(false)}
            title="Ask me later"
            aria-label="Dismiss"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors shrink-0"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}