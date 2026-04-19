'use client';

/**
 * Premium SectionCard — Dashboard içi büyük kartlar için
 * İkon, başlık, alt başlık, opsiyonel action butonu, glass bg, hover lift
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  gradient?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** delay for entrance */
  delay?: number;
}

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  gradient = 'from-slate-500 to-gray-600',
  action,
  children,
  className = '',
  delay = 0,
}: SectionCardProps) {
  return (
    <div
      className={`section-card relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradient} opacity-80`} />

      {/* Corner decorative blob */}
      <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-3xl pointer-events-none`} />

      <div className="relative p-6">
        {(title || action) && (
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-[17px] font-extrabold text-[#0f2847] tracking-tight">{title}</h2>
                {subtitle && (
                  <p className="text-[12.5px] text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>

      <style jsx>{`
        .section-card {
          animation: section-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes section-enter {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
