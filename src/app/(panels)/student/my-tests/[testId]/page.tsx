'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { getTestById } from '@/lib/tests/index';
import TestShell from '@/components/test/TestShell';
import QuestionCard from '@/components/test/QuestionCard';
import TestResult from '@/components/test/TestResult';
import D2TestBoard from '@/components/test/D2TestBoard';
import SpeedReadingTest from '@/components/test/SpeedReadingTest';

// ── Test motorları ───────────────────────────────────────
import { calculateSagSolBeyin, generateSagSolBeyinReport } from '@/lib/tests/sag-sol-beyin/engine';
import { calculateVark, generateVarkReport } from '@/lib/tests/vark/engine';
import { calculateHolland, generateHollandReport } from '@/lib/tests/holland/engine';
import { calculateEnneagram, generateEnneagramReport, getAllEnneagramQuestions, shuffleQuestions } from '@/lib/tests/enneagram/engine';
import { calculateCokluZekaLise, generateCokluZekaReport } from '@/lib/tests/coklu-zeka/engine';
import { calculateSinavKaygisi, generateSinavKaygisiReport } from '@/lib/tests/sinav-kaygisi/engine';
import { calculateCalismaDavranisi, generateCalismaDavranisiReport } from '@/lib/tests/calisma-davranisi/engine';
import { calculateAkademik, generateAkademikReport, getAkademikSections } from '@/lib/tests/akademik-analiz/engine';
import { calculateSpeedReading, getPassageForGrade } from '@/lib/tests/hizli-okuma/engine';
import { generateD2Test, calculateD2, generateD2Report } from '@/lib/tests/d2-dikkat/engine';
import { D2_CONFIG } from '@/lib/tests/d2-dikkat/engine';

// ── Veri importları ──────────────────────────────────────
import { SAG_SOL_BEYIN_QUESTIONS } from '@/lib/tests/sag-sol-beyin/data';
import { VARK_QUESTIONS } from '@/lib/tests/vark/data';
import { HOLLAND_QUESTIONS } from '@/lib/tests/holland/data';
import { SINAV_KAYGISI_QUESTIONS } from '@/lib/tests/sinav-kaygisi/data';
import { CALISMA_DAVRANISI_QUESTIONS } from '@/lib/tests/calisma-davranisi/data';
import { COKLU_ZEKA_QUESTIONS_LISE } from '@/lib/tests/coklu-zeka/data';
import type { D2RowResult } from '@/lib/tests/types';

type AnswerMap = Record<string | number, string | number>;

interface QuestionItem {
  id: string | number;
  text: string;
  type: 'likert5' | 'likert4' | 'binary' | 'mc';
  options?: Record<string, string>;
  passage?: string;
}

