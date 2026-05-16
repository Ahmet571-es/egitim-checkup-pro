'use client';

/**
 * F3 (1/3): Sağ-Sol Beyin Trial Page
 * Anonim, kayıtsız, sıfır maliyet (API key yok).
 * Akış: intro → 30 soru (A/B seçim) → result (çift ring + profil kartı + CTA)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  RefreshCw, BarChart3, BookOpen, AlertCircle, Brain, Lock
} from 'lucide-react';
import { SAG_SOL_BEYIN_QUESTIONS, SAG_SOL_BEYIN_DATA } from '@/lib/tests/sag-sol-beyin/data';
import { calculateSagSolBeyin } from '@/lib/tests/sag-sol-beyin/engine';
import type { SagSolBeyinScores } from '@/lib/tests/types';
import { ShareButton } from '@/components/ShareButton';

type Stage = 'intro' | 'questions' | 'result';

export default function SagSolBeyinTrialPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<SagSolBeyinScores | null>(null);

  useEffect(() => {
    if (stage === 'result' || stage === 'questions') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stage, currentQ]);

  const totalQuestions = SAG_SOL_BEYIN_QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;
  const currentQuestion = SAG_SOL_BEYIN_QUESTIONS[currentQ];
  const isLastQuestion = currentQ === totalQuestions - 1;
  const hasAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  function handleAnswer(option: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  }

  function handleNext() {
    if (!hasAnswered) return;
    if (isLastQuestion) {
      setScores(calculateSagSolBeyin(answers));
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
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-purple-50 to-pink-50">
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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-fuchsia-200 shadow-sm mb-6">
        <Sparkles className="w-4 h-4 text-fuchsia-600" />
        <span className="text-[13px] font-bold text-[#0f2847]">Ücretsiz Deneme</span>
      </div>

      <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-purple-600 items-center justify-center mb-6 shadow-2xl shadow-fuchsia-500/30">
        <Brain className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#0f2847] mb-4 leading-[1.15] text-balance">
        Sağ-Sol Beyin Dominansı
      </h1>
      <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
        Analitik mi, yaratıcı mı düşünüyorsun? Mantıksal-sıralı (sol) ve bütünsel-yaratıcı (sağ)
        beyin yarımküresi tercihinin dengesini keşfet.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-fuchsia-600">30</div>
          <div className="text-xs text-gray-500 font-semibold">soru</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-purple-600">~7</div>
          <div className="text-xs text-gray-500 font-semibold">dakika</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-pink-600">Anlık</div>
          <div className="text-xs text-gray-500 font-semibold">sonuç</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-fuchsia-500/30 hover:shadow-2xl hover:shadow-fuchsia-500/40 hover:-translate-y-0.5 transition-all"
      >
        <Sparkles className="w-5 h-5" />
        Teste Başla
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="mt-10 max-w-md mx-auto bg-fuchsia-50/80 border border-fuchsia-200 rounded-2xl p-4 flex items-start gap-3 text-left">
        <AlertCircle className="w-5 h-5 text-fuchsia-600 shrink-0 mt-0.5" />
        <div className="text-xs text-fuchsia-900 leading-relaxed">
          <strong>Bilgi:</strong> Bu deneme testi kayıt gerektirmez ve verilerin saklanmaz.
          Detaylı analiz, kişisel öneriler ve PDF raporu için ücretli pakete üye olmanız gerekir.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGE: QUESTIONS (A/B seçim)
   ═══════════════════════════════════════════════════════════════ */

