'use client';

/**
 * F3 (2/3): Çoklu Zekâ Trial Page (Gardner)
 * Anonim, kayıtsız, sıfır maliyet (API key yok).
 * Akış: intro → 80 soru (5 sayfa × 16 soru, 5-point Likert) → result (8-axis radar + profil + sinerjiler)
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  RefreshCw, BookOpen, AlertCircle, Lightbulb
} from 'lucide-react';
import {
  COKLU_ZEKA_QUESTIONS_LISE, COKLU_ZEKA_DATA, ZEKA_SIRA,
  calculateCokluZekaLise, type ZekaKey
} from '@/lib/tests/coklu-zeka/data';
import type { CokluZekaScores } from '@/lib/tests/types';
import { ShareButton } from '@/components/ShareButton';

type Stage = 'intro' | 'questions' | 'result';

const PAGE_SIZE = 16;
const LIKERT_LABELS = [
  { value: 0, label: 'Kesinlikle\nKatılmıyorum', color: 'rose' },
  { value: 1, label: 'Katılmıyorum',           color: 'orange' },
  { value: 2, label: 'Kararsızım',             color: 'amber' },
  { value: 3, label: 'Katılıyorum',            color: 'lime' },
  { value: 4, label: 'Kesinlikle\nKatılıyorum', color: 'emerald' },
];

export default function CokluZekaTrialPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<CokluZekaScores | null>(null);

  // Tüm 80 soruyu birleştir + bir kerelik karıştır (mount'ta seedlenmiş gibi)
  const allQuestions = useMemo(() => {
    const list: { id: number; text: string }[] = [];
    for (const zk of ZEKA_SIRA) {
      for (const q of COKLU_ZEKA_QUESTIONS_LISE[zk]) {
        list.push({ id: q.id, text: q.text });
      }
    }
    // Fisher-Yates shuffle (her açılışta yeni sıra)
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const totalQuestions = allQuestions.length;
  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);
  const pageQuestions = allQuestions.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const allAnsweredInPage = pageQuestions.every((q) => answers[q.id] !== undefined);
  const totalAnswered = Object.keys(answers).length;
  const overallProgress = (totalAnswered / totalQuestions) * 100;
  const isLastPage = currentPage === totalPages - 1;

  useEffect(() => {
    if (stage !== 'intro') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, currentPage]);

  function handleAnswer(qid: number, value: number) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function handleNext() {
    if (!allAnsweredInPage) return;
    if (isLastPage) {
      setScores(calculateCokluZekaLise(answers));
      setStage('result');
    } else {
      setCurrentPage((p) => p + 1);
    }
  }

  function handlePrev() {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }

  function handleRestart() {
    setStage('intro');
    setCurrentPage(0);
    setAnswers({});
    setScores(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
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

        {stage === 'questions' && (
          <QuestionStage
            pageQuestions={pageQuestions}
            currentPage={currentPage}
            totalPages={totalPages}
            totalAnswered={totalAnswered}
            totalQuestions={totalQuestions}
            overallProgress={overallProgress}
            answers={answers}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            isLast={isLastPage}
            allAnsweredInPage={allAnsweredInPage}
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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-indigo-200 shadow-sm mb-6">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="text-[13px] font-bold text-[#0f2847]">Ücretsiz Deneme</span>
      </div>

      <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
        <Lightbulb className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#0f2847] mb-4 leading-[1.15] text-balance">
        Çoklu Zekâ Testi
      </h1>
      <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
        Howard Gardner&apos;ın 8 zekâ alanından hangisinde daha güçlü olduğunu keşfet.
        Sözel, mantıksal, görsel, müziksel, doğacı, sosyal, bedensel, içsel.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-indigo-600">80</div>
          <div className="text-xs text-gray-500 font-semibold">soru (5 sayfa)</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-violet-600">~10</div>
          <div className="text-xs text-gray-500 font-semibold">dakika</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
          <div className="text-2xl font-black text-purple-600">8</div>
          <div className="text-xs text-gray-500 font-semibold">zekâ alanı</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-extrabold text-base shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
      >
        <Sparkles className="w-5 h-5" />
        Teste Başla
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="mt-10 max-w-md mx-auto bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3 text-left">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong>Bilgi:</strong> Bu deneme testi kayıt gerektirmez ve verilerin saklanmaz.
          Detaylı analiz, kişisel öneriler ve PDF raporu için ücretli pakete üye olmanız gerekir.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGE: QUESTIONS (5-point Likert, 16 soru/sayfa)
   ═══════════════════════════════════════════════════════════════ */

