'use client';

/**
 * Premium WelcomeBanner — tüm panellerde tutarlı, role-based gradient
 * Aurora ışıklar, shimmer, floating emoji, animated badge
 */

import { Sparkles } from 'lucide-react';
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

const AURORAS: Record<UserRole, { a: string; b: string }> = {
  admin:        { a: 'bg-yellow-200/30', b: 'bg-rose-200/30' },
  school_admin: { a: 'bg-cyan-200/30',   b: 'bg-indigo-200/30' },
  teacher:      { a: 'bg-emerald-200/30', b: 'bg-cyan-200/30' },
  student:      { a: 'bg-fuchsia-200/30', b: 'bg-indigo-200/30' },
  parent:       { a: 'bg-rose-200/30',    b: 'bg-orange-200/30' },
};

interface WelcomeBannerProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  badge?: string;
  emoji?: string;
  children?: React.ReactNode;
}

export default function WelcomeBanner({
  role,
  title,
  subtitle,
  badge = 'Bugünün özeti',
  emoji = '👋',
  children,
}: WelcomeBannerProps) {
  const gradient = GRADIENTS[role];
  const shadow = SHADOWS[role];
  const aurora = AURORAS[role];

  return (
    <div
      className={`relative mb-6 bg-gradient-to-br ${gradient} rounded-3xl p-7 sm:p-9 text-white shadow-xl ${shadow} overflow-hidden welcome-enter`}
    >
      {/* Aurora blurs */}
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full ${aurora.a} blur-3xl welcome-aurora-1`} />
      <div className={`absolute bottom-0 left-1/3 w-56 h-56 rounded-full ${aurora.b} blur-3xl welcome-aurora-2`} />

      {/* Shimmer sweep */}
      <div className="pointer-events-none absolute -top-1/2 -left-1/4 w-full h-full rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent welcome-shimmer" />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3 h-3 welcome-sparkle" />
            {badge}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight drop-shadow-sm">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {emoji && (
          <div className="hidden sm:flex w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-md items-center justify-center shrink-0 border border-white/20 welcome-float">
            <span className="text-3xl lg:text-4xl">{emoji}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .welcome-enter {
          animation: welcome-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes welcome-enter {
          0% { opacity: 0; transform: translateY(-14px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .welcome-aurora-1 {
          animation: aurora-a 9s ease-in-out infinite;
        }
        .welcome-aurora-2 {
          animation: aurora-b 11s ease-in-out infinite 1s;
        }
        @keyframes aurora-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
          50% { transform: translate(-20px, 30px) scale(1.1); opacity: 1; }
        }
        @keyframes aurora-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(30px, -20px) scale(1.08); opacity: 1; }
        }
        .welcome-shimmer {
          animation: shimmer-sweep 7s ease-in-out infinite;
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-120%) rotate(12deg); }
          100% { transform: translateX(220%) rotate(12deg); }
        }
        .welcome-float {
          animation: float-gentle 3.5s ease-in-out infinite;
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(4deg); }
        }
        .welcome-sparkle {
          animation: sparkle-spin 4s linear infinite;
        }
        @keyframes sparkle-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
