'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { getTestById } from '@/lib/tests/index';
import TestShell from '@/components/test/TestShell';
import QuestionCard from '@/components/test/QuestionCard';
import TestResult from '@/components/test/TestResult';
import TestResultShort from '@/components/test/TestResultShort';
import { buildShortResult } from '@/lib/tests/short-result';
import D2TestBoard from '@/components/test/D2TestBoard';
import BurdonTestBoard from '@/components/test/BurdonTestBoard';
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
import {
  generateBurdonTest, generateBurdonPractice, calculateBurdon,
  generateBurdonReport, getBurdonTimePerSection, BURDON_CONFIG
} from '@/lib/tests/burdon-dikkat/engine';
import type { BurdonSection, BurdonSectionResponse } from '@/lib/tests/burdon-dikkat/engine';
import { calculateAge, getBurdonTimeByAge } from '@/lib/utils/age';

// ── Veri importları ──────────────────────────────────────
import { SAG_SOL_BEYIN_QUESTIONS } from '@/lib/tests/sag-sol-beyin/data';
import { VISUAL_QUESTIONS } from '@/lib/tests/sag-sol-beyin/visual-data';
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
  type: 'likert5' | 'likert4' | 'binary' | 'mc' | 'visual';
  options?: Record<string, string>;
  passage?: string;
  // Görsel sorular için (yalnızca type='visual' iken)
  promptSvg?: string;
  // Bölüm geçişi tetikleyicisi — bu soruya gelindiğinde önce geçiş ekranı göster
  startsSection?: { title: string; description: string; icon: string };
}

