'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Award, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export interface ScoreItem {
  label: string;
  value: string | number;
  pct?: number;
  color?: string;
  icon?: string;
}

export interface TestResultProps {
  testName: string;
  testIcon: string;
  mainResult: string;
  mainDescription: string;
  scores: ScoreItem[];
  report?: string;
  accentColor?: string;
  onRetake?: () => void;
}

/** Madde 17: Animated score bar */
function MiniBar({ pct, color = '#10b981', delay = 0 }: { pct: number; color?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.min(100, Math.max(0, pct))), 100 + delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
        />
      </div>
      <span className="text-xs text-white/50 w-9 text-right">%{pct}</span>
    </div>
  );
}

/** Madde 17: Confetti particle component */
function Confetti() {
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#06b6d4'];
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Madde 17: Circular score ring */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <svg width="120" height="120" className="mx-auto">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

/** Madde 17: Premium test result with confetti, bounce, animated scores */
export default function TestResult({
  testName, testIcon, mainResult, mainDescription,
  scores, report, accentColor = '#10b981', onRetake,
}: TestResultProps) {
  const [showReport, setShowReport] = React.useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2847] via-[#1a3a5c] to-[#0d1f35] p-4 pb-10">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Success Header — bounce in ── */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center"
             style={{ animation: 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
               style={{ backgroundColor: accentColor + '33', border: `2px solid ${accentColor}` }}>
            <CheckCircle size={32} style={{ color: accentColor }} />
          </div>
          <p className="text-white/60 text-sm mb-1">Test Tamamlandı</p>
          <h1 className="text-white font-extrabold text-2xl mb-2">
            {testIcon} {testName}
          </h1>
          <div
            className="inline-block px-4 py-2 rounded-full font-bold text-white text-lg"
            style={{ backgroundColor: accentColor }}
          >
            {mainResult}
          </div>
          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-sm mx-auto">
            {mainDescription}
          </p>
        </div>

        {/* ── Score Table — staggered fade-in ── */}
        {scores.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5"
               style={{ animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards', opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} style={{ color: accentColor }} />
              <h2 className="text-white font-bold">Sonuç Detayları</h2>
            </div>
            <div className="space-y-3">
              {scores.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3"
                     style={{ animation: `fade-in-up 0.3s ease-out ${0.4 + i * 0.1}s forwards`, opacity: 0 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}
                    <span className="text-white/70 text-sm truncate">{item.label}</span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-white font-semibold text-sm">{item.value}</span>
                    {item.pct != null && (
                      <MiniBar pct={item.pct} color={item.color ?? accentColor} delay={i * 200} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Report ── */}
        {report && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
               style={{ animation: 'fade-in-up 0.4s ease-out 0.6s forwards', opacity: 0 }}>
            <button
              onClick={() => setShowReport(!showReport)}
              className="w-full flex items-center justify-between px-5 py-4 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              <span>📄 Detaylı Raporu Görüntüle</span>
              <span className={`text-white/50 text-sm transition-transform duration-200 ${showReport ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showReport && (
              <div className="px-5 pb-5 border-t border-white/10" style={{ animation: 'fade-in-up 0.2s ease-out forwards' }}>
                <pre className="text-white/80 text-xs sm:text-sm whitespace-pre-wrap font-sans leading-relaxed mt-4 max-h-96 overflow-y-auto">
                  {report}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons — delayed appearance ── */}
        <div className="grid grid-cols-2 gap-3"
             style={{ animation: 'fade-in-up 0.4s ease-out 0.8s forwards', opacity: 0 }}>
          {onRetake && (
            <button
              onClick={onRetake}
              className="touch-feedback flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 active:scale-95 transition-all"
            >
              <RotateCcw size={16} />
              Tekrar Yap
            </button>
          )}
          <Link
            href="/student/my-tests"
            className="touch-feedback flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 pulse-glow"
            style={{ backgroundColor: accentColor }}
          >
            <Home size={16} />
            Testlerime Dön
          </Link>
        </div>

      </div>
    </div>
  );
}
