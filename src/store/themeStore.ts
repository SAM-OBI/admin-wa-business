import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 🛡️ [THEME-TOGGLE-1] Ported from the sibling vendor frontend's own
// themeStore.ts (whatsappvendors stores/src/store/themeStore.ts) — same
// shape/API, own storage keys so the two apps' preferences never collide.
export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = typeof Theme[keyof typeof Theme];

// The single primitive bootstrap key index.html reads before first paint —
// decoupled from Zustand's persisted JSON so it doesn't need parsing.
const BOOTSTRAP_KEY = 'sv_admin_theme_v1';

// Central DOM writer — the only function that touches
// document.documentElement.classList in this app.
export function applyTheme(selected: Theme): 'light' | 'dark' {
  const resolved: 'light' | 'dark' =
    selected === Theme.SYSTEM
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : selected;

  try {
    const root = document.documentElement;

    root.classList.add('no-theme-transition');
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;

    localStorage.setItem(BOOTSTRAP_KEY, resolved);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('no-theme-transition');
      });
    });
  } catch {
    // Safari private mode or CSP — degrade silently
  }

  return resolved;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return Theme.LIGHT;
  try {
    const stored = localStorage.getItem('admin-theme-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const t = parsed?.state?.theme as string | undefined;
      if (t === Theme.LIGHT || t === Theme.DARK || t === Theme.SYSTEM) return t as Theme;
    }
  } catch { /* ignore */ }

  return Theme.SYSTEM;
}

function addMediaListener(
  mq: MediaQueryList,
  handler: (e: MediaQueryListEvent) => void
): () => void {
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  } else {
    (mq as any).addListener(handler);
    return () => (mq as any).removeListener(handler);
  }
}

interface ThemeState {
  /** What the admin explicitly selected (may be SYSTEM) */
  theme: Theme;
  /** The actual resolved class applied to <html> (never SYSTEM) */
  resolvedTheme: 'light' | 'dark';

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  /** Call once in App.tsx to wire up the OS theme-change listener */
  initSystemListener: () => () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      resolvedTheme: 'light', // overwritten synchronously on hydration

      toggleTheme: () =>
        set((state) => {
          const next = state.resolvedTheme === 'dark' ? Theme.LIGHT : Theme.DARK;
          const resolved = applyTheme(next);
          return { theme: next, resolvedTheme: resolved };
        }),

      setTheme: (theme) => {
        const resolved = applyTheme(theme);
        set({ theme, resolvedTheme: resolved });
      },

      initSystemListener: () => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          if (get().theme === Theme.SYSTEM) {
            const resolved = applyTheme(Theme.SYSTEM);
            set({ resolvedTheme: resolved });
          }
        };
        return addMediaListener(mq, handler as (e: MediaQueryListEvent) => void);
      },
    }),
    {
      name: 'admin-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = applyTheme(state.theme);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
