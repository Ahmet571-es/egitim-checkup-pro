'use client';

/**
 * Premium ActionButton — Header action butonu (Plus + Yeni X)
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ActionButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ActionButton({
  onClick,
  type = 'button',
  variant = 'primary',
  icon: Icon,
  children,
  disabled,
  className = '',
  fullWidth = false,
  size = 'md',
}: ActionButtonProps) {
  const sizes = {
    sm: 'px-3.5 py-2 text-[12.5px]',
    md: 'px-5 py-2.5 text-[13.5px]',
    lg: 'px-6 py-3 text-[14.5px]',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-[18px] h-[18px]',
  };

  const variantClasses: Record<string, string> = {
    primary: 'bg-white dark:bg-slate-800 text-[#0f2847] dark:text-slate-100 shadow-lg shadow-black/10 dark:shadow-black/30 hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-xl border border-white/80 dark:border-slate-700',
    secondary: 'bg-white/20 backdrop-blur-md text-white shadow-md hover:bg-white/30 border border-white/30',
    ghost: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700',
    danger: 'bg-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </button>
  );
}
