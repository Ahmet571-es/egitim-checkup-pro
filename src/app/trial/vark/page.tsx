'use client';

/**
 * F2: VARK Trial Page (Pilot)
 *
 * Anonim, kayıtsız, sıfır maliyetli (API key kullanmaz).
 * - Skor: client-side calculateVark()
 * - Rapor: statik şablon (VARK_STYLES)
 * - Grafik: pure SVG/CSS bars
 *
 * Akış: intro → questions (16 soru, 1'er ekran) → result (grafik + özet + CTA)
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye, GraduationCap, Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  RefreshCw, BarChart3, BookOpen, AlertCircle
} from 'lucide-react';
import { VARK_QUESTIONS, VARK_STYLES } from '@/lib/tests/vark/data';
import { calculateVark } from '@/lib/tests/vark/engine';
import type { VarkScores } from '@/lib/tests/types';

type Stage = 'intro' | 'questions' | 'result';

const STYLE_COLORS: Record<string, { bg: string; text: string; bar: string; ring: string }> = {
  V: { bg: 'bg-sky-100',     text: 'text-sky-700',     bar: 'bg-gradient-to-r from-sky-400 to-blue-500',         ring: 'ring-sky-400' },
  A: { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-gradient-to-r from-amber-400 to-orange-500',     ring: 'ring-amber-400' },
  R: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',     ring: 'ring-emerald-400' },
  K: { bg: 'bg-rose-100',    text: 'text-rose-700',    bar: 'bg-gradient-to-r from-rose-400 to-pink-500',        ring: 'ring-rose-400' },
};

export default function VarkTrialPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<VarkScores | null>(null);

  // Result hesaplandığında scroll en üste
  useEffect(() => {
    if (stage === 'result' || stage === 'questions') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stage, currentQ]);

  const totalQuestions = VARK_QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;
  const currentQuestion = VARK_QUESTIONS[currentQ];
  const isLastQuestion = currentQ === totalQuestions - 1;
  const hasAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  function handleAnswer(option: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  }

  function handleNext() {
    if (!hasAnswered) return;
    if (isLastQuestion) {
      const result = calculateVark(answers);
      setScores(result);
      setStage('result');
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  function handlePrev() {
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  }

  function handleRestart() {
    setStage('intro');
    setCurrentQ(0);
    setAnswers({});
    setScores(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Üst nav */}
      <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:scale-[1.02] transition-transform">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight">Eğitim Check-Up</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#0f2847] flex items-center gap-1.5 py-2">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {stage === 'intro' && <IntroStage onStart={() => setStage('questions')} />}

        {stage === 'questions' && currentQuestion && (
          <QuestionStage
            question={currentQuestion}
            currentQ={currentQ}
            total={totalQuestions}
            progress={progress}
            selected={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            isLast={isLastQuestion}
            hasAnswered={hasAnswered}
          />
        )}

        {stage === 'result' && scores && <ResultStage scores={scores} onRestart={handleRestart} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGE: INTRO
   ═══════════════════════════════════════════════════════════════ */

function IntroStage({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-amber-200 shadow-sm mb-6">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="text-[13px] font-bold text-[#0f2847]">Ücretsiz Deneme</span>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f2847] mb-4 leading-tight">
        VARK Öğrenme Stilleri Testi
      </h1>
      <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
        Hangi yöntemle daha kolay öğrendiğini keşfet. Görsel, işitsel, okuma-yazma ve kinestetik
        tercihlerini ölç.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-amber-600">16</div>
          <div className="text-xs text-gray-500 font-semibold">soru</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-orange-600">~5</div>
          <div className="text-xs text-gray-500 font-semibold">dakika</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-rose-600">Anlık</div>
          <div className="text-xs text-gray-500 font-semibold">sonuç</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-base shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all"
      >
        <Sparkles className="w-5 h-5" />
        Teste Başla
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="mt-10 max-w-md mx-auto bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Bilgi:</strong> Bu deneme testi kayıt gerektirmez ve verilerin saklanmaz.
          Detaylı analiz, kişisel öneriler ve PDF raporu için ücretli pakete üye olmanız gerekir.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGE: QUESTIONS
   ═══════════════════════════════════════════════════════════════ */

function QuestionStage({
  question, currentQ, total, progress, selected, onAnswer, onNext, onPrev, isLast, hasAnswered,
}: {
  question: typeof VARK_QUESTIONS[0];
  currentQ: number;
  total: number;
  progress: number;
  selected: string | undefined;
  onAnswer: (opt: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
  hasAnswered: boolean;
}) {
  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#0f2847]">
            Soru {currentQ + 1} / {total}
          </span>
          <span className="text-sm text-amber-600 font-extrabold">%{Math.round(progress)}</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-10">
        <h2 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-6 leading-tight">
          {question.text}
        </h2>

        <div className="space-y-3">
          {(['a', 'b', 'c', 'd'] as const).map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onAnswer(opt)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 group flex items-start gap-4
                  ${isSelected
                    ? 'border-amber-500 bg-amber-50 shadow-md ring-4 ring-amber-200'
                    : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm transition-all
                    ${isSelected
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700'}`}
                >
                  {opt.toUpperCase()}
                </div>
                <span className={`flex-1 text-sm sm:text-base leading-relaxed pt-1.5
                  ${isSelected ? 'text-[#0f2847] font-semibold' : 'text-gray-700'}`}>
                  {question.options[opt]}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentQ === 0}
          className="px-5 py-3 rounded-xl bg-white/80 border border-white/80 font-bold text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasAnswered}
          className={`flex-1 sm:flex-none sm:px-8 px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all
            ${hasAnswered
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {isLast ? 'Sonucu Gör' : 'İleri'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGE: RESULT (grafik + statik kısa rapor + CTA)
   ═══════════════════════════════════════════════════════════════ */

function ResultStage({ scores, onRestart }: { scores: VarkScores; onRestart: () => void }) {
  const dominantKey = scores.dominant[0];
  const dominantInfo = VARK_STYLES[dominantKey];
  const dominantPct = scores.percentages[dominantKey] ?? 0;

  // İkincil stil (multimodal değilse)
  const secondaryKey = scores.sorted[1]?.[0];
  const secondaryInfo = secondaryKey ? VARK_STYLES[secondaryKey] : null;

  // Kısa rapor cümleleri (statik şablon)
  const summary = useMemo(() => {
    if (scores.isMultimodal) {
      const top2 = scores.sorted.slice(0, 2).map((s) => VARK_STYLES[s[0]]?.name.split(' ')[0]).filter(Boolean).join(' ve ');
      return `Çok yönlü bir öğrenicisin — ${top2} stilleri arasında dengeli bir profilin var. Bu, farklı yöntemleri esnek biçimde kullanabildiğin anlamına gelir.`;
    }
    return dominantInfo?.description ?? '';
  }, [scores, dominantInfo]);

  // En önemli 2 study tip
  const topTips = (dominantInfo?.studyTips ?? []).slice(0, 2);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-[13px] font-bold text-emerald-900">Test Tamamlandı</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0f2847] mb-2">Sonucun Hazır</h1>
        <p className="text-base text-gray-600">VARK Öğrenme Stilleri Profilin</p>
      </div>

      {/* GRAFIK — yatay bars */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-extrabold text-[#0f2847]">Öğrenme Stili Dağılımın</h2>
        </div>
        <div className="space-y-4">
          {scores.sorted.map(([key], idx) => {
            const info = VARK_STYLES[key];
            const pct = scores.percentages[key] ?? 0;
            const colors = STYLE_COLORS[key];
            const isDominant = idx === 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info?.icon}</span>
                    <span className={`text-sm font-bold ${isDominant ? 'text-[#0f2847]' : 'text-gray-700'}`}>
                      {info?.name}
                    </span>
                    {isDominant && (
                      <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full tracking-wider">
                        BASKIN
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-black ${isDominant ? 'text-amber-600' : 'text-gray-700'}`}>
                    %{pct.toFixed(0)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors?.bar} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KISA RAPOR — statik şablon */}
      <div className={`bg-gradient-to-br ${dominantKey === 'V' ? 'from-sky-50 to-blue-50' : dominantKey === 'A' ? 'from-amber-50 to-orange-50' : dominantKey === 'R' ? 'from-emerald-50 to-teal-50' : 'from-rose-50 to-pink-50'} backdrop-blur-xl rounded-3xl border-2 ${STYLE_COLORS[dominantKey]?.ring.replace('ring-', 'border-')} shadow-xl p-6 sm:p-8 mb-6`}>
        <div className="flex items-start gap-4 mb-5">
          <div className="text-5xl shrink-0">{dominantInfo?.icon}</div>
          <div className="flex-1">
            <p className={`text-[11px] font-extrabold uppercase tracking-[0.12em] ${STYLE_COLORS[dominantKey]?.text} mb-1`}>
              Baskın Stilin
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-1">{dominantInfo?.name}</h3>
            <p className="text-sm text-gray-600 font-semibold">%{dominantPct.toFixed(0)} oranında baskın</p>
          </div>
        </div>

        <p className="text-base text-[#0f2847] leading-relaxed mb-5 font-medium">{summary}</p>

        {topTips.length > 0 && (
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> İki Hızlı Öneri
            </p>
            <ul className="space-y-2">
              {topTips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 leading-relaxed pl-2 border-l-2 border-amber-300 py-1">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0f2847] to-[#1a3a5c] rounded-3xl p-8 sm:p-10 text-center shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-rose-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 mb-4">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-extrabold text-amber-200 tracking-wider">DETAYLI ANALİZ</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Tam Raporun Çok Daha Kapsamlı
          </h3>
          <p className="text-white/85 text-base mb-6 max-w-md mx-auto leading-relaxed">
            10 testin tümü, kişiye özel detaylı yorum, çalışma stratejileri, PDF raporu ve uzman seansı —
            tüm paketleri inceleyebilirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/paketler"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[#0f2847] font-extrabold text-sm shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Paketleri Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all"
            >
              Ücretlendirme
            </Link>
          </div>
        </div>
      </div>

      {/* Restart */}
      <div className="text-center">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:text-[#0f2847] hover:bg-white/60 font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Testi Tekrar Yap
        </button>
      </div>
    </div>
  );
}
