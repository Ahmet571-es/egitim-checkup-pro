// ============================================================
// Boylamsal Takip Servisi — Egitim Check-Up Pro FAZ 1
// Ogrenci gelisim skorlari, trendler ve sinif bazli analizler
// ============================================================

import { createClient } from '@/lib/supabase/client';

// ── Tipler ──────────────────────────────────────────────────
export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface GrowthResult {
  currentScore: number;
  previousScore: number;
  changePercent: number;
  changeAbsolute: number;
}

export interface TestAttempt {
  id: string;
  test_type: string;
  attempt_number: number;
  score: number;
  sub_scores: Record<string, unknown>;
  created_at: string;
}

export interface StudentTrend {
  studentId: string;
  testType: string;
  attempts: TestAttempt[];
  direction: TrendDirection;
  averageChange: number;
  latestScore: number;
  firstScore: number;
}

export interface ClassTrendSummary {
  classId: string;
  testType: string;
  averageLatest: number;
  averageFirst: number;
  averageChange: number;
  direction: TrendDirection;
  studentCount: number;
}

// ── Yuzdelik Degisim Hesapla ────────────────────────────────
export function calculateGrowthScore(
  currentScore: number,
  previousScore: number
): GrowthResult {
  const changeAbsolute = currentScore - previousScore;
  const changePercent =
    previousScore !== 0
      ? ((currentScore - previousScore) / Math.abs(previousScore)) * 100
      : currentScore > 0
        ? 100
        : 0;

  return {
    currentScore,
    previousScore,
    changePercent: Math.round(changePercent * 100) / 100,
    changeAbsolute: Math.round(changeAbsolute * 100) / 100,
  };
}

// ── Trend Yonu Hesapla ──────────────────────────────────────
function determineTrend(changes: number[]): TrendDirection {
  if (changes.length === 0) return 'stable';
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  if (avg > 2) return 'improving';
  if (avg < -2) return 'declining';
  return 'stable';
}

// ── Ogrenci Trendi Getir ────────────────────────────────────
export async function getStudentTrend(
  studentId: string,
  testType: string
): Promise<StudentTrend> {
  const supabase = createClient();

  // Güvenli default (hata veya veri yoksa dönecek değer)
  const emptyTrend: StudentTrend = {
    studentId,
    testType,
    attempts: [],
    direction: 'stable',
    averageChange: 0,
    latestScore: 0,
    firstScore: 0,
  };

  const { data, error } = await supabase
    .from('student_test_history')
    .select('id, test_type, attempt_number, score, sub_scores, created_at')
    .eq('student_id', studentId)
    .eq('test_type', testType)
    .order('attempt_number', { ascending: true });

  // Tablo veya kolon yoksa sessizce boş trend dön
  if (error) {
    console.warn('[longitudinal.getStudentTrend] sorgu başarısız, boş trend dönülüyor:', error.message);
    return emptyTrend;
  }

  const attempts: TestAttempt[] = (data ?? []).map((d) => ({
    id: d.id,
    test_type: d.test_type,
    attempt_number: d.attempt_number,
    score: Number(d.score),
    sub_scores: (d.sub_scores as Record<string, unknown>) ?? {},
    created_at: d.created_at,
  }));

  // Ardisik degisimler
  const changes: number[] = [];
  for (let i = 1; i < attempts.length; i++) {
    if (attempts[i - 1].score !== 0) {
      changes.push(
        ((attempts[i].score - attempts[i - 1].score) /
          Math.abs(attempts[i - 1].score)) *
          100
      );
    }
  }

  const direction = determineTrend(changes);
  const averageChange =
    changes.length > 0
      ? Math.round(
          (changes.reduce((a, b) => a + b, 0) / changes.length) * 100
        ) / 100
      : 0;

  return {
    studentId,
    testType,
    attempts,
    direction,
    averageChange,
    latestScore: attempts.length > 0 ? attempts[attempts.length - 1].score : 0,
    firstScore: attempts.length > 0 ? attempts[0].score : 0,
  };
}

