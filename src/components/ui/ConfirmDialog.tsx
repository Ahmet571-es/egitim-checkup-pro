'use client';

/**
 * Premium Confirm Dialog
 * Replacement for native confirm() with beautiful modal UX
 */

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { AlertTriangle, X, Trash2, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: React.ElementType;
  gradient: string;
  bar: string;
  iconBg: string;
  confirmBtn: string;
  shadow: string;
}> = {
  danger: {
    icon: Trash2,
    gradient: 'from-red-500 to-rose-600',
    bar: 'from-red-500 via-rose-500 to-red-600',
    iconBg: 'from-red-500 to-rose-600',
    confirmBtn: 'from-red-500 via-rose-500 to-red-600 shadow-red-500/40 hover:shadow-red-500/50',
    shadow: 'shadow-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500 to-orange-600',
    bar: 'from-amber-500 via-orange-500 to-amber-600',
    iconBg: 'from-amber-500 to-orange-600',
    confirmBtn: 'from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/40 hover:shadow-amber-500/50',
    shadow: 'shadow-amber-500/30',
  },
  info: {
    icon: Info,
    gradient: 'from-sky-500 to-blue-600',
    bar: 'from-sky-500 via-blue-500 to-sky-600',
    iconBg: 'from-sky-500 to-blue-600',
    confirmBtn: 'from-sky-500 via-blue-500 to-sky-600 shadow-sky-500/40 hover:shadow-sky-500/50',
    shadow: 'shadow-sky-500/30',
  },
  success: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-600',
    bar: 'from-emerald-500 via-teal-500 to-emerald-600',
    iconBg: 'from-emerald-500 to-teal-600',
    confirmBtn: 'from-emerald-500 via-teal-500 to-emerald-600 shadow-emerald-500/40 hover:shadow-emerald-500/50',
    shadow: 'shadow-emerald-500/30',
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    resolve: null,
    title: '',
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      setState({
        open: true,
        resolve,
        variant: options.variant ?? 'warning',
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Onayla',
        cancelLabel: options.cancelLabel ?? 'Vazgeç',
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, open: false, resolve: null }));
  }, [state]);

  // ESC key closes dialog
  useEffect(() => {
    if (!state.open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [state.open, handleCancel]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <ConfirmDialog
          variant={state.variant ?? 'warning'}
          title={state.title}
          description={state.description}
          confirmLabel={state.confirmLabel ?? 'Onayla'}
          cancelLabel={state.cancelLabel ?? 'Vazgeç'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback: if used outside provider
    return {
      confirm: (options: ConfirmOptions): Promise<boolean> => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.confirm(options.description ? `${options.title}\n\n${options.description}` : options.title));
        }
        return Promise.resolve(false);
      },
    };
  }
  return ctx;
}

interface ConfirmDialogProps {
  variant: ConfirmVariant;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ variant, title, description, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? 'confirm-desc' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md confirm-backdrop"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl ${config.shadow} overflow-hidden confirm-enter`}>
        {/* Top accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bar}`} />
        {/* Corner glow */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 dark:opacity-20 blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-br ${config.gradient} opacity-[0.06] dark:opacity-[0.12] blur-3xl pointer-events-none`} />

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors z-10"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-7">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${config.iconBg} flex items-center justify-center shadow-lg ${config.shadow} relative overflow-hidden`}>
            <Icon className="w-8 h-8 text-white relative z-10 drop-shadow" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
          </div>

          {/* Title + Description */}
          <h2 id="confirm-title" className="text-[20px] font-extrabold text-[#0f2847] dark:text-slate-100 text-center mb-2 tracking-tight">
            {title}
          </h2>
          {description && (
            <p id="confirm-desc" className="text-[13.5px] text-gray-600 dark:text-slate-400 text-center leading-relaxed mb-6">
              {description}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 font-extrabold text-[13.5px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-[0.97]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${config.confirmBtn} text-white font-extrabold text-[13.5px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.97]`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes confirm-enter {
            from { opacity: 0; transform: translateY(10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .confirm-enter {
            animation: confirm-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          @keyframes confirm-backdrop-enter {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .confirm-backdrop {
            animation: confirm-backdrop-enter 200ms ease-out backwards;
          }
        `}</style>
      </div>
    </div>
  );
}
