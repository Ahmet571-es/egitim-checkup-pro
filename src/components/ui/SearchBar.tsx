'use client';

/**
 * Premium SearchBar — tutarlı arama kutusu
 */

import { Search, X } from 'lucide-react';
import type { UserRole } from '@/types';

const ICON_GRADIENTS: Record<UserRole, string> = {
  admin:        'from-amber-500 to-orange-600',
  school_admin: 'from-sky-500 to-blue-600',
  teacher:      'from-emerald-500 to-teal-600',
  student:      'from-violet-500 to-purple-600',
  parent:       'from-pink-500 to-rose-600',
};

const RINGS: Record<UserRole, string> = {
  admin:        'focus:ring-amber-500/30 focus:border-amber-400',
  school_admin: 'focus:ring-sky-500/30 focus:border-sky-400',
  teacher:      'focus:ring-emerald-500/30 focus:border-emerald-400',
  student:      'focus:ring-violet-500/30 focus:border-violet-400',
  parent:       'focus:ring-pink-500/30 focus:border-pink-400',
};

const GLOW: Record<UserRole, string> = {
  admin:        'from-amber-400/0 via-amber-400/40 to-amber-400/0',
  school_admin: 'from-sky-400/0 via-sky-400/40 to-sky-400/0',
  teacher:      'from-emerald-400/0 via-emerald-400/40 to-emerald-400/0',
  student:      'from-violet-400/0 via-violet-400/40 to-violet-400/0',
  parent:       'from-pink-400/0 via-pink-400/40 to-pink-400/0',
};

interface SearchBarProps {
  role: UserRole;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  role,
  value,
  onChange,
  placeholder = 'Ara...',
  className = '',
}: SearchBarProps) {
  const iconGrad = ICON_GRADIENTS[role];
  const ring = RINGS[role];
  const glow = GLOW[role];

  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${glow} rounded-2xl blur-lg opacity-0 group-focus-within:opacity-60 transition-opacity pointer-events-none`} />
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br ${iconGrad} flex items-center justify-center shadow-md pointer-events-none`}>
          <Search className="w-4 h-4 text-white" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-16 pr-12 py-4 rounded-2xl bg-white/90 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm text-[14px] font-medium text-[#0f2847] dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all ${ring}`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/60 transition"
            title="Temizle"
            type="button"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
}