// ── Ogrencinin Tum Test Trendleri ───────────────────────────
export async function getStudentAllTrends(
  studentId: string
): Promise<StudentTrend[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('student_test_history')
    .select('id, test_type, attempt_number, score, sub_scores, created_at')
    .eq('student_id', studentId)
    .order('test_type')
    .order('attempt_number', { ascending: true });

  // Tablo/kolon yoksa boş dizi dön
  if (error) {
    console.warn('[longitudinal.getStudentAllTrends] sorgu başarısız, boş dönülüyor:', error.message);
    return [];
  }

  const byType: Record<string, TestAttempt[]> = {};
  for (const d of data ?? []) {
    const key = d.test_type;
    if (!byType[key]) byType[key] = [];
    byType[key].push({
      id: d.id,
      test_type: d.test_type,
      attempt_number: d.attempt_number,
      score: Number(d.score),
      sub_scores: (d.sub_scores as Record<string, unknown>) ?? {},
      created_at: d.created_at,
    });
  }

  const trends: StudentTrend[] = [];
  for (const [testType, attempts] of Object.entries(byType)) {
    const changes: number[] = [];
    for (let i = 1; i < attempts.length; i++) {
      if (attempts[i - 1].score !== 0) {
        changes.push(
          ((attempts[i].score - attempts[i - 1].score) /
            Math.abs(attempts[i - 1].score)) *
            100
        );
      }
    }
    const direction = determineTrend(changes);
    const averageChange =
      changes.length > 0
        ? Math.round(
            (changes.reduce((a, b) => a + b, 0) / changes.length) * 100
          ) / 100
        : 0;

    trends.push({
      studentId,
      testType,
      attempts,
      direction,
      averageChange,
      latestScore:
        attempts.length > 0 ? attempts[attempts.length - 1].score : 0,
      firstScore: attempts.length > 0 ? attempts[0].score : 0,
    });
  }

  return trends;
}

// ── Sinif Bazli Ortalama Trend ──────────────────────────────
export async function getClassTrend(
  classId: string,
  testType: string
): Promise<ClassTrendSummary> {
  const supabase = createClient();

  // Siniftaki ogrencileri getir
  const { data: classStudents } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', classId);

  const studentIds = (classStudents ?? []).map((cs) => cs.student_id);

  if (studentIds.length === 0) {
    return {
      classId,
      testType,
      averageLatest: 0,
      averageFirst: 0,
      averageChange: 0,
      direction: 'stable',
      studentCount: 0,
    };
  }

  // Her ogrencinin trendini hesapla
  const trends: StudentTrend[] = [];
  for (const sid of studentIds) {
    const trend = await getStudentTrend(sid, testType);
    if (trend.attempts.length > 0) {
      trends.push(trend);
    }
  }

  if (trends.length === 0) {
    return {
      classId,
      testType,
      averageLatest: 0,
      averageFirst: 0,
      averageChange: 0,
      direction: 'stable',
      studentCount: 0,
    };
  }

  const avgLatest =
    trends.reduce((sum, t) => sum + t.latestScore, 0) / trends.length;
  const avgFirst =
    trends.reduce((sum, t) => sum + t.firstScore, 0) / trends.length;
  const avgChange =
    trends.reduce((sum, t) => sum + t.averageChange, 0) / trends.length;

  return {
    classId,
    testType,
    averageLatest: Math.round(avgLatest * 100) / 100,
    averageFirst: Math.round(avgFirst * 100) / 100,
    averageChange: Math.round(avgChange * 100) / 100,
    direction: determineTrend([avgChange]),
    studentCount: trends.length,
  };
}

// ── Onceki Test Sonucunu Getir ──────────────────────────────
export async function getPreviousTestResult(
  studentId: string,
  testType: string
): Promise<{ score: number; attemptNumber: number; completedAt: string } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('test_results')
    .select('scores, attempt_number, completed_at')
    .eq('student_id', studentId)
    .eq('test_type', testType)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Kolon yoksa sessiz dön
  if (error) {
    console.warn('[longitudinal.getPreviousTestResult] sorgu başarısız:', error.message);
    return null;
  }

  if (!data) return null;

  // Genel skor cikar
  const scores = data.scores as Record<string, unknown>;
  let score = 0;
  if (typeof scores.total === 'number') score = scores.total;
  else if (typeof scores.totalPct === 'number') score = scores.totalPct;
  else if (typeof scores.overall === 'number') score = scores.overall;
  else if (typeof scores.TN_E === 'number') score = scores.TN_E;
  else if (typeof scores.wpm === 'number') score = scores.wpm;
  else if (typeof scores.effectiveScore === 'number') score = scores.effectiveScore;
  else {
    // Ilk numerik degeri kullan
    for (const v of Object.values(scores)) {
      if (typeof v === 'number') { score = v; break; }
    }
  }

  return {
    score,
    attemptNumber: data.attempt_number ?? 1,
    completedAt: data.completed_at,
  };
}

// ── Test Gecmisine Kayit Ekle ───────────────────────────────
export async function recordTestHistory(
  studentId: string,
  testType: string,
  score: number,
  subScores: Record<string, unknown>,
  attemptNumber: number
): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('student_test_history').insert({
      student_id: studentId,
      test_type: testType,
      attempt_number: attemptNumber,
      score,
      sub_scores: subScores,
    });
    if (error) {
      console.warn('[longitudinal.recordTestHistory] insert başarısız:', error.message);
    }
  } catch (e) {
    console.warn('[longitudinal.recordTestHistory] beklenmedik hata:', e);
  }
}