// Soru listesini test tipine göre oluştur
function buildQuestions(testId: string): QuestionItem[] {
  switch (testId) {
    case 'sag-sol-beyin':
      return SAG_SOL_BEYIN_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'mc' as const,
        options: { a: q.a, b: q.b },
      }));

    case 'vark':
      return VARK_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'mc' as const, options: q.options,
      }));

    case 'holland':
      return HOLLAND_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'likert5' as const,
      }));

    case 'enneagram': {
      const all = shuffleQuestions(getAllEnneagramQuestions());
      return all.map(q => ({
        id: q.id, text: q.text, type: 'likert5' as const,
      }));
    }

    case 'coklu-zeka': {
      const all: QuestionItem[] = [];
      for (const key of ['sozel','mantiksal','gorsel','muziksel','dogaci','sosyal','bedensel','icsel']) {
        const qs = COKLU_ZEKA_QUESTIONS_LISE[key as keyof typeof COKLU_ZEKA_QUESTIONS_LISE] ?? [];
        for (const q of qs) {
          all.push({ id: q.id, text: q.text, type: 'likert4' as const });
        }
      }
      return all;
    }

    case 'sinav-kaygisi':
      return SINAV_KAYGISI_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'binary' as const,
        options: { D: 'Doğru', Y: 'Yanlış' },
      }));

    case 'calisma-davranisi':
      return CALISMA_DAVRANISI_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'binary' as const,
        options: { D: 'Doğru / Her zaman böyleyimdir', Y: 'Yanlış / Böyle değilimdir' },
      }));

    case 'akademik-analiz': {
      const sections = getAkademikSections();
      const all: QuestionItem[] = [];
      for (const sec of sections) {
        if (sec.type === 'passage_mc') {
          for (const p of sec.data as { passage: string; questions: { id: string; text: string; options: Record<string, string> }[] }[]) {
            for (const q of p.questions) {
              all.push({ id: q.id, text: q.text, type: 'mc', options: q.options, passage: p.passage });
            }
          }
        } else if (sec.type === 'mc') {
          for (const q of sec.data as { id: string; text: string; options: Record<string, string> }[]) {
            all.push({ id: q.id, text: q.text, type: 'mc', options: q.options });
          }
        } else if (sec.type === 'likert') {
          for (const q of sec.data as { id: string; text: string }[]) {
            all.push({ id: q.id, text: q.text, type: 'likert5' });
          }
        }
      }
      return all;
    }

    default:
      return [];
  }
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const test = getTestById(testId);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ main: string; desc: string; scores: { label: string; value: string; pct?: number }[]; report: string } | null>(null);

  // D2 state
  const [d2Rows, setD2Rows] = useState<ReturnType<typeof generateD2Test> | null>(null);

  // Autosave — studentId + resume prompt
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<number>(7);
  const [resumePrompt, setResumePrompt] = useState<{
    currentQuestion: number;
    answers: AnswerMap;
    startedAt: number;
  } | null>(null);
  const [resumeChecked, setResumeChecked] = useState<boolean>(false);

  // Auth user'ı bir kere oku + sınıf seviyesini al
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user?.id) {
        setStudentId(data.user.id);
        // Öğrencinin sınıf seviyesini profil veya sınıf tablosundan al
        const { data: profile } = await supabase
          .from('profiles')
          .select('grade')
          .eq('id', data.user.id)
          .single();
        if (profile?.grade) {
          const g = parseInt(String(profile.grade), 10);
          if (!isNaN(g) && g >= 1 && g <= 12) setStudentGrade(g);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!testId) return;
    if (testId === 'd2-dikkat') {
      setD2Rows(generateD2Test());
    } else if (testId !== 'hizli-okuma') {
      setQuestions(buildQuestions(testId));
    }
  }, [testId]);

  // Autosave — yüklendiğinde localStorage'da kayıt var mı bak
  useEffect(() => {
    if (!studentId || !testId || questions.length === 0 || result || resumeChecked) return;
    if (testId === 'd2-dikkat' || testId === 'hizli-okuma') return;
    const key = `test_progress_${testId}_${studentId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Geçerli kayıt: en az 1 cevap verilmiş olsun
        if (
          parsed &&
          typeof parsed.currentQuestion === 'number' &&
          parsed.answers &&
          typeof parsed.answers === 'object' &&
          Object.keys(parsed.answers).length > 0
        ) {
          setResumePrompt(parsed);
        }
      }
    } catch (e) {
      console.warn('[autosave] parse hatası:', e);
    }
    setResumeChecked(true);
  }, [studentId, testId, questions.length, result, resumeChecked]);

  // Autosave — her cevap/navigation değişimde yaz
  useEffect(() => {
    if (!studentId || !testId || questions.length === 0 || result) return;
    if (testId === 'd2-dikkat' || testId === 'hizli-okuma') return;
    // Henüz hiç cevap yok + ilk sorudayız → yazma
    if (Object.keys(answers).length === 0 && currentQ === 0) return;
    // Resume prompt görünürken yazma
    if (resumePrompt) return;
    const key = `test_progress_${testId}_${studentId}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          currentQuestion: currentQ,
          answers,
          startedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn('[autosave] yazma hatası:', e);
    }
  }, [answers, currentQ, studentId, testId, questions.length, result, resumePrompt]);

  // Test tamamlandığında kaydı sil
  useEffect(() => {
    if (!result || !studentId || !testId) return;
    const key = `test_progress_${testId}_${studentId}`;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [result, studentId, testId]);

  // ── Test sonucunu Supabase'e kaydet ──────────────────────
  const [dbSaved, setDbSaved] = useState(false);
  useEffect(() => {
    if (!result || !studentId || !testId || dbSaved) return;
    const saveToDb = async () => {
      try {
        const supabase = createClient();
        // Build scores object that my-results page can parse
        const scoresObj: Record<string, unknown> = {};
        for (const s of result.scores) {
          // Try to store numeric value
          const num = parseFloat(s.value.replace(/[^0-9.-]/g, ''));
          scoresObj[s.label] = isNaN(num) ? s.value : num;
        }
        scoresObj._main = result.main;
        scoresObj._desc = result.desc;

        const { error } = await supabase
          .from('test_results')
          .insert({
            student_id: studentId,
            test_type: testId,
            scores: scoresObj,
            completed_at: new Date().toISOString(),
          });

        if (error) {
          console.error('[DB save] test_results insert hatası:', error);
        } else {
          console.log('[DB save] test_results kaydedildi:', testId);
          setDbSaved(true);

          // Gamification: XP + rozet otomatik tetikleme
          try {
            const { onTestCompleted } = await import('@/lib/services/testCompletionHook');
            const mainScore = typeof scoresObj._main === 'number' ? scoresObj._main : 50;
            const gamResult = await onTestCompleted(studentId, testId, mainScore);
            if (gamResult.xpGained > 0) {
              console.log(`[Gamification] +${gamResult.xpGained} XP, rozetler: ${gamResult.newBadges.join(', ') || 'yok'}, level up: ${gamResult.levelUp}`);
            }
          } catch (gamErr) {
            console.warn('[Gamification] tetikleme hatası (göz ardı edildi):', gamErr);
          }
        }
      } catch (err) {
        console.error('[DB save] beklenmedik hata:', err);
      }
    };
    saveToDb();
  }, [result, studentId, testId, dbSaved]);

  const handleResumeAccept = () => {
    if (!resumePrompt) return;
    setAnswers(resumePrompt.answers);
    setCurrentQ(Math.min(resumePrompt.currentQuestion, questions.length - 1));
    setResumePrompt(null);
  };

  const handleResumeDecline = () => {
    if (!studentId || !testId) {
      setResumePrompt(null);
      return;
    }
    try {
      localStorage.removeItem(`test_progress_${testId}_${studentId}`);
    } catch {
      // ignore
    }
    setResumePrompt(null);
  };

  // Zamanlayıcı
  useEffect(() => {
    if (result || testId === 'd2-dikkat' || testId === 'hizli-okuma') return;
    const iv = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [result, testId]);

  const computeResult = useCallback((finalAnswers: AnswerMap) => {
    if (!testId) return;
    try {
      switch (testId) {
        case 'sag-sol-beyin': {
          const s = calculateSagSolBeyin(finalAnswers as Record<string, string>);
          const r = generateSagSolBeyinReport(s);
          setResult({
            main: s.level, desc: `Sağ: ${s.sagBeyin}/30 — Sol: ${s.solBeyin}/30`,
            scores: [
              { label: '🎨 Sağ Beyin', value: `${s.sagBeyin}/30`, pct: s.sagYuzde },
              { label: '🔬 Sol Beyin', value: `${s.solBeyin}/30`, pct: s.solYuzde },
            ],
            report: r,
          });
          break;
        }
        case 'vark': {
          const s = calculateVark(finalAnswers as Record<string, string>);
          const r = generateVarkReport(s);
          setResult({
            main: s.isMultimodal ? 'Çok Modlu' : `${s.dominant[0]} Baskın`,
            desc: s.isMultimodal ? 'Birden fazla öğrenme stilini dengeli kullanıyorsun.' : `${s.dominant[0]} stilinde güçlüsün.`,
            scores: s.sorted.map(([k, v]) => ({ label: k, value: v.toString(), pct: s.percentages[k] })),
            report: r,
          });
          break;
        }
        case 'holland': {
          const s = calculateHolland(finalAnswers as Record<string, number>);
          const r = generateHollandReport(s);
          setResult({
            main: `Holland Kodu: ${s.hollandCode}`,
            desc: s.top3.map(([k]) => k).join(' • '),
            scores: s.sortedTypes.map(([k, v]) => ({ label: k, value: v.toString(), pct: Math.round(v / 56 * 100) })),
            report: r,
          });
          break;
        }
        case 'enneagram': {
          const s = calculateEnneagram(finalAnswers as Record<string, number>);
          const r = generateEnneagramReport(s);
          setResult({
            main: `Tip ${s.mainType} — ${s.fullTypeStr}`,
            desc: `Baskın kişilik tipiniz tespit edildi.`,
            scores: s.sortedScores.slice(0, 5).map(([t, p]) => ({ label: `Tip ${t}`, value: `%${p}`, pct: p })),
            report: r,
          });
          break;
        }
        case 'coklu-zeka': {
          const s = calculateCokluZekaLise(finalAnswers as Record<string, number>);
          const r = generateCokluZekaReport(s);
          setResult({
            main: s.top3[0] ? `${s.top3[0][0].toUpperCase()} Baskın` : 'Dengeli',
            desc: s.profile.description,
            scores: s.top3.map(([k, v]) => ({ label: k, value: `%${v.pct}`, pct: v.pct })),
            report: r,
          });
          break;
        }
        case 'sinav-kaygisi': {
          const s = calculateSinavKaygisi(finalAnswers as Record<string, string>);
          const r = generateSinavKaygisiReport(s);
          setResult({
            main: `${s.levelEmoji} ${s.overallLevel}`,
            desc: `Kaygı puanı: ${s.total}/${s.maxTotal} (%${s.totalPct})`,
            scores: Object.entries(s.categories).map(([k, v]) => ({
              label: k.replace(/_/g, ' '), value: v.toString(),
            })),
            report: r,
          });
          break;
        }
        case 'calisma-davranisi': {
          const s = calculateCalismaDavranisi(finalAnswers as Record<string, string>);
          const r = generateCalismaDavranisiReport(s);
          setResult({
            main: `${s.levelEmoji} ${s.level}`,
            desc: `Doğru Davranış: ${s.totalPositive}/${s.maxTotal} (%${s.positivePct})`,
            scores: Object.entries(s.categoriesPositive).map(([k, v]) => ({
              label: k, value: v.toString(),
            })),
            report: r,
          });
          break;
        }
        case 'akademik-analiz': {
          const s = calculateAkademik(finalAnswers as Record<string, string | number>);
          const r = generateAkademikReport(s);
          setResult({
            main: `${s.levelEmoji} ${s.level}`,
            desc: s.levelDesc,
            scores: [
              { label: 'Genel Skor', value: `%${s.overall}`, pct: s.overall },
              { label: 'En Güçlü', value: `${s.strongest.name} (%${s.strongest.pct})` },
              { label: 'Gelişim', value: `${s.weakest.name} (%${s.weakest.pct})` },
            ],
            report: r,
          });
          break;
        }
      }
    } catch (err) {
      console.error('Skorlama hatası:', err);
    }
  }, [testId]);

  const handleAnswer = (val: string | number | string[]) => {
    const q = questions[currentQ];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: typeof val === 'string' || typeof val === 'number' ? val : val[0] }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(p => p + 1);
    else computeResult(answers);
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(p => p - 1);
  };

  const handleSubmit = () => computeResult(answers);

  // D2 tamamlandı
  const handleD2Complete = (rowResults: D2RowResult[]) => {
    const s = calculateD2(rowResults, D2_CONFIG.timePerRow);
    const r = generateD2Report(s);
    setResult({
      main: `${s.level}`,
      desc: `CP: ${s.CP} | TN-E: ${s.TN_E} | FR: ${s.FR}`,
      scores: [
        { label: 'Konsantrasyon (CP)', value: s.CP.toString(), pct: s.cpPct },
        { label: 'Toplam Performans (TN-E)', value: s.TN_E.toString() },
        { label: 'Hata (E)', value: `${s.E} (E1:${s.E1} E2:${s.E2})` },
        { label: 'Dalgalanma (FR)', value: s.FR.toString() },
        { label: 'Hız-Doğruluk', value: s.balance },
        { label: 'Tutarlılık', value: s.consistency },
      ],
      report: r,
    });
  };

  // Hızlı okuma tamamlandı
  const handleSpeedReadingComplete = (readAnswers: Record<string, string>, readingTimeSec: number) => {
    const { passage, kademe } = getPassageForGrade(studentGrade);
    const s = calculateSpeedReading(readAnswers, passage, readingTimeSec, kademe);
    setResult({
      main: `${s.speedEmoji} ${s.wpm} Kelime/Dakika`,
      desc: s.profile,
      scores: [
        { label: 'Okuma Hızı', value: `${s.speedLabel} (${s.wpm} kel/dk)`, pct: Math.min(100, Math.round(s.wpm / 250 * 100)) },
        { label: 'Anlama Oranı', value: `%${s.comprehensionPct}`, pct: s.comprehensionPct },
        { label: 'Etkili Okuma', value: `%${s.effectiveScore}`, pct: s.effectiveScore },
        { label: 'Doğru/Toplam', value: `${s.correct}/${s.total}` },
      ],
      report: '',
    });
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2847]">
        <div className="text-white text-center">
          <p className="text-5xl mb-4">❌</p>
          <p className="font-bold text-xl">Test bulunamadı</p>
          <p className="text-white/60 text-sm mt-2">ID: {testId}</p>
        </div>
      </div>
    );
  }

  // ── Sonuç ekranı ──────────────────────────────────────
  if (result) {
    return (
      <TestResult
        testName={test.name}
        testIcon={test.icon}
        mainResult={result.main}
        mainDescription={result.desc}
        scores={result.scores}
        report={result.report}
        accentColor={test.color}
        onRetake={() => {
          setResult(null); setAnswers({}); setCurrentQ(0); setElapsed(0); setDbSaved(false);
          if (testId === 'd2-dikkat') setD2Rows(generateD2Test());
        }}
      />
    );
  }

  // ── D2 Dikkat ─────────────────────────────────────────
  if (testId === 'd2-dikkat') {
    if (!d2Rows) return <div className="flex items-center justify-center min-h-screen bg-[#0f2847]"><Loader2 className="animate-spin text-white" size={40} /></div>;
    return <D2TestBoard rows={d2Rows} timePerRow={D2_CONFIG.timePerRow} onComplete={handleD2Complete} />;
  }

  // ── Hızlı Okuma ───────────────────────────────────────
  if (testId === 'hizli-okuma') {
    const { passage } = getPassageForGrade(studentGrade);
    return <SpeedReadingTest passage={passage} onComplete={handleSpeedReadingComplete} accentColor={test.color} />;
  }

  // ── Yükleniyor ────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f2847]">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  // ── Devam dialogu ─────────────────────────────────────
  if (resumePrompt) {
    const total = questions.length;
    const answeredCount = Object.keys(resumePrompt.answers).length;
    const dateStr = new Date(resumePrompt.startedAt).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">💾</div>
          <h2 className="text-white font-extrabold text-xl mb-2">Kaldığınız yerden devam etmek ister misiniz?</h2>
          <p className="text-white/70 text-sm mb-1">
            Daha önce <strong className="text-white">{answeredCount}/{total}</strong> soruyu cevaplamışsınız.
          </p>
          <p className="text-white/50 text-xs mb-6">Son kayıt: {dateStr}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResumeAccept}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg"
            >
              Evet, Devam Et
            </button>
            <button
              onClick={handleResumeDecline}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
            >
              Baştan Başla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard test ─────────────────────────────────────
  const q = questions[currentQ];
  const currentVal = answers[q.id];

  return (
    <TestShell
      testName={test.name}
      testIcon={test.icon}
      totalQuestions={questions.length}
      currentQuestion={currentQ + 1}
      timeElapsed={elapsed}
      onPrev={handlePrev}
      onNext={handleNext}
      onSubmit={handleSubmit}
      canGoNext={currentVal != null && currentVal !== ''}
      canGoPrev={currentQ > 0}
      isLastQuestion={currentQ === questions.length - 1}
      accentColor={test.color}
    >
      <QuestionCard
        questionNumber={currentQ + 1}
        questionText={q.text}
        questionType={q.type}
        options={q.options}
        value={currentVal}
        onChange={handleAnswer}
        accentColor={test.color}
        passage={q.passage}
      />
    </TestShell>
  );
}
