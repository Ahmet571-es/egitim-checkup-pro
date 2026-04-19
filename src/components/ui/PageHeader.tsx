'use client';

/**
 * Premium PageHeader — Liste sayfalarının başlığı için
 * Küçük welcome banner + count + action button
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

const GRADIENTS: Record<UserRole, string> = {
  admin:        'from-amber-500 via-orange-500 to-rose-500',
  school_admin: 'from-sky-500 via-blue-500 to-indigo-600',
  teacher:      'from-emerald-500 via-teal-500 to-cyan-600',
  student:      'from-violet-500 via-purple-500 to-fuchsia-600',
  parent:       'from-pink-500 via-rose-500 to-red-500',
};

const SHADOWS: Record<UserRole, string> = {
  admin:        'shadow-amber-500/30',
  school_admin: 'shadow-sky-500/30',
  teacher:      'shadow-emerald-500/30',
  student:      'shadow-violet-500/30',
  parent:       'shadow-pink-500/30',
};

interface PageHeaderProps {
  role: UserRole;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  action?: ReactNode;
}

export default function PageHeader({
  role,
  icon: Icon,
  title,
  subtitle,
  count,
  countLabel,
  action,
}: PageHeaderProps) {
  const gradient = GRADIENTS[role];
  const shadow = SHADOWS[role];

  return (
    <div className={`relative mb-6 bg-gradient-to-br ${gradient} rounded-3xl p-6 sm:p-7 text-white shadow-xl ${shadow} overflow-hidden header-enter`}>
      {/* Aurora */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl header-aurora-1" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/10 blur-3xl header-aurora-2" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-lg">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">{title}</h1>
            {(subtitle || count !== undefined) && (
              <p className="text-white/90 text-[13px] sm:text-sm mt-1 leading-relaxed">
                {count !== undefined && (
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                    {count} {countLabel || 'kayıt'}
                  </span>
                )}
                {count !== undefined && subtitle && <span className="opacity-50 mx-1.5">·</span>}
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="shrink-0 w-full sm:w-auto">
            {action}
          </div>
        )}
      </div>

      <style jsx>{`
        .header-enter {
          animation: header-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes header-enter {
          0% { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .header-aurora-1 {
          animation: aurora-drift-1 9s ease-in-out infinite;
        }
        .header-aurora-2 {
          animation: aurora-drift-2 11s ease-in-out infinite 1s;
        }
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.1); }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
