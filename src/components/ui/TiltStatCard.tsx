'use client';

/**
 * Premium TiltStatCard — 3D tilt, count-up, shimmer, icon pulse, gradient ring
 * tüm dashboard'larda kullanılır
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TiltStatCardProps {
  href?: string;
  label: string;
  value: number | string;
  gradient: string;
  icon: LucideIcon;
  delay?: number;
  helperText?: string;
  /** Numeric count-up devre dışı */
  disableCountUp?: boolean;
}

function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (end === 0) { setVal(0); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return <>{val}</>;
}

export default function TiltStatCard({
  href,
  label,
  value,
  gradient,
  icon: Icon,
  delay = 0,
  helperText = 'Detayları gör',
  disableCountUp = false,
}: TiltStatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glx: 50, gly: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const ry = (x - 0.5) * 10;
    const rx = (0.5 - y) * 10;
    setTilt({ rx, ry, glx: x * 100, gly: y * 100 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0, glx: 50, gly: 50 });

  const isNumeric = typeof value === 'number';

  const content = (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="tilt-card group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/60 p-6 shadow-sm hover:shadow-2xl dark:shadow-slate-900/50 transition-all duration-300 overflow-hidden"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Gradient ring border on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, var(--tw-gradient-stops)) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '2px',
        }}
      />

      {/* Shine follow-cursor */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.glx}% ${tilt.gly}%, rgba(255,255,255,0.7) 0%, transparent 50%)`,
        }}
      />

      {/* Corner glow */}
      <div className={`absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl group-hover:opacity-25 group-hover:scale-125 transition-all duration-500`} />

      {/* Bottom gradient line */}
      <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-start justify-between mb-5">
          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon className="w-6 h-6 relative z-10" />
            {/* Icon pulse glow */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-300`} />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700/60 group-hover:bg-[#0f2847] dark:group-hover:bg-slate-600 flex items-center justify-center transition-colors shrink-0">
            <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-slate-500 group-hover:text-white group-hover:rotate-12 transition-all" />
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</p>
        <p className="text-4xl font-extrabold text-[#0f2847] dark:text-slate-100 mt-1 tabular-nums">
          {isNumeric && !disableCountUp ? <CountUp end={value as number} /> : value}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors">
          <TrendingUp className="w-3 h-3" />
          <span>{helperText}</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}