function QuestionStage({
  question, currentQ, total, progress, selected, onAnswer, onNext, onPrev, isLast, hasAnswered,
}: {
  question: typeof SAG_SOL_BEYIN_QUESTIONS[0];
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#0f2847]">Soru {currentQ + 1} / {total}</span>
          <span className="text-sm text-fuchsia-600 font-extrabold">%{Math.round(progress)}</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        key={currentQ}
        className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-10 animate-[q-slide-in_400ms_ease-out]"
      >
        <h2 className="text-lg sm:text-2xl font-black text-[#0f2847] mb-6 leading-[1.25] text-balance">{question.text}</h2>

        <div className="space-y-3">
          {(['a', 'b'] as const).map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onAnswer(opt)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 group flex items-start gap-4
                  ${isSelected
                    ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md ring-4 ring-fuchsia-200'
                    : 'border-gray-200 bg-white hover:border-fuchsia-300 hover:bg-fuchsia-50/40 hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm transition-all
                  ${isSelected
                    ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-fuchsia-100 group-hover:text-fuchsia-700'}`}>
                  {opt.toUpperCase()}
                </div>
                <span className={`flex-1 text-sm sm:text-base leading-relaxed pt-1.5 ${isSelected ? 'text-[#0f2847] font-semibold' : 'text-gray-700'}`}>
                  {question[opt]}
                </span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-fuchsia-600 shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentQ === 0}
          className="px-5 py-3 rounded-xl bg-white/80 border border-white/80 font-bold text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasAnswered}
          className={`flex-1 sm:flex-none sm:px-8 px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all
            ${hasAnswered
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:-translate-y-0.5'
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
   STAGE: RESULT (çift donut + profil kartı + CTA)
   ═══════════════════════════════════════════════════════════════ */

function ResultStage({ scores, onRestart }: { scores: SagSolBeyinScores; onRestart: () => void }) {
  const profile = SAG_SOL_BEYIN_DATA[scores.dominant];
  const topStrengths = profile?.strengths.slice(0, 3) ?? [];
  const topTips = profile?.studyTips.slice(0, 2) ?? [];

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-[13px] font-bold text-emerald-900">Test Tamamlandı</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f2847] mb-2 leading-[1.15] text-balance">Sonucun Hazır</h1>
        <p className="text-base text-gray-600">Sağ-Sol Beyin Dominansı Profilin</p>
      </div>

      {/* GRAFİK — çift donut + level badge */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-fuchsia-600" />
          <h2 className="text-lg font-extrabold text-[#0f2847]">Beyin Yarımküresi Dağılımın</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-6">
          {/* Sol Beyin Donut */}
          <DonutChart
            label="Sol Beyin"
            sublabel="Mantıksal · Analitik"
            percentage={scores.solYuzde}
            score={scores.solBeyin}
            isDominant={scores.dominant === 'sol'}
            colorFrom="#3b82f6"
            colorTo="#1d4ed8"
            icon="🔬"
          />
          {/* Sağ Beyin Donut */}
          <DonutChart
            label="Sağ Beyin"
            sublabel="Yaratıcı · Sezgisel"
            percentage={scores.sagYuzde}
            score={scores.sagBeyin}
            isDominant={scores.dominant === 'sag'}
            colorFrom="#d946ef"
            colorTo="#a21caf"
            icon="🎨"
          />
        </div>

        {/* Level badge */}
        <div className={`text-center py-3 px-4 rounded-2xl font-extrabold text-sm
          ${scores.dominant === 'sol' ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' :
            scores.dominant === 'sag' ? 'bg-fuchsia-50 text-fuchsia-700 border-2 border-fuchsia-200' :
            'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'}`}>
          {profile?.icon} {scores.level}
        </div>
      </div>

      {/* PROFIL KARTI — statik şablon */}
      <div className={`bg-gradient-to-br ${
          scores.dominant === 'sol' ? 'from-blue-50 to-sky-50 border-blue-300' :
          scores.dominant === 'sag' ? 'from-fuchsia-50 to-purple-50 border-fuchsia-300' :
          'from-emerald-50 to-teal-50 border-emerald-300'
        } backdrop-blur-xl rounded-3xl border-2 shadow-xl p-6 sm:p-8 mb-6`}>
        <div className="flex items-start gap-4 mb-5">
          <div className="text-5xl shrink-0">{profile?.icon}</div>
          <div className="flex-1">
            <p className={`text-[11px] font-extrabold uppercase tracking-[0.12em] mb-1
              ${scores.dominant === 'sol' ? 'text-blue-700' :
                scores.dominant === 'sag' ? 'text-fuchsia-700' :
                'text-emerald-700'}`}>
              Senin Profilin
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-1">{profile?.title}</h3>
            <p className="text-sm text-gray-600 font-semibold">{scores.level}</p>
          </div>
        </div>

        <p className="text-base text-[#0f2847] leading-relaxed mb-5 font-medium">{profile?.description}</p>

        {topStrengths.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Güçlü Yönlerin
            </p>
            <ul className="space-y-1.5">
              {topStrengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topTips.length > 0 && (
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Çalışma Önerileri
            </p>
            <ul className="space-y-2">
              {topTips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 leading-relaxed pl-2 border-l-2 border-fuchsia-300 py-1">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0f2847] to-[#1a3a5c] rounded-3xl p-8 sm:p-10 text-center shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30 mb-4">
            <BookOpen className="w-4 h-4 text-fuchsia-300" />
            <span className="text-xs font-extrabold text-fuchsia-200 tracking-wider">DETAYLI ANALİZ</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Tam Raporun Çok Daha Kapsamlı</h3>
          <p className="text-white/85 text-base mb-6 max-w-md mx-auto leading-relaxed">
            10 testin tümü, kişiye özel detaylı yorum, kariyer alanları, çalışma stratejileri ve PDF raporu —
            tüm paketleri inceleyebilirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/giris"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Lock className="w-4 h-4" /> Detaylı Analiz İçin Giriş Yap <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/paketler"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Paketleri İncele
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <ShareButton
          title="Sağ-Sol Beyin Sonucum"
          text={`${profile?.icon ?? ''} Profilim: ${profile?.title ?? ''} (${scores.level}) — Sol %${scores.solYuzde.toFixed(0)} · Sağ %${scores.sagYuzde.toFixed(0)})`}
          trialPath="/trial/beyin"
          accentClass="from-fuchsia-500 to-purple-600"
        />
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:text-[#0f2847] hover:bg-white/60 font-semibold transition-all min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" /> Testi Tekrar Yap
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ALT COMPONENT: Donut Chart (SVG)
   ═══════════════════════════════════════════════════════════════ */

function DonutChart({
  label, sublabel, percentage, score, isDominant, colorFrom, colorTo, icon,
}: {
  label: string;
  sublabel: string;
  percentage: number;
  score: number;
  isDominant: boolean;
  colorFrom: string;
  colorTo: string;
  icon: string;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const gradientId = `grad-${label.replace(/\s/g, '')}`;

  return (
    <div className={`relative flex flex-col items-center p-4 rounded-2xl transition-all
      ${isDominant ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/50 ring-2 ring-amber-300 shadow-md' : ''}`}>
      {isDominant && (
        <div className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold tracking-wider shadow-md">
          BASKIN
        </div>
      )}
      <div className="text-2xl mb-1">{icon}</div>
      <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute top-[60px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="text-2xl font-black text-[#0f2847]">%{Math.round(percentage)}</div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-extrabold text-[#0f2847]">{label}</div>
        <div className="text-[11px] text-gray-500 font-semibold">{sublabel}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{score}/30 puan</div>
      </div>
    </div>
  );
}
