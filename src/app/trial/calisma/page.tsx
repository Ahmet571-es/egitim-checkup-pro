'use client';

/**
 * F3 - Çalışma Davranışı Ölçeği Trial
 * 82 soru, D/Y cevap (Bana Uyuyor / Uymuyor)
 * 7 alt kategori (A-G) bar grafik + level + combinations
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, X as XIcon,
  RefreshCw, BookOpen, AlertCircle, BarChart3, AlertTriangle
} from 'lucide-react';
import {
  CALISMA_DAVRANISI_QUESTIONS,
  CALISMA_DAVRANISI_CATEGORIES,
} from '@/lib/tests/calisma-davranisi/data';
import { calculateCalismaDavranisi } from '@/lib/tests/calisma-davranisi/engine';
import type { CalismaDavranisiScores } from '@/lib/tests/types';

type Stage = 'intro' | 'questions' | 'result';

const CATEGORY_COLORS: Record<string, string> = {
  A: 'from-blue-400 to-indigo-500',
  B: 'from-indigo-400 to-violet-500',
  C: 'from-violet-400 to-purple-500',
  D: 'from-purple-400 to-fuchsia-500',
  E: 'from-cyan-400 to-blue-500',
  F: 'from-sky-400 to-cyan-500',
  G: 'from-teal-400 to-emerald-500',
};

const LEVEL_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  'Çok İyi':         { bg: 'from-emerald-50 to-green-50',   text: 'text-emerald-800',  emoji: '🟢' },
  'İyi':             { bg: 'from-blue-50 to-sky-50',         text: 'text-blue-800',     emoji: '🔵' },
  'Orta':            { bg: 'from-amber-50 to-yellow-50',     text: 'text-amber-800',    emoji: '🟡' },
  'Gelişime Açık':   { bg: 'from-orange-50 to-amber-50',     text: 'text-orange-800',   emoji: '🟠' },
  'Acil Destek':     { bg: 'from-rose-50 to-red-50',         text: 'text-rose-800',     emoji: '🔴' },
};

export default function CalismaTrialPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<CalismaDavranisiScores | null>(null);

  useEffect(() => {
    if (stage === 'result' || stage === 'questions') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stage, currentQ]);

  const total = CALISMA_DAVRANISI_QUESTIONS.length;
  const progress = ((currentQ + 1) / total) * 100;
  const q = CALISMA_DAVRANISI_QUESTIONS[currentQ];
  const isLast = currentQ === total - 1;
  const hasAnswered = q ? answers[q.id] !== undefined : false;

  function handleAnswer(opt: 'D' | 'Y') {
    if (q) setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  }
  function handleNext() {
    if (!hasAnswered) return;
    if (isLast) {
      setScores(calculateCalismaDavranisi(answers));
      setStage('result');
    } else setCurrentQ((c) => c + 1);
  }
  function handleRestart() {
    setStage('intro'); setCurrentQ(0); setAnswers({}); setScores(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50">
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
        {stage === 'intro' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-blue-200 shadow-sm mb-6">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-[13px] font-bold text-[#0f2847]">Ücretsiz Deneme</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f2847] mb-4 leading-tight">
              Çalışma Davranışı Ölçeği
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
              Çalışma alışkanlıklarındaki güçlü ve zayıf yönleri keşfet. 7 alt kategoride
              (motivasyon, planlama, not tutma, anlama, ödev yapma, okul tutumu, sınav stratejisi)
              davranışlarını ölç.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-blue-600">82</div>
                <div className="text-xs text-gray-500 font-semibold">soru</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-indigo-600">~15</div>
                <div className="text-xs text-gray-500 font-semibold">dakika</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-sky-600">Anlık</div>
                <div className="text-xs text-gray-500 font-semibold">sonuç</div>
              </div>
            </div>

            <button onClick={() => setStage('questions')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-5 h-5" /> Teste Başla <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-10 max-w-md mx-auto bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Bilgi:</strong> 82 soru var, biraz zaman alır. Her cümle için
                "<strong>Bana Uyuyor</strong>" veya "<strong>Uymuyor</strong>" seç. Kayıt
                gerektirmez ve verilerin saklanmaz.
              </div>
            </div>
          </div>
        )}

        {stage === 'questions' && q && (
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#0f2847]">Soru {currentQ + 1} / {total}</span>
                <span className="text-sm text-blue-600 font-extrabold">%{Math.round(progress)}</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
                <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-10">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600 mb-3">Bu cümle...</p>
              <h2 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-8 leading-tight">
                "{q.text}"
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {/* Bana Uyuyor → 'D' */}
                <button onClick={() => handleAnswer('D')}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                    ${answers[q.id] === 'D'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-200'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 hover:-translate-y-0.5 hover:shadow-md'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${answers[q.id] === 'D' ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-md' : 'bg-emerald-100'}`}>
                    <CheckCircle2 className={`w-6 h-6 ${answers[q.id] === 'D' ? 'text-white' : 'text-emerald-600'}`} />
                  </div>
                  <span className={`text-sm sm:text-base font-extrabold ${answers[q.id] === 'D' ? 'text-emerald-800' : 'text-gray-700'}`}>
                    Bana Uyuyor
                  </span>
                </button>

                {/* Uymuyor → 'Y' */}
                <button onClick={() => handleAnswer('Y')}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                    ${answers[q.id] === 'Y'
                      ? 'border-rose-500 bg-rose-50 shadow-md ring-4 ring-rose-200'
                      : 'border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${answers[q.id] === 'Y' ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-md' : 'bg-rose-100'}`}>
                    <XIcon className={`w-6 h-6 ${answers[q.id] === 'Y' ? 'text-white' : 'text-rose-600'}`} />
                  </div>
                  <span className={`text-sm sm:text-base font-extrabold ${answers[q.id] === 'Y' ? 'text-rose-800' : 'text-gray-700'}`}>
                    Uymuyor
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
                className="px-5 py-3 rounded-xl bg-white/80 border border-white/80 font-bold text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 min-h-[48px]">
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button onClick={handleNext} disabled={!hasAnswered}
                className={`flex-1 sm:flex-none sm:px-8 px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all
                  ${hasAnswered
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isLast ? 'Sonucu Gör' : 'İleri'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && scores && <ResultStage scores={scores} onRestart={handleRestart} />}
      </main>
    </div>
  );
}

