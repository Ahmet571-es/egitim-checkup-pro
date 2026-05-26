'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Clock, BarChart2 } from 'lucide-react';

export interface TestShellProps {
  testName: string;
  testIcon: string;
  totalQuestions: number;
  currentQuestion: number;
  timeElapsed?: number;
  timeLimit?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  isLastQuestion?: boolean;
  children: React.ReactNode;
  accentColor?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Madde 14-16: Premium test shell with animated progress, question transitions */
export default function TestShell({
  testName, testIcon, totalQuestions, currentQuestion,
  timeElapsed = 0, timeLimit = 0,
  onPrev, onNext, onSubmit,
  canGoNext = true, canGoPrev = true, isLastQuestion = false,
  children, accentColor = '#10b981',
}: TestShellProps) {
  const progress = totalQuestions > 0 ? ((currentQuestion) / totalQuestions) * 100 : 0;
  const remaining = timeLimit > 0 ? Math.max(0, timeLimit - timeElapsed) : null;
  const isWarning = remaining !== null && remaining < 60;
  const isDanger = remaining !== null && remaining < 15;

  // Madde 15: Progress bar gradient — red→yellow→green as progress increases
  const progressGradient = progress < 33
    ? `linear-gradient(90deg, #ef4444, #f59e0b)`
    : progress < 66
      ? `linear-gradient(90deg, #f59e0b, #10b981)`
      : `linear-gradient(90deg, #10b981, #059669)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2847] via-[#1a3a5c] to-[#0d1f35]">
      {/* Madde 18: D2-style vignette overlay when time is critical */}
      {isDanger && (
        <div className="fixed inset-0 pointer-events-none z-40"
             style={{ boxShadow: 'inset 0 0 120px 40px rgba(239, 68, 68, 0.15)' }} />
      )}

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{testIcon}</span>
              <span className="text-white font-bold text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">{testName}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              {timeLimit > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  isDanger
                    ? 'bg-red-500/30 text-red-200 border border-red-400/50 animate-[heartbeat_1s_ease-in-out_infinite]'
                    : isWarning
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-white/10 text-white/80 border border-white/20'
                }`}>
                  <Clock size={14} />
                  <span>{formatTime(remaining!)}</span>
                </div>
              )}
              {timeLimit === 0 && timeElapsed > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white/60 bg-white/5 border border-white/10">
                  <Clock size={14} />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
              )}

              {/* Question counter with bounce on change */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white bg-white/10 border border-white/20"
                   key={currentQuestion}
                   style={{ animation: 'bounce-in 0.3s ease-out' }}>
                <BarChart2 size={14} />
                <span>{currentQuestion}/{totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Madde 15: Animated gradient progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: progressGradient }}
            />
          </div>
        </div>
      </div>

      {/* ── Content with slide animation ── */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div key={currentQuestion}
             className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6"
             style={{ animation: 'q-slide-in 0.25s ease-out forwards' }}>
          {children}
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="sticky bottom-0 z-50 bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={!canGoPrev || currentQuestion <= 1}
            className="touch-feedback flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft size={18} />
            Önceki Soru
          </button>

          {/* Page dots */}
          <div className="flex gap-1.5 overflow-hidden max-w-[200px]">
            {Array.from({ length: Math.min(totalQuestions, 10) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentQuestion;
              return (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? accentColor : 'rgba(255,255,255,0.3)',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              );
            })}
            {totalQuestions > 10 && <span className="text-white/50 text-xs">...</span>}
          </div>

          {isLastQuestion ? (
            <button
              onClick={onSubmit}
              className="touch-feedback flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-lg pulse-glow"
              style={{ backgroundColor: accentColor }}
            >
              Testi Bitir ✓
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={`touch-feedback flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 ${
                canGoNext ? 'hover:opacity-90 opacity-100 scale-100' : 'opacity-40 scale-95 cursor-not-allowed'
              }`}
              style={{ backgroundColor: canGoNext ? accentColor : 'rgba(255,255,255,0.1)', border: canGoNext ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
            >
              Sonraki Soru
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
