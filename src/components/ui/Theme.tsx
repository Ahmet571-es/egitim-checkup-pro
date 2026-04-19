'use client';

/**
 * Theme System
 * light | dark | system modları, localStorage persist, prefers-color-scheme sync
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'ecup-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  // Prevent transition flash during switch
  root.classList.add('theme-switching');
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // Re-enable transitions after a tick
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    });
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initial load
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
    const initial = stored || 'system';
    setThemeState(initial);
    const resolved = initial === 'system' ? getSystemTheme() : initial;
    setResolvedTheme(resolved);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // Listen to system preference changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const newResolved = mq.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mounted, theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, newTheme); } catch { /* ignore */ }
    }
  }, []);

  const toggle = useCallback(() => {
    // Toggle cycles: light -> dark -> system -> light
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      setTheme: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}

/**
 * Early theme script — injected before hydration to prevent flash
 * Add this to <head> via layout.tsx
 */
export const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var mode = stored || 'system';
    var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

/* ═══ Theme Toggle Button ═══ */
interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown';
}

export function ThemeToggle({ className = '', variant = 'dropdown' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  if (variant === 'button') {
    return (
      <button
        onClick={toggle}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all active:scale-95 ${className}`}
        aria-label={`Tema: ${theme}`}
        title={`Tema: ${theme} (${resolvedTheme})`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all active:scale-95"
        aria-label="Tema değiştir"
        aria-expanded={open}
        title="Tema seç"
      >
        <div className="relative w-4 h-4">
          <Sun className={`absolute inset-0 w-4 h-4 transition-all ${resolvedTheme === 'dark' ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
          <Moon className={`absolute inset-0 w-4 h-4 transition-all ${resolvedTheme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`} />
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 w-44 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden theme-menu-enter">
            {[
              { mode: 'light' as ThemeMode, label: 'Açık', icon: Sun },
              { mode: 'dark' as ThemeMode, label: 'Koyu', icon: Moon },
              { mode: 'system' as ThemeMode, label: 'Sistem', icon: Monitor },
            ].map(({ mode, label, icon: Icon }) => {
              const isActive = theme === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { setTheme(mode); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
                    isActive
                      ? 'bg-gray-50 dark:bg-slate-700/50 text-[#0f2847] dark:text-slate-100'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : ''}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              );
            })}
            <style jsx>{`
              @keyframes theme-menu-enter {
                from { opacity: 0; transform: translateY(-4px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .theme-menu-enter {
                animation: theme-menu-enter 150ms cubic-bezier(0.16, 1, 0.3, 1);
                transform-origin: top right;
              }
            `}</style>
          </div>
        </>
      )}
    </div>
  );
}
