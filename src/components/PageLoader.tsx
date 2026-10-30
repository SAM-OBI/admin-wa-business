import React, { useEffect, useState } from 'react';

export interface PageLoaderProps {
  /** Optional title to display */
  title?: string;
  /** Optional subtitle or status description */
  subtitle?: string;
  /** Whether to render inline within a parent container instead of locking full screen */
  isInline?: boolean;
  /** Optional callback when dismissed via timeout failsafe */
  onDismiss?: () => void;
  /** Timeout in ms before showing the fail-safe recovery controls (default: 4000ms) */
  timeoutMs?: number;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * 🛡️ [ADMIN-PAGE-LOADER-REDESIGN-1]
 * Redesigned Admin PageLoader:
 * 1. Replaces the artificial stuck 90% progress loop and clunky "WA" spinner with a
 *    sleek, modern administrative design system (Shopvia Control Center pulse + smooth indeterminate track).
 * 2. Implements a failsafe recovery mechanism: if background queries settle without unmounting
 *    or a network request stalls, a clean "Taking longer than expected?" escape trigger appears
 *    allowing admins to dismiss the blocking overlay or reload immediately, eliminating phantom hanging.
 * 3. Supports `isInline` so section loaders do not hijack the global viewport or trap pointer events.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  title = 'Shopvia Control Center',
  subtitle = 'Synchronizing governance modules...',
  isInline = false,
  onDismiss,
  timeoutMs = 4000,
  className = ''
}) => {
  const [showStallWarning, setShowStallWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStallWarning(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
      {/* Sleek Central Brand Badge with Pulse */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-sv-surface-muted/80 border border-sv-border/80 flex items-center justify-center shadow-sm relative overflow-hidden">
          <img
            src="/favicon.png"
            alt="Shopvia"
            className="w-8 h-8 object-contain transition-transform duration-500 animate-pulse select-none"
            onError={(e) => {
              // Fallback to text icon if favicon is not loaded
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        {/* Subtle Ambient Pulse Ring */}
        <div className="absolute -inset-1.5 rounded-2xl border border-sv-info/20 animate-ping pointer-events-none opacity-40" />
      </div>

      {/* Brand & Typography */}
      <div className="space-y-1 mb-5">
        <h2 className="text-sm font-black text-sv-text-primary tracking-tight font-display">
          {title}
        </h2>
        <p className="text-xs text-sv-text-muted font-medium">
          {subtitle}
        </p>
      </div>

      {/* Smooth Indeterminate Progress Bar */}
      <div className="w-44 h-1.5 bg-sv-surface-muted rounded-full overflow-hidden relative border border-sv-border/50">
        <div
          className="h-full bg-gradient-to-r from-sv-info via-emerald-500 to-sv-info rounded-full animate-[sv-indeterminate_1.5s_infinite_ease-in-out]"
          style={{ width: '50%' }}
        />
      </div>

      {/* Failsafe Warning & Action Triggers (Revealed after timeoutMs) */}
      {showStallWarning && (
        <div className="mt-5 p-3 rounded-lg bg-sv-surface border border-sv-border/80 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] text-sv-text-secondary mb-2.5 font-medium leading-relaxed">
            Data took longer than expected to render.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-sv-surface-muted hover:bg-sv-border text-sv-text-primary transition-colors cursor-pointer"
            >
              Dismiss Overlay
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-sv-primary hover:bg-sv-primary-hover text-white transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div className={`w-full min-h-[260px] flex items-center justify-center bg-sv-surface/50 rounded-xl border border-sv-border/60 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-sv-bg/80 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-200 ${className}`}>
      {/* Top Laser Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sv-surface-muted/60 z-50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sv-info via-emerald-400 to-sv-info animate-[sv-indeterminate_1.5s_infinite_ease-in-out]"
          style={{ width: '40%' }}
        />
      </div>

      {content}
    </div>
  );
};

export default PageLoader;
