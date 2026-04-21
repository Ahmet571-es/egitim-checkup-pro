'use client';

/**
 * AuthLayout — Premium giriş/kayıt sayfaları için zemin
 * Role-based brand gradient, aurora, grid pattern, glass card
 */

import Link from 'next/link';
import { GraduationCap, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthRole = 'student' | 'teacher' | 'parent';

const GRADIENTS: Record<AuthRole, string> = {
  student: 'from-violet-500 via-purple-500 to-fuchsia-600',
  teacher: 'from-emerald-500 via-teal-500 to-cyan-600',
  parent: 'from-pink-500 via-rose-500 to-fuchsia-500',
};

const AMBIENT: Record<AuthRole, { a: string; b: string }> = {
  student: {
    a: 'from-violet-200/40 to-purple-200/30',
    b: 'from-fuchsia-200/30 to-pink-200/20',
  },
  teacher: {
    a: 'from-emerald-200/40 to-teal-200/30',
    b: 'from-cyan-200/30 to-sky-200/20',
  },
  parent: {
    a: 'from-pink-200/40 to-rose-200/30',
    b: 'from-fuchsia-200/30 to-pink-200/20',
  },
};

const BADGES: Record<AuthRole, string> = {
  student: 'Öğrenci Girişi',
  teacher: 'Öğretmen Girişi',
  parent: 'Veli Girişi',
};

interface AuthLayoutProps {
  role?: AuthRole;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export default function AuthLayout({
  role = 'student',
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: AuthLayoutProps) {
  const gradient = GRADIENTS[role];
  const ambient = AMBIENT[role];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Ambient aurora blobs */}
      <div className={`pointer-events-none fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br ${ambient.a} dark:opacity-40 blur-3xl auth-blob-1`} />
      <div className={`pointer-events-none fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br ${ambient.b} dark:opacity-30 blur-3xl auth-blob-2`} />

      {/* Subtle grid - light */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02] dark:opacity-0"
        style={{
          backgroundImage: `linear-gradient(rgba(15,40,71,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,40,71,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Subtle grid - dark */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} auth-enter`}>
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-7 group">
          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
            <GraduationCap className="w-6 h-6 text-white relative z-10" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent" />
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-50 blur-xl -z-10`} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Eğitim Check-Up</h1>
            <p className="text-[10.5px] text-gray-500 dark:text-slate-400 font-bold tracking-wider uppercase -mt-0.5">{BADGES[role]}</p>
          </div>
        </Link>

        {/* Glass card */}
        <div className="relative bg-white/85 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/60 shadow-2xl overflow-hidden">
          {/* Top gradient strip */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
          {/* Corner glow */}
          <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] dark:opacity-[0.15] blur-3xl pointer-events-none`} />

          <div className="relative p-8">
            {/* Badge */}
            <div className={`inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-[10.5px] font-extrabold tracking-wider shadow-md`}>
              <Sparkles className="w-3 h-3" />
              {BADGES[role]}
            </div>

            <h2 className="text-[26px] font-extrabold text-[#0f2847] dark:text-slate-100 mb-1.5 tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13.5px] text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">{subtitle}</p>}

            {children}
          </div>
        </div>

        {footer && <div className="mt-6 text-center text-gray-500 dark:text-slate-400">{footer}</div>}
      </div>

      <style>{`
        @keyframes auth-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-enter {
          animation: auth-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes auth-blob-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.08); }
        }
        @keyframes auth-blob-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        .auth-blob-1 { animation: auth-blob-drift-1 20s ease-in-out infinite; }
        .auth-blob-2 { animation: auth-blob-drift-2 25s ease-in-out infinite 3s; }
      `}</style>
    </div>
  );
}
