'use client';

/**
 * PanelBackground — her panelde kullanılacak hareketli ambient arka plan
 * Aurora blob'lar, mesh gradient, noise texture
 */

import type { UserRole } from '@/types';

const AMBIENTS: Record<UserRole, { a: string; b: string; c: string }> = {
  admin:        {
    a: 'from-amber-200/40 to-orange-200/30',
    b: 'from-rose-200/30 to-pink-200/20',
    c: 'from-yellow-100/30 to-amber-100/20',
  },
  school_admin: {
    a: 'from-sky-200/40 to-blue-200/30',
    b: 'from-indigo-200/30 to-violet-200/20',
    c: 'from-cyan-100/30 to-sky-100/20',
  },
  teacher:      {
    a: 'from-emerald-200/40 to-teal-200/30',
    b: 'from-cyan-200/30 to-sky-200/20',
    c: 'from-green-100/30 to-emerald-100/20',
  },
  student:      {
    a: 'from-violet-200/40 to-purple-200/30',
    b: 'from-fuchsia-200/30 to-pink-200/20',
    c: 'from-indigo-100/30 to-violet-100/20',
  },
  parent:       {
    a: 'from-pink-200/40 to-rose-200/30',
    b: 'from-orange-200/30 to-red-200/20',
    c: 'from-fuchsia-100/30 to-pink-100/20',
  },
};

interface PanelBackgroundProps {
  role: UserRole;
}

export default function PanelBackground({ role }: PanelBackgroundProps) {
  const c = AMBIENTS[role];

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Büyük aurora blob'lar */}
        <div className={`absolute top-[-20%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-br ${c.a} dark:opacity-40 blur-3xl panel-blob-1`} />
        <div className={`absolute bottom-[-25%] left-[-15%] w-[650px] h-[650px] rounded-full bg-gradient-to-br ${c.b} dark:opacity-30 blur-3xl panel-blob-2`} />
        <div className={`absolute top-[30%] left-[30%] w-[500px] h-[500px] rounded-full bg-gradient-to-br ${c.c} dark:opacity-20 blur-3xl panel-blob-3`} />

        {/* Noise / grain texture */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
          }}
        />

        {/* Subtle grid - light */}
        <div
          className="absolute inset-0 opacity-[0.018] dark:opacity-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,40,71,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,40,71,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Subtle grid - dark */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <style jsx>{`
        .panel-blob-1 {
          animation: blob-drift-1 22s ease-in-out infinite;
        }
        .panel-blob-2 {
          animation: blob-drift-2 26s ease-in-out infinite 2s;
        }
        .panel-blob-3 {
          animation: blob-drift-3 30s ease-in-out infinite 4s;
        }
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(30px, -20px) scale(0.95); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.92); }
        }
        @keyframes blob-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.05); }
        }
      `}</style>
    </>
  );
}
