'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
}

/** Madde 9: Premium StatCard with count-up + hover lift + icon pulse */
export default function StatCard({ icon: Icon, value, label, color = 'emerald' }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', glow: 'shadow-emerald-200/50' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100',   glow: 'shadow-amber-200/50' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     iconBg: 'bg-sky-100',     glow: 'shadow-sky-200/50' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  iconBg: 'bg-violet-100',  glow: 'shadow-violet-200/50' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    iconBg: 'bg-pink-100',    glow: 'shadow-pink-200/50' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    iconBg: 'bg-rose-100',    glow: 'shadow-rose-200/50' },
  };
  const c = colorMap[color] || colorMap.emerald;

  // Count-up for numeric values
  const isNumeric = typeof value === 'number' || /^\d+$/.test(String(value));
  const targetNum = isNumeric ? Number(value) : 0;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (!isNumeric) return;
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 1000, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayVal(Math.round(eased * targetNum));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [targetNum, isNumeric]);

  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm
      hover:-translate-y-1 hover:shadow-lg hover:${c.glow} transition-all duration-300
      group cursor-default`}
      style={{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6)' }}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center relative`}>
          <Icon className={`w-5 h-5 ${c.text} relative z-10`} />
          {/* Subtle icon glow on hover */}
          <div className={`absolute inset-0 rounded-xl ${c.iconBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
               style={{ filter: 'blur(8px)' }} />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[#0f2847]">
            {isNumeric ? displayVal : value}
          </p>
          <p className="text-[13px] text-gray-500 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}