function QuestionStage({
  pageQuestions, currentPage, totalPages, totalAnswered, totalQuestions, overallProgress,
  answers, onAnswer, onNext, onPrev, isLast, allAnsweredInPage,
}: {
  pageQuestions: { id: number; text: string }[];
  currentPage: number;
  totalPages: number;
  totalAnswered: number;
  totalQuestions: number;
  overallProgress: number;
  answers: Record<number, number>;
  onAnswer: (qid: number, value: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
  allAnsweredInPage: boolean;
}) {
  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#0f2847]">
            Sayfa {currentPage + 1} / {totalPages}
          </span>
          <span className="text-sm text-indigo-600 font-extrabold">
            {totalAnswered} / {totalQuestions} yanıtlandı
          </span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Likert legend (top) */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 text-center mb-2">
          Her ifadeye katılma derecene göre seç:
        </p>
        <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-semibold text-gray-600">
          <div>Kesinlikle<br />Katılmıyorum</div>
          <div>Katılmıyorum</div>
          <div>Kararsızım</div>
          <div>Katılıyorum</div>
          <div>Kesinlikle<br />Katılıyorum</div>
        </div>
      </div>

      {/* Questions */}
      <div key={currentPage} className="space-y-4 animate-[q-slide-in_400ms_ease-out]">
        {pageQuestions.map((q, idx) => {
          const qNumber = currentPage * PAGE_SIZE + idx + 1;
          const selected = answers[q.id];
          return (
            <div key={q.id} className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                  {qNumber}
                </span>
                <p className="flex-1 text-sm sm:text-base text-[#0f2847] leading-relaxed font-medium">{q.text}</p>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {LIKERT_LABELS.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onAnswer(q.id, opt.value)}
                      aria-label={opt.label.replace('\n', ' ')}
                      className={`relative h-10 sm:h-11 rounded-lg font-extrabold text-sm transition-all border-2
                        ${isSelected
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600'}`}
                    >
                      {opt.value + 1}
                      {isSelected && (
                        <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-emerald-500 fill-white bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 0}
          className="px-5 py-3 rounded-xl bg-white/80 border border-white/80 font-bold text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!allAnsweredInPage}
          className={`flex-1 sm:flex-none sm:px-8 px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all
            ${allAnsweredInPage
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5'
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
   STAGE: RESULT (8-axis radar + profil + sinerjiler)
   ═══════════════════════════════════════════════════════════════ */

function ResultStage({ scores, onRestart }: { scores: CokluZekaScores; onRestart: () => void }) {
  const top3 = scores.top3;
  const dominantKey = top3[0]?.[0] as ZekaKey;
  const dominantInfo = COKLU_ZEKA_DATA[dominantKey];
  const topTips = (dominantInfo?.studyTips ?? []).slice(0, 2);

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-[13px] font-bold text-emerald-900">Test Tamamlandı</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f2847] mb-2 leading-[1.15] text-balance">Sonucun Hazır</h1>
        <p className="text-base text-gray-600">Çoklu Zekâ Profilin</p>
      </div>

      {/* RADAR CHART */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-extrabold text-[#0f2847]">Zekâ Alanları Profilin</h2>
        </div>
        <RadarChart scores={scores} />

        {/* Top3 + bottom2 list */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 mb-2">
              Güçlü Olduğun 3 Alan
            </p>
            <div className="space-y-1.5">
              {top3.map(([key, sc], i) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{COKLU_ZEKA_DATA[key as ZekaKey]?.icon}</span>
                    <span className="font-bold text-[#0f2847]">{COKLU_ZEKA_DATA[key as ZekaKey]?.name.split(' ')[0]}</span>
                    {i === 0 && (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded-full tracking-wider">EN BASKIN</span>
                    )}
                  </div>
                  <span className="font-black text-emerald-600">%{sc.pct.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 mb-2">
              Gelişebileceğin 2 Alan
            </p>
            <div className="space-y-1.5">
              {scores.bottom2.map(([key, sc]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{COKLU_ZEKA_DATA[key as ZekaKey]?.icon}</span>
                    <span className="font-bold text-gray-600">{COKLU_ZEKA_DATA[key as ZekaKey]?.name.split(' ')[0]}</span>
                  </div>
                  <span className="font-black text-rose-500">%{sc.pct.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PROFIL KARTI */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 backdrop-blur-xl rounded-3xl border-2 border-indigo-200 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="text-5xl shrink-0">{dominantInfo?.icon}</div>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-indigo-700 mb-1">
              {scores.profile.name}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-1">{dominantInfo?.name}</h3>
            <p className="text-sm text-gray-600 font-semibold">%{top3[0]?.[1].pct.toFixed(0)} oranında baskın</p>
          </div>
        </div>

        <p className="text-base text-[#0f2847] leading-relaxed mb-5 font-medium">{dominantInfo?.description}</p>

        {/* Profile interpretation */}
        {scores.profile.description && (
          <div className="bg-white/60 rounded-2xl p-3 mb-5 border border-indigo-100">
            <p className="text-sm text-gray-700 leading-relaxed italic">{scores.profile.description}</p>
          </div>
        )}

        {/* Study tips */}
        {topTips.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Çalışma Önerileri
            </p>
            <ul className="space-y-2">
              {topTips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 leading-relaxed pl-2 border-l-2 border-indigo-300 py-1">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Synergies */}
        {scores.synergies.length > 0 && (
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> Uygun Profiller
            </p>
            <div className="space-y-2">
              {scores.synergies.slice(0, 2).map((s, i) => (
                <div key={i} className="bg-white/60 rounded-xl p-3 border border-indigo-100">
                  <p className="text-sm font-extrabold text-[#0f2847]">{s.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0f2847] to-[#1a3a5c] rounded-3xl p-8 sm:p-10 text-center shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 mb-4">
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-extrabold text-indigo-200 tracking-wider">DETAYLI ANALİZ</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Tam Raporun Çok Daha Kapsamlı</h3>
          <p className="text-white/85 text-base mb-6 max-w-md mx-auto leading-relaxed">
            10 testin tümü, 8 zekâ için detaylı yorum, kariyer alanları, çalışma stratejileri ve PDF raporu —
            tüm paketleri inceleyebilirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/paketler"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-400 to-violet-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Paketleri Gör <ArrowRight className="w-4 h-4" />
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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <ShareButton
          title="Çoklu Zekâ Sonucum"
          text={`${dominantInfo?.icon ?? ''} Baskın zekâ alanım: ${dominantInfo?.name ?? ''}`}
          trialPath="/trial/coklu-zeka"
          accentClass="from-indigo-500 to-violet-600"
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
   ALT COMPONENT: 8-Axis Radar Chart (SVG)
   ═══════════════════════════════════════════════════════════════ */

function RadarChart({ scores }: { scores: CokluZekaScores }) {
  const cx = 180;
  const cy = 180;
  const maxR = 130;
  const numAxes = 8;

  // 8 zeka için pct değerleri (sıraya göre, yukarıdan saat yönünde)
  const dataPoints = ZEKA_SIRA.map((zk) => ({
    key: zk,
    pct: scores.scores[zk]?.pct ?? 0,
    info: COKLU_ZEKA_DATA[zk],
  }));

  // Vertex koordinatları (üstten başla, saat yönünde)
  const getPoint = (idx: number, distance: number) => {
    const angle = (idx * (360 / numAxes) - 90) * (Math.PI / 180);
    return {
      x: cx + distance * Math.cos(angle),
      y: cy + distance * Math.sin(angle),
    };
  };

  // Background grid (5 ring)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels.map((lvl) =>
    Array.from({ length: numAxes }).map((_, i) => getPoint(i, lvl * maxR)).map((p) => `${p.x},${p.y}`).join(' ')
  );

  // Axes (lines from center)
  const axisLines = Array.from({ length: numAxes }).map((_, i) => getPoint(i, maxR));

  // Data polygon
  const dataPoly = dataPoints
    .map((d, i) => getPoint(i, (d.pct / 100) * maxR))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // Label positions (axis tip + offset)
  const labelPositions = dataPoints.map((d, i) => {
    const p = getPoint(i, maxR + 20);
    return { ...p, ...d };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 360 360" width="100%" height="auto" className="max-w-md mx-auto block">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Background grid polygons */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#e0e7ff"
            strokeWidth={i === gridPolygons.length - 1 ? 1.5 : 0.7}
          />
        ))}

        {/* Axes */}
        {axisLines.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e0e7ff" strokeWidth="0.7" />
        ))}

        {/* Data polygon — animated */}
        <polygon
          points={dataPoly}
          fill="url(#radarFill)"
          stroke="#6366f1"
          strokeWidth="2"
          style={{ transition: 'all 1.2s ease-out' }}
        />

        {/* Data points (vertices) */}
        {dataPoints.map((d, i) => {
          const p = getPoint(i, (d.pct / 100) * maxR);
          return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#fff" strokeWidth="2" />;
        })}

        {/* Labels */}
        {labelPositions.map((lp) => (
          <g key={lp.key}>
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill="#0f2847"
            >
              {lp.info?.icon} {lp.info?.name.split(' ')[0]}
            </text>
            <text
              x={lp.x}
              y={lp.y + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="900"
              fill="#6366f1"
            >
              %{lp.pct.toFixed(0)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
