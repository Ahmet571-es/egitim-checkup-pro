'use client';

/**
 * Sınav Kaygısı Ölçeği — Trial Page
 * 50 soru, D/Y cevap (Bana Uyuyor / Uymuyor)
 * Sonuç: 5 kademeli düzey + totalPct gauge + 3 kaygı tipi bar + dominant açıklama
 *
 * Ölçek literatürde açık kaynak olduğu için bu test ÜCRETSİZ pakete dahil edildi.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, X as XIcon,
  RefreshCw, Brain, AlertCircle, BarChart3, Lock,
} from 'lucide-react';
import { SINAV_KAYGISI_QUESTIONS } from '@/lib/tests/sinav-kaygisi/data';
import { calculateSinavKaygisi } from '@/lib/tests/sinav-kaygisi/engine';
import type { SinavKaygisiScores } from '@/lib/tests/types';
import { ShareButton } from '@/components/ShareButton';

type Stage = 'intro' | 'questions' | 'result';

const LEVEL_STYLES: Record<string, { bg: string; text: string; emoji: string; ring: string; gradient: string }> = {
  'Çok Düşük':  { bg: 'from-emerald-50 to-green-50',  text: 'text-emerald-800', emoji: '🟢', ring: 'border-emerald-300', gradient: 'from-emerald-400 to-green-500' },
  'Düşük':      { bg: 'from-sky-50 to-blue-50',        text: 'text-sky-800',     emoji: '🔵', ring: 'border-sky-300',     gradient: 'from-sky-400 to-blue-500' },
  'Orta':       { bg: 'from-amber-50 to-yellow-50',    text: 'text-amber-800',   emoji: '🟡', ring: 'border-amber-300',   gradient: 'from-amber-400 to-yellow-500' },
  'Yüksek':     { bg: 'from-orange-50 to-amber-50',    text: 'text-orange-800',  emoji: '🟠', ring: 'border-orange-300',  gradient: 'from-orange-400 to-rose-500' },
  'Çok Yüksek': { bg: 'from-rose-50 to-red-50',        text: 'text-rose-800',    emoji: '🔴', ring: 'border-rose-300',    gradient: 'from-rose-500 to-red-600' },
};

const TYPE_LABELS: Record<string, { name: string; icon: string; color: string }> = {
  bedensel: { name: 'Bedensel Kaygı', icon: '💪', color: 'from-rose-400 to-red-500' },
  bilissel: { name: 'Bilişsel Kaygı', icon: '🧠', color: 'from-violet-400 to-purple-500' },
  sosyal:   { name: 'Sosyal Kaygı',   icon: '👥', color: 'from-amber-400 to-orange-500' },
};

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'Çok Düşük':  'Sınav kaygın çok düşük seviyede — sınavlara karşı son derece rahat bir tutumun var. Şu anki dengeni korumak için düzenli uyku ve sağlıklı beslenme yeterli.',
  'Düşük':      'Sınav kaygın düşük seviyede — sınavlara karşı sağlıklı bir tutum içindesin. Bu hafif uyarılma performansını destekleyebilir.',
  'Orta':       'Sınav kaygın orta seviyede — herkesin bir miktar kaygısı vardır, bu normal. Yerkes-Dodson Yasası\'na göre orta düzey kaygı aslında performansı destekler.',
  'Yüksek':     'Sınav kaygın yüksek seviyede — bu seninle ilgili bir kusur değil, üstesinden gelinebilir. Nefes egzersizleri, derin uyku ve sevdiğin biriyle konuşmak çok yardımcı olur.',
  'Çok Yüksek': 'Sınav kaygın çok yüksek düzeyde — bu kesinlikle üstesinden gelinebilir. Rehber öğretmen veya psikolog ile görüşmek faydalı olabilir; küçük günlük adımlar büyük fark yaratır.',
};

export default function SinavKaygisiTrialPage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<SinavKaygisiScores | null>(null);

  useEffect(() => {
    if (stage === 'result' || stage === 'questions') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stage, currentQ]);

  const total = SINAV_KAYGISI_QUESTIONS.length;
  const progress = ((currentQ + 1) / total) * 100;
  const q = SINAV_KAYGISI_QUESTIONS[currentQ];
  const isLast = currentQ === total - 1;
  const hasAnswered = q ? answers[q.id] !== undefined : false;

  function handleAnswer(opt: 'D' | 'Y') {
    if (q) setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  }
  function handleNext() {
    if (!hasAnswered) return;
    if (isLast) {
      setScores(calculateSinavKaygisi(answers));
      setStage('result');
    } else setCurrentQ((c) => c + 1);
  }
  function handleRestart() {
    setStage('intro'); setCurrentQ(0); setAnswers({}); setScores(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-violet-200 shadow-sm mb-6">
              <Brain className="w-4 h-4 text-violet-600" />
              <span className="text-[13px] font-bold text-[#0f2847]">Ücretsiz Deneme</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#0f2847] mb-4 leading-[1.15] text-balance">
              Sınav Kaygısı Ölçeği
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
              Sınav öncesi yaşadığın endişe, gerginlik ve fiziksel belirtileri 7 alt boyutta
              ölç. Sonuç 3 kaygı tipi (bedensel, bilişsel, sosyal) üzerinden dağılım gösterir.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-violet-600">50</div>
                <div className="text-xs text-gray-500 font-semibold">soru</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-purple-600">~10</div>
                <div className="text-xs text-gray-500 font-semibold">dakika</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm">
                <div className="text-2xl font-black text-fuchsia-600">Anlık</div>
                <div className="text-xs text-gray-500 font-semibold">sonuç</div>
              </div>
            </div>

            <button onClick={() => setStage('questions')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-extrabold text-base shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-5 h-5" /> Teste Başla <ArrowRight className="w-5 h-5" />
            </button>

            <div className="mt-10 max-w-md mx-auto bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Bilgi:</strong> 50 soru var. Her cümle için "<strong>Bana Uyuyor</strong>"
                veya "<strong>Uymuyor</strong>" seç. Kayıt gerektirmez ve verilerin saklanmaz.
              </div>
            </div>
          </div>
        )}

        {stage === 'questions' && q && (
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#0f2847]">Soru {currentQ + 1} / {total}</span>
                <span className="text-sm text-violet-600 font-extrabold">%{Math.round(progress)}</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
                <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div
              key={currentQ}
              className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-10 animate-[q-slide-in_400ms_ease-out]"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-violet-600 mb-3">Bu cümle...</p>
              <h2 className="text-lg sm:text-2xl font-black text-[#0f2847] mb-8 leading-[1.25] text-balance">
                &quot;{q.text}&quot;
              </h2>

              <div className="grid grid-cols-2 gap-3">
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
                <ArrowLeft className="w-4 h-4" /> Önceki Soru
              </button>
              <button onClick={handleNext} disabled={!hasAnswered}
                className={`flex-1 sm:flex-none sm:px-8 px-5 py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all
                  ${hasAnswered
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isLast ? 'Sonucu Gör' : 'Sonraki Soru'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && scores && <ResultStage scores={scores} onRestart={handleRestart} />}
      </main>
    </div>
  );
}

function ResultStage({ scores, onRestart }: { scores: SinavKaygisiScores; onRestart: () => void }) {
  const levelStyle = LEVEL_STYLES[scores.overallLevel] ?? LEVEL_STYLES['Orta'];

  // 3 kaygı tipini sıralı dizi haline getir (yüksekten düşüğe)
  const sortedTypes = Object.entries(scores.typeScores)
    .map(([key, pct]) => ({
      key,
      label: TYPE_LABELS[key]?.name ?? key,
      icon: TYPE_LABELS[key]?.icon ?? '•',
      color: TYPE_LABELS[key]?.color ?? 'from-gray-400 to-gray-500',
      pct: Number(pct),
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-[13px] font-bold text-emerald-900">Test Tamamlandı</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f2847] mb-2 leading-[1.15] text-balance">Sonucun Hazır</h1>
        <p className="text-base text-gray-600">Sınav Kaygısı Profilin</p>
      </div>

      {/* Genel Düzey Banner */}
      <div className={`bg-gradient-to-br ${levelStyle.bg} backdrop-blur-xl rounded-3xl border-2 ${levelStyle.ring} shadow-xl p-6 sm:p-8 mb-6 text-center`}>
        <div className="text-5xl mb-3">{levelStyle.emoji}</div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 mb-2">Genel Kaygı Düzeyin</p>
        <h2 className={`text-3xl sm:text-4xl font-black ${levelStyle.text} mb-3`}>{scores.overallLevel}</h2>
        <p className="text-base text-gray-700 font-semibold mb-4">
          %{scores.totalPct.toFixed(0)} kaygı puanı (toplam {scores.total}/{scores.maxTotal})
        </p>

        {/* Bar göstergesi — 0..100 */}
        <div className="max-w-md mx-auto">
          <div className="h-4 bg-white/80 rounded-full overflow-hidden border border-white/80 shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${levelStyle.gradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.max(scores.totalPct, 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1.5 px-1">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </div>

      {/* 3 Kaygı Tipi Bar */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-extrabold text-[#0f2847]">Kaygı Tipi Dağılımın</h2>
        </div>
        <div className="space-y-4">
          {sortedTypes.map((t, idx) => (
            <div key={t.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base shrink-0">{t.icon}</span>
                  <span className="text-sm font-bold text-[#0f2847] truncate">{t.label}</span>
                  {idx === 0 && t.pct >= 40 && (
                    <span className="text-[10px] font-extrabold bg-violet-500 text-white px-2 py-0.5 rounded-full tracking-wider shrink-0">BASKIN</span>
                  )}
                </div>
                <span className={`text-sm font-black ml-2 shrink-0 ${t.pct >= 55 ? 'text-rose-600' : t.pct >= 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  %{Math.round(t.pct)}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${t.color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                  style={{ width: `${Math.max(t.pct, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KISA RAPOR */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 backdrop-blur-xl rounded-3xl border-2 border-violet-200 shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="text-5xl shrink-0">💡</div>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-violet-700 mb-1">Senin için</p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-1">Sınav Kaygısı Profilin</h3>
            <p className="text-sm text-gray-600 font-semibold">{scores.overallLevel} düzey</p>
          </div>
        </div>

        <p className="text-base text-[#0f2847] leading-relaxed mb-4 font-medium">
          {LEVEL_DESCRIPTIONS[scores.overallLevel] ?? ''}
        </p>

        {/* Baskın kaygı tipi açıklaması (engine'den) */}
        {scores.dominantInfo && (
          <div className="mt-5 p-4 rounded-2xl bg-white/70 border border-violet-300">
            <div className="flex items-start gap-3">
              <div className="text-xl shrink-0 mt-0.5">{scores.dominantInfo.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-[#0f2847] mb-1">Baskın Kaygı Tipin: {scores.dominantInfo.name}</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{scores.dominantInfo.description}</p>
                <p className="text-xs text-violet-700 font-semibold leading-relaxed pl-2 border-l-2 border-violet-400 py-1">
                  <strong>En etkili yöntem:</strong> {scores.dominantInfo.strategy}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0f2847] to-[#1a3a5c] rounded-3xl p-8 sm:p-10 text-center shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 mb-4">
            <Brain className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-extrabold text-amber-200 tracking-wider">DETAYLI ANALİZ</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Tam Raporun Çok Daha Kapsamlı</h3>
          <p className="text-white/85 text-base mb-6 max-w-md mx-auto leading-relaxed">
            7 alt boyutta detaylı yorumlar, kişisel başa çıkma teknikleri, PDF raporu ve uzman seansı —
            tüm 10 testi paketlerimizde inceleyebilirsin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/giris"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[#0f2847] font-extrabold text-sm shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Lock className="w-4 h-4" /> Detaylı Analiz İçin Giriş Yap <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/paketler"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all">
              <Sparkles className="w-4 h-4" /> Paketleri İncele
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <ShareButton
          title="Sınav Kaygısı Sonucum"
          text={`🧠 Genel kaygı düzeyim: ${scores.overallLevel} (%${scores.totalPct.toFixed(0)})`}
          trialPath="/trial/kaygi"
          accentClass="from-violet-500 to-purple-600"
        />
        <button onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:text-[#0f2847] hover:bg-white/60 font-semibold transition-all min-h-[44px]">
          <RefreshCw className="w-4 h-4" /> Testi Tekrar Yap
        </button>
      </div>
    </div>
  );
}