// Soru listesini test tipine göre oluştur
function buildQuestions(testId: string): QuestionItem[] {
  switch (testId) {
    case 'sag-sol-beyin': {
      const textQs: QuestionItem[] = SAG_SOL_BEYIN_QUESTIONS.map(q => ({
        id: q.id, text: q.text, type: 'mc' as const,
        options: { a: q.a, b: q.b },
      }));
      const visualQs: QuestionItem[] = VISUAL_QUESTIONS.map((vq, idx) => ({
        id: vq.id,
        text: vq.text,
        type: 'visual' as const,
        promptSvg: vq.promptSvg,
        options: Object.fromEntries(vq.options.map(o => [o.key, o.label])),
        // İlk görsel soruda bölüm geçiş ekranı tetiklenir
        startsSection: idx === 0 ? {
          icon: '🖼️',
          title: 'Tebrikler! İlk bölümü bitirdin',
          description: 'Şimdi 15 soruluk görsel bölümüne geçiyoruz. Bu sorularda resimlere bakıp ilk hissini takip et — düşünmeden, doğal tepkini seç. Hazır mısın?',
        } : undefined,
      }));
      return [...textQs, ...visualQs];
    }

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
  // Bölüm geçiş ekranı için onay seti (hangi sorulardaki geçiş ekranları gösterildi)
  const [acknowledgedSections, setAcknowledgedSections] = useState<Set<string | number>>(new Set());

  // D2 state
  const [d2Rows, setD2Rows] = useState<ReturnType<typeof generateD2Test> | null>(null);

  // Burdon state
  const [burdonSections, setBurdonSections] = useState<BurdonSection[] | null>(null);
  const [burdonPractice, setBurdonPractice] = useState<BurdonSection | null>(null);

  // Autosave — studentId + resume prompt
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<number>(7);
  const [studentBirthDate, setStudentBirthDate] = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{
    currentQuestion: number;
    answers: AnswerMap;
    startedAt: number;
  } | null>(null);
  const [resumeChecked, setResumeChecked] = useState<boolean>(false);

  // Auth user'ı bir kere oku + sınıf seviyesini + doğum tarihini al
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user?.id) {
        setStudentId(data.user.id);
        // Öğrencinin sınıf seviyesini ve doğum tarihini profil tablosundan al
        const { data: profile } = await supabase
          .from('profiles')
          .select('grade, birth_date')
          .eq('id', data.user.id)
          .single();
        if (profile?.grade) {
          const g = parseInt(String(profile.grade), 10);
          if (!isNaN(g) && g >= 1 && g <= 12) setStudentGrade(g);
        }
        if (profile?.birth_date) {
          setStudentBirthDate(profile.birth_date);
        } else {
          // Fallback: auth metadata'dan dene
          const meta = data.user.user_metadata as Record<string, unknown> | null;
          const metaBirth = meta?.birth_date as string | undefined;
          if (metaBirth && metaBirth !== '—') setStudentBirthDate(metaBirth);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!testId) return;
    if (testId === 'd2-dikkat') {
      setD2Rows(generateD2Test());
    } else if (testId === 'burdon-dikkat') {
      setBurdonSections(generateBurdonTest());
      setBurdonPractice(generateBurdonPractice());
    } else if (testId !== 'hizli-okuma') {
      setQuestions(buildQuestions(testId));
    }
  }, [testId]);

  // Autosave — yüklendiğinde localStorage'da kayıt var mı bak
  useEffect(() => {
    if (!studentId || !testId || questions.length === 0 || result || resumeChecked) return;
    if (testId === 'd2-dikkat' || testId === 'burdon-dikkat' || testId === 'hizli-okuma') return;
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
    if (testId === 'd2-dikkat' || testId === 'burdon-dikkat' || testId === 'hizli-okuma') return;
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  // Postgres / Supabase hatasını kullanıcı-dostu Türkçeye çevir
  const friendlyError = (err: { code?: string; message?: string } | null | undefined): string => {
    if (!err) return 'Veritabanına kaydedilemedi.';
    const msg = err.message || '';
    // 23502 = NOT NULL violation (en olası: school_id)
    if (err.code === '23502' || /not-null constraint/i.test(msg)) {
      return 'Profilinizde okul bilgisi eksik. Lütfen okul kodunuzu girip tekrar deneyin veya okul yöneticinizle iletişime geçin.';
    }
    // 42501 / RLS politikası
    if (err.code === '42501' || /row-level security/i.test(msg)) {
      return 'Bu işlem için yetkiniz yok. Lütfen okul yöneticinizle iletişime geçin.';
    }
    if (/JWT|expired|unauthorized/i.test(msg)) {
      return 'Oturum süresi dolmuş. Lütfen sayfayı yenileyip tekrar giriş yapın.';
    }
    return msg || 'Veritabanına kaydedilemedi.';
  };

  const doSaveToDb = useCallback(async () => {
    if (!result || !testId) return;
    setSaveStatus('saving');
    setSaveError('');

    try {
      const supabase = createClient();

      // Session expire olmuş olabilir — her kaydetmede tekrar kontrol et
      let currentStudentId = studentId;
      if (!currentStudentId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          currentStudentId = user.id;
          setStudentId(user.id);
        }
      }

      if (!currentStudentId) {
        setSaveStatus('error');
        setSaveError('Oturum süresi dolmuş. Lütfen sayfayı yenileyip tekrar giriş yapın.');
        return;
      }

      // Profilden school_id okunabiliyorsa insert payload'una ekle
      // (DB nullable olsa bile okul-bağlı öğrenciler için school_id'nin
      //  test_results üzerinde doğru bağlanması önemli.)
      let schoolId: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', currentStudentId)
          .maybeSingle();
        schoolId = profile?.school_id ?? null;
      } catch (e) {
        console.warn('[DB save] school_id okunamadı:', e);
      }

      // Build scores object
      const scoresObj: Record<string, unknown> = {};
      for (const s of result.scores) {
        const num = parseFloat(s.value.replace(/[^0-9.-]/g, ''));
        scoresObj[s.label] = isNaN(num) ? s.value : num;
      }
      scoresObj._main = result.main;
      scoresObj._desc = result.desc;

      const insertPayload: Record<string, unknown> = {
        student_id: currentStudentId,
        test_type: testId,
        scores: scoresObj,
        raw_answers: answers,
        completed_at: new Date().toISOString(),
      };
      if (schoolId) insertPayload.school_id = schoolId;

      const { error } = await supabase
        .from('test_results')
        .insert(insertPayload);

      if (error) {
        console.error('[DB save] test_results insert hatası:', error);
        setSaveStatus('error');
        setSaveError(friendlyError(error));
      } else {
        console.log('[DB save] test_results kaydedildi:', testId);
        setDbSaved(true);
        setSaveStatus('saved');

        // Gamification: XP + rozet
        try {
          const { onTestCompleted } = await import('@/lib/services/testCompletionHook');
          const mainScore = typeof scoresObj._main === 'number' ? scoresObj._main : 50;
          await onTestCompleted(currentStudentId, testId, mainScore);
        } catch (gamErr) {
          console.warn('[Gamification] tetikleme hatası (göz ardı edildi):', gamErr);
        }
      }
    } catch (err) {
      console.error('[DB save] beklenmedik hata:', err);
      setSaveStatus('error');
      setSaveError('Beklenmeyen bir hata oluştu. Tekrar deneyin.');
    }
  }, [result, studentId, testId, answers]);

  // Otomatik kayıt: SADECE 'idle' durumdayken tetikle.
  // Daha önce 'saving' dışındaki tüm durumlar (özellikle 'error') effect'i
  // yeniden tetikleyip sonsuz retry döngüsüne yol açıyordu (BUG P0).
  useEffect(() => {
    if (!result || dbSaved || saveStatus !== 'idle') return;
    doSaveToDb();
  }, [result, dbSaved, saveStatus, doSaveToDb]);

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
    if (result || testId === 'd2-dikkat' || testId === 'burdon-dikkat' || testId === 'hizli-okuma') return;
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
            main: s.level, desc: `Sağ: ${s.sagBeyin}/${SAG_SOL_BEYIN_QUESTIONS.length} — Sol: ${s.solBeyin}/${SAG_SOL_BEYIN_QUESTIONS.length}`,
            scores: [
              { label: '🎨 Sağ Beyin', value: `${s.sagBeyin}/${SAG_SOL_BEYIN_QUESTIONS.length}`, pct: s.sagYuzde },
              { label: '🔬 Sol Beyin', value: `${s.solBeyin}/${SAG_SOL_BEYIN_QUESTIONS.length}`, pct: s.solYuzde },
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
            scores: [
              // Toplam kaygı yüzdesi en başta — gauge + advisory'nin tek kaynak (source of truth) olarak kullandığı değer.
              // `buildSinavKaygisi` pickScore('toplam','kaygı','genel'...) ile bu entry'yi yakalar.
              { label: 'Toplam Kaygı', value: `${s.totalPct}`, pct: s.totalPct },
              ...Object.entries(s.categories).map(([k, v]) => ({
                label: k.replace(/_/g, ' '), value: v.toString(),
              })),
            ],
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

  // Burdon tamamlandı
  const handleBurdonComplete = (responses: BurdonSectionResponse[]) => {
    if (!burdonSections) return;
    const s = calculateBurdon(burdonSections, responses);
    const scores = generateBurdonReport(s);
    setAnswers(prev => ({ ...prev, __burdon_scores__: JSON.stringify(scores) }));

    setResult({
      main: s.patternTitle,
      desc: `Genel Puan: ${s.overallScore}/100 · Doğruluk: %${s.overallAccuracy}`,
      scores: [
        { label: 'Genel Puan', value: `${s.overallScore}/100`, pct: s.overallScore },
        { label: 'Doğruluk Oranı', value: `%${s.overallAccuracy}`, pct: s.overallAccuracy },
        { label: 'Paragraf 1 Hata', value: `${s.paragraphErrors[0]}` },
        { label: 'Paragraf 2 Hata', value: `${s.paragraphErrors[1]}` },
        { label: 'Paragraf 3 Hata', value: `${s.paragraphErrors[2]}` },
        { label: 'Doğru İşaret', value: `${s.totalCorrect}/${s.totalTargets}` },
        { label: 'Atlanan Hedef (E1)', value: s.totalOmission.toString() },
        { label: 'Yanlış İşaret (E2)', value: s.totalCommission.toString() },
      ],
      report: `${s.patternFinding}\n\n${s.patternSuggestion}`,
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
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900">
        {/* Aurora */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative text-white text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/50">
            <span className="text-5xl">❌</span>
          </div>
          <p className="font-extrabold text-2xl mb-2 drop-shadow-md">Test bulunamadı</p>
          <p className="text-white/70 text-sm mb-1">Aradığınız test artık mevcut değil ya da taşındı.</p>
          <p className="text-white/40 text-xs font-mono">ID: {testId}</p>
          <a
            href="/student/my-tests"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-[#0f2847] dark:text-slate-100 font-extrabold text-[13.5px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.97]"
          >
            ← Testlere Dön
          </a>
        </div>
      </div>
    );
  }

  // ── Sonuç ekranı ──────────────────────────────────────
  if (result) {
    // Build short result: derive chart + advisory from test type and scores
    const scoresMap: Record<string, unknown> = {};
    for (const s of result.scores) {
      const num = parseFloat(s.value.replace(/[^0-9.-]/g, ''));
      scoresMap[s.label] = isNaN(num) ? s.value : num;
    }
    const shortRes = buildShortResult(testId, scoresMap, result.main);

    return (
      <>
        <TestResultShort
          testName={test.name}
          testIcon={test.icon}
          mainResult={shortRes.main}
          advisory={shortRes.advisory}
          chart={shortRes.chart}
          accentColor={test.color}
          onRetake={() => {
            setResult(null); setAnswers({}); setCurrentQ(0); setElapsed(0); setDbSaved(false); setSaveStatus('idle');
            if (testId === 'd2-dikkat') setD2Rows(generateD2Test());
            if (testId === 'burdon-dikkat') {
              setBurdonSections(generateBurdonTest());
              setBurdonPractice(generateBurdonPractice());
            }
            setAcknowledgedSections(new Set());
          }}
        />
        {/* Kaydetme durumu göstergesi */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 backdrop-blur-md text-white text-[13px] font-bold shadow-xl shadow-blue-500/40 border border-white/20">
              <Loader2 size={14} className="animate-spin" /> Sonuç kaydediliyor...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 backdrop-blur-md text-white text-[13px] font-bold shadow-xl shadow-emerald-500/40 border border-white/20 save-pulse">
              <CheckCircle size={14} /> Sonuç kaydedildi
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 backdrop-blur-md text-white text-[13px] font-bold shadow-xl shadow-red-500/40 border border-white/20">
                ❌ {saveError || 'Kaydetme başarısız'}
              </div>
              <button
                onClick={doSaveToDb}
                className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 text-red-600 text-[13px] font-extrabold shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all active:scale-[0.97]"
              >
                🔄 Tekrar Dene
              </button>
            </div>
          )}
          <style jsx>{`
            @keyframes save-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.03); }
            }
            .save-pulse {
              animation: save-pulse 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      </>
    );
  }

  // ── D2 Dikkat ─────────────────────────────────────────
  if (testId === 'd2-dikkat') {
    if (!d2Rows) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="text-white/80 font-medium text-sm">Test hazırlanıyor...</p>
      </div>
    );
    return <D2TestBoard rows={d2Rows} timePerRow={D2_CONFIG.timePerRow} onComplete={handleD2Complete} />;
  }

  // ── Burdon Dikkat ─────────────────────────────────────
  if (testId === 'burdon-dikkat') {
    if (!burdonSections || !burdonPractice) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-pulse">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="text-white/80 font-medium text-sm">Test hazırlanıyor...</p>
      </div>
    );
    // Gerçek yaş (varsa) doğum tarihinden hesaplanır; yoksa sınıftan tahmin edilir
    const realAge = calculateAge(studentBirthDate);
    const ageForTiming = realAge ?? (studentGrade ? studentGrade + 5 : null);
    const timePerSection = ageForTiming != null
      ? getBurdonTimeByAge(ageForTiming)
      : getBurdonTimePerSection(studentGrade);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900 py-6 px-4">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <BurdonTestBoard
            sections={burdonSections}
            practiceSection={burdonPractice}
            timePerSection={timePerSection}
            timePractice={BURDON_CONFIG.practiceTimeSeconds}
            studentGrade={studentGrade}
            studentAge={ageForTiming}
            onComplete={handleBurdonComplete}
          />
        </div>
      </div>
    );
  }

  // ── Hızlı Okuma ───────────────────────────────────────
  if (testId === 'hizli-okuma') {
    const { passage } = getPassageForGrade(studentGrade);
    return <SpeedReadingTest passage={passage} onComplete={handleSpeedReadingComplete} accentColor={test.color} />;
  }

  // ── Yükleniyor ────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900 gap-4 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="relative text-white/80 font-medium text-sm">Sorular yükleniyor...</p>
      </div>
    );
  }

  // ── Devam dialogu ─────────────────────────────────────
  if (resumePrompt) {
    const total = questions.length;
    const answeredCount = Object.keys(resumePrompt.answers).length;
    const progressPct = total > 0 ? (answeredCount / total) * 100 : 0;
    const dateStr = new Date(resumePrompt.startedAt).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0f2847] to-slate-900">
        {/* Aurora */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 max-w-md w-full shadow-2xl resume-enter">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 rounded-t-3xl" />

          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
              <span className="text-4xl">💾</span>
            </div>

            <h2 className="text-white font-extrabold text-2xl mb-2 tracking-tight">Kaldığınız yerden devam?</h2>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              Daha önce <strong className="text-white">{answeredCount}/{total}</strong> soruyu cevaplamışsınız.
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-white/60 text-[11px] font-bold mt-1.5 tabular-nums">{progressPct.toFixed(0)}% tamamlandı</p>
            </div>

            <p className="text-white/50 text-[11.5px] mb-6 font-mono">Son kayıt: {dateStr}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResumeAccept}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-xl hover:shadow-emerald-500/50 text-white font-extrabold text-[13.5px] transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.97]"
              >
                ✓ Evet, Devam Et
              </button>
              <button
                onClick={handleResumeDecline}
                className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-[13.5px] transition-all active:scale-[0.97]"
              >
                Baştan Başla
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes resume-enter {
              from { opacity: 0; transform: translateY(16px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .resume-enter {
              animation: resume-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ── Standard test ─────────────────────────────────────
  const q = questions[currentQ];
  const currentVal = answers[q.id];

  // Bölüm geçiş ekranı: q.startsSection varsa ve daha önce onaylanmadıysa
  if (q.startsSection && !acknowledgedSections.has(q.id)) {
    const section = q.startsSection;
    const remainingCount = questions.length - currentQ;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
          <div className="text-6xl sm:text-7xl mb-5 animate-[scale-in_0.4s_ease-out]">{section.icon}</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            {section.title}
          </h2>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-2 max-w-lg mx-auto">
            {section.description}
          </p>
          <p className="text-sm text-white/50 mb-8">
            Kalan soru: <span className="font-bold text-white/80">{remainingCount}</span>
          </p>
          <button
            onClick={() => {
              setAcknowledgedSections(prev => {
                const next = new Set(prev);
                next.add(q.id);
                return next;
              });
            }}
            className="touch-feedback inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-base shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ backgroundColor: test.color, color: 'white' }}
          >
            Devam Et →
          </button>
        </div>
      </div>
    );
  }

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
        promptSvg={q.promptSvg}
      />
    </TestShell>
  );
}
