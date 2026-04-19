'use client';

/**
 * Premium Toast System
 * Sonner-inspired, role-aware, glassmorphism design
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;
const genId = () => `toast-${++idCounter}-${Date.now()}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = genId();
    const duration = toast.duration ?? (toast.type === 'loading' ? Infinity : toast.type === 'error' ? 6000 : 4000);
    setToasts(prev => [...prev, { ...toast, id, duration }]);
    if (duration !== Infinity) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) => show({ type: 'success', title, description }), [show]);
  const error = useCallback((title: string, description?: string) => show({ type: 'error', title, description }), [show]);
  const info = useCallback((title: string, description?: string) => show({ type: 'info', title, description }), [show]);
  const warning = useCallback((title: string, description?: string) => show({ type: 'warning', title, description }), [show]);
  const loading = useCallback((title: string, description?: string) => show({ type: 'loading', title, description, duration: Infinity }), [show]);
  const dismissAll = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, info, warning, loading, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: if used outside provider, fall back to alert (no crash)
    return {
      toasts: [],
      show: (t: Omit<Toast, 'id'>) => { if (typeof window !== 'undefined') window.alert(t.title); return ''; },
      success: (title: string) => { if (typeof window !== 'undefined') window.alert(title); return ''; },
      error: (title: string) => { if (typeof window !== 'undefined') window.alert(title); return ''; },
      info: (title: string) => { if (typeof window !== 'undefined') window.alert(title); return ''; },
      warning: (title: string) => { if (typeof window !== 'undefined') window.alert(title); return ''; },
      loading: () => '',
      dismiss: () => {},
      dismissAll: () => {},
    } as ToastContextValue;
  }
  return ctx;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-[calc(100%-2rem)] sm:w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; gradient: string; bar: string; shadow: string }> = {
  success: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-600',
    bar: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-500/30',
  },
  error: {
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-600',
    bar: 'from-red-400 to-rose-500',
    shadow: 'shadow-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-600',
    bar: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
  },
  info: {
    icon: Info,
    gradient: 'from-sky-500 to-blue-600',
    bar: 'from-sky-400 to-blue-500',
    shadow: 'shadow-sky-500/30',
  },
  loading: {
    icon: Loader2,
    gradient: 'from-violet-500 to-purple-600',
    bar: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-500/30',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`
        relative pointer-events-auto overflow-hidden
        bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/80 dark:border-slate-700/80
        shadow-xl ${config.shadow}
        transition-all duration-300
        ${mounted && !leaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bar}`} />
      {/* Corner glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-[0.08] dark:opacity-[0.15] blur-2xl pointer-events-none`} />

      {/* Progress bar for non-loading toasts */}
      {toast.type !== 'loading' && toast.duration && toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-200/60 dark:bg-slate-700/60 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${config.bar} toast-progress`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}

      <div className="relative flex items-start gap-3 p-4 pr-10">
        <div className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shadow-md`}>
          <Icon className={`w-5 h-5 ${toast.type === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-[13.5px] leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-gray-600 dark:text-slate-400 text-[12.5px] leading-snug mt-0.5">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`mt-2 inline-flex items-center gap-1 text-[12px] font-extrabold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent hover:underline`}
            >
              {toast.action.label} →
            </button>
          )}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors"
        aria-label="Kapat"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <style jsx>{`
        @keyframes toast-progress {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .toast-progress {
          transform-origin: right;
          animation: toast-progress linear forwards;
        }
      `}</style>
    </div>
  );
}
