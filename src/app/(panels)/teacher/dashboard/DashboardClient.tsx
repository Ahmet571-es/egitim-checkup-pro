'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Users, FileCheck2, Sparkles, ArrowUpRight, TrendingUp } from 'lucide-react';

/* ════════ Count-Up sayaç ════════ */
function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (end === 0) { setVal(0); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return <>{val}</>;
}

/* ════════ Tilt Kartı ════════ */
function TiltCard({
  href, label, value, gradient, Icon, delay,
}: {
  href: string; label: string; value: number; gradient: string;
  Icon: React.ComponentType<{ className?: string }>; delay: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glx: 50, gly: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const ry = (x - 0.5) * 8;
    const rx = (0.5 - y) * 8;
    setTilt({ rx, ry, glx: x * 100, gly: y * 100 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0, glx: 50, gly: 50 });

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="group relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden card-enter"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: 'preserve-3d',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Hover glow takip eden ışık */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.glx}% ${tilt.gly}%, rgba(255,255,255,0.6) 0%, transparent 50%)`,
        }}
      />

      {/* Köşe parlama efekti */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`} />

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#0f2847] flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-white group-hover:rotate-12 transition-all" />
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-4xl font-extrabold text-[#0f2847] mt-1 tabular-nums">
          <CountUp end={value} />
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
          <TrendingUp className="w-3 h-3" />
          <span>Detayları gör</span>
        </div>
      </div>
    </Link>
  );
}

/* ════════ Ana Dashboard ════════ */
export default function DashboardClient({
  firstName, studentCount, resultCount,
}: {
  firstName: string;
  studentCount: number;
  resultCount: number;
}) {
  return (
    <div className="relative">
      {/* Arka plan dekoratif blob'lar */}
      <div className="pointer-events-none fixed top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 blur-3xl animate-blob" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-sky-200/30 to-violet-200/20 blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none fixed top-[30%] left-[40%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/10 blur-3xl animate-blob animation-delay-4000" />

      {/* HOŞ GELDİN BANNER */}
      <div className="relative mb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-7 sm:p-9 text-white shadow-xl shadow-emerald-500/30 overflow-hidden card-enter">
        {/* Hareketli ışıklar */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-cyan-200/20 blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute -top-1/2 -left-1/4 w-full h-full rotate-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
              Bugünün özeti
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">
              Hoş geldiniz, <span className="inline-block animate-wave-text">{firstName}!</span>
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base max-w-xl">
              Tüm okullardaki öğrencileri Öğrencilerim sayfasından yönetebilirsiniz.
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center shrink-0 animate-float">
            <span className="text-3xl lg:text-4xl">👋</span>
          </div>
        </div>
      </div>

      {/* STAT KARTLAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TiltCard
          href="/teacher/students"
          label="Öğrencilerim"
          value={studentCount}
          gradient="from-sky-500 to-blue-600"
          Icon={Users}
          delay={100}
        />
        <TiltCard
          href="/teacher/results"
          label="Tamamlanan Test"
          value={resultCount}
          gradient="from-violet-500 to-purple-600"
          Icon={FileCheck2}
          delay={200}
        />
      </div>

      {/* Stiller — global keyframe'ler */}
      <style jsx global>{`
        @keyframes card-enter {
          0% { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-enter {
          animation: card-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
          75% { transform: translate(40px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 18s ease-in-out infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(200%) rotate(12deg); }
        }
        .animate-shimmer { animation: shimmer 6s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }

        @keyframes wave-text {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-wave-text {
          display: inline-block;
          animation: wave-text 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