function ResultStage({ scores, onRestart }: { scores: CalismaDavranisiScores; onRestart: () => void }) {
  const levelStyle = LEVEL_STYLES[scores.level] ?? LEVEL_STYLES['Orta'];

  // Kategorileri pct'ye göre sırala (yüksekten düşüğe)
  const sortedCategories = Object.entries(scores.categoriesPositive)
    .map(([key, positive]) => {
      const cat = CALISMA_DAVRANISI_CATEGORIES[key];
      const max = cat?.maxScore ?? 1;
      const pct = max > 0 ? Math.round((positive / max) * 100) : 0;
      return { key, name: cat?.name ?? key, positive, max, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const topCategory = sortedCategories[0];
  const weakCategory = sortedCategories[sortedCategories.length - 1];

  // En önemli kombinasyon (varsa)
  const topCombo = scores.combinations[0];

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-[13px] font-bold text-emerald-900">Test Tamamlandı</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0f2847] mb-2">Sonucun Hazır</h1>
        <p className="text-base text-gray-600">Çalışma Davranışı Profilin</p>
      </div>

      {/* Genel Düzey Banner */}
      <div className={`bg-gradient-to-br ${levelStyle.bg} backdrop-blur-xl rounded-3xl border-2 border-blue-200 shadow-xl p-6 sm:p-8 mb-6 text-center`}>
        <div className="text-5xl mb-3">{levelStyle.emoji}</div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 mb-2">Genel Çalışma Düzeyin</p>
        <h2 className={`text-3xl sm:text-4xl font-black ${levelStyle.text} mb-2`}>{scores.level}</h2>
        <p className="text-base text-gray-700 font-semibold">
          %{scores.positivePct.toFixed(0)} olumlu davranış (toplam {scores.totalPositive}/{scores.maxTotal} puan)
        </p>
      </div>

      {/* GRAFIK: 7 kategori bar */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-extrabold text-[#0f2847]">Alt Kategorilere Göre Dağılım</h2>
        </div>
        <div className="space-y-4">
          {sortedCategories.map(({ key, name, positive, max, pct }, idx) => {
            const isTop = idx === 0;
            const isWeak = idx === sortedCategories.length - 1 && pct < 50;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-extrabold text-gray-400 shrink-0">{key}.</span>
                    <span className={`text-sm font-bold truncate ${isTop ? 'text-[#0f2847]' : 'text-gray-700'}`}>{name}</span>
                    {isTop && pct >= 65 && (
                      <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-wider shrink-0">EN GÜÇLÜ</span>
                    )}
                    {isWeak && (
                      <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full tracking-wider shrink-0">GELİŞTİR</span>
                    )}
                  </div>
                  <span className={`text-sm font-black ml-2 shrink-0 ${pct >= 65 ? 'text-emerald-600' : pct >= 45 ? 'text-amber-600' : 'text-rose-600'}`}>
                    %{pct} <span className="text-xs text-gray-400 font-normal">({positive}/{max})</span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${CATEGORY_COLORS[key] ?? 'from-gray-400 to-gray-500'} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KISA RAPOR */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-xl rounded-3xl border-2 border-blue-200 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="text-5xl shrink-0">📚</div>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-700 mb-1">Özet</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-1">Senin Çalışma Profilin</h3>
            <p className="text-sm text-gray-600 font-semibold">{scores.level} düzey</p>
          </div>
        </div>

        <p className="text-base text-[#0f2847] leading-relaxed mb-5 font-medium">
          {scores.positivePct >= 80 && (
            <>Çalışma alışkanlıklarında oldukça başarılısın. Özellikle <strong>{topCategory?.name}</strong> alanında çok güçlüsün. Bu seviyeyi sürdürmek senin için kolay olacak.</>
          )}
          {scores.positivePct >= 65 && scores.positivePct < 80 && (
            <>İyi bir çalışma profilin var. <strong>{topCategory?.name}</strong> en güçlü yönün; {weakCategory && weakCategory.pct < 60 ? <><strong>{weakCategory.name}</strong> alanında küçük iyileştirmeler büyük fark yaratabilir.</> : 'genel anlamda dengeli bir profile sahipsin.'}</>
          )}
          {scores.positivePct >= 45 && scores.positivePct < 65 && (
            <>Orta düzey bir çalışma profilin var — bazı alanlarda iyisin, bazılarında gelişim alanı var. Özellikle <strong>{weakCategory?.name}</strong> alanında dikkatli adımlarla performansını artırabilirsin.</>
          )}
          {scores.positivePct < 45 && (
            <>Çalışma alışkanlıklarında belirgin gelişim alanları var. <strong>{weakCategory?.name}</strong> başta olmak üzere bazı alanlarda destek almak faydalı olur.</>
          )}
        </p>

        {/* En önemli kombinasyon (varsa) */}
        {topCombo && (
          <div className="mt-5 p-4 rounded-2xl bg-white/70 border border-blue-300">
            <div className="flex items-start gap-3">
              <div className="text-xl shrink-0 mt-0.5">{topCombo.title.match(/^[^\s]+/)?.[0] ?? '💡'}</div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-[#0f2847] mb-1">{topCombo.title.replace(/^[^\s]+\s/, '')}</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{topCombo.detail}</p>
                <p className="text-xs text-blue-700 font-semibold leading-relaxed pl-2 border-l-2 border-blue-400 py-1">
                  <strong>İpucu:</strong> {topCombo.tip}
                </p>
              </div>
            </div>
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
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Tam Raporun Çok Daha Kapsamlı</h3>
          <p className="text-white/85 text-base mb-6 max-w-md mx-auto leading-relaxed">
            Her alt kategoride detaylı yorumlar, kişisel çalışma ipuçları, PDF raporu ve uzman seansı —
            tüm 10 testi paketlerimizde inceleyebilirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/paketler"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[#0f2847] font-extrabold text-sm shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-4 h-4" /> Paketleri Gör <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all">
              Ücretlendirme
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:text-[#0f2847] hover:bg-white/60 font-semibold transition-all">
          <RefreshCw className="w-4 h-4" /> Testi Tekrar Yap
        </button>
      </div>
    </div>
  );
}
