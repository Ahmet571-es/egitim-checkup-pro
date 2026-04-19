'use client';

/**
 * Premium EmptyState — tüm liste sayfalarında tutarlı empty state
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

const GRADIENTS: Record<UserRole, string> = {
  admin:        'from-amber-500 to-orange-600',
  school_admin: 'from-sky-500 to-blue-600',
  teacher:      'from-emerald-500 to-teal-600',
  student:      'from-violet-500 to-purple-600',
  parent:       'from-pink-500 to-rose-600',
};

const BLOBS: Record<UserRole, string> = {
  admin:        'from-amber-200 to-orange-200',
  school_admin: 'from-sky-200 to-blue-200',
  teacher:      'from-emerald-200 to-teal-200',
  student:      'from-violet-200 to-purple-200',
  parent:       'from-pink-200 to-rose-200',
};

interface EmptyStateProps {
  role: UserRole;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({
  role,
  icon: Icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  const gradient = GRADIENTS[role];
  const blob = BLOBS[role];

  return (
    <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-12 text-center shadow-sm overflow-hidden empty-enter">
      <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${blob} opacity-30 blur-3xl`} />
      <div className={`absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-br ${blob} opacity-20 blur-3xl`} />
      <div className="relative">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg empty-bounce`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <p className="text-[17px] text-[#0f2847] font-extrabold mb-2">{title}</p>
        {subtitle && (
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>

      <style jsx>{`
        .empty-enter {
          animation: empty-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes empty-enter {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        .empty-bounce {
          animation: empty-bounce 2.5s ease-in-out infinite;
        }
        @keyframes empty-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-3deg); }
        }
      `}</style>
    </div>
  );
}
