'use client';

/**
 * Premium Modal — tutarlı modal wrapper
 */

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function PremiumModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: PremiumModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 modal-overlay"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md modal-backdrop" />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full ${SIZES[size]} max-h-[90vh] overflow-hidden flex flex-col modal-content border border-white/60 dark:border-slate-700/60`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-gray-100 dark:border-slate-700/60 bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800/40 dark:to-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[17px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">{title}</h3>
              {subtitle && <p className="text-[12.5px] text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/60 active:scale-95 transition"
              aria-label="Kapat"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-gray-700 dark:text-slate-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/60 bg-gradient-to-b from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-800/40">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-backdrop {
          animation: backdrop-fade 200ms ease-out backwards;
        }
        @keyframes backdrop-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          animation: modal-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
