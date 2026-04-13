// ============================================================
// FAZ 3 — Norm Tablosu Altyapısı
// ============================================================
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore } from './correlation';

// ── Tipler ──────────────────────────────────────────────────
export interface NormScore {
  id?: string;
  test_type: string;
  grade: string;
  gender: string; // 'all' | 'male' | 'female'
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  sample_size: number;
  updated_at?: string;
}

export interface NormComparison {
  studentScore: number;
  schoolAverage: number;
  normPercentile25: number | null;
  normPercentile50: number | null;
  normPercentile75: number | null;
  normSampleSize: number | null;
  position: 'altında' | 'ortalama' | 'üstünde' | 'bilinmiyor';
  percentileLabel: string;
}

// ── Norm Verisi Çek ─────────────────────────────────────
export async function getNormScore(
  testType: string,
  grade: string,
  gender: string = 'all'
): Promise<NormScore | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from('norm_scores')
    .select('*')
    .eq('test_type', testType)
    .eq('grade', grade)
    .eq('gender', gender)
    .maybeSingle();

  return data as NormScore | null;
}

// ── Okul Ortalaması Hesapla ─────────────────────────────
export async function calculateSchoolAverage(
  schoolId: string,
  testType: string
): Promise<{ average: number; sampleSize: number } | null> {
  const supabase = createClient();

  // Okuldaki tüm öğrencilerin ID'lerini al
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  if (!students || students.length === 0) return null;

  const studentIds = students.map(s => s.id);

  // Test sonuçlarını al
  const { data: results } = await supabase
    .from('test_results')
    .select('student_id, scores')
    .eq('test_type', testType)
    .in('student_id', studentIds);

  if (!results || results.length === 0) return null;

  // En son sonuçları al (öğrenci başına)
  const latestScores = new Map<string, number>();
  for (const r of results) {
    if (!latestScores.has(r.student_id)) {
      const score = extractNormalizedScore(testType, r.scores as Record<string, unknown>);
      if (score !== null) {
        latestScores.set(r.student_id, score);
      }
    }
  }

  if (latestScores.size === 0) return null;

  const scores = Array.from(latestScores.values());
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return { average, sampleSize: scores.length };
}

// ── Öğrenci Skorunu Norm ile Karşılaştır ────────────────
export async function compareWithNorm(
  studentScore: number,
  testType: string,
  grade: string,
  schoolId: string,
  gender: string = 'all'
): Promise<NormComparison> {
  const [norm, schoolAvg] = await Promise.all([
    getNormScore(testType, grade, gender),
    calculateSchoolAverage(schoolId, testType),
  ]);

  const result: NormComparison = {
    studentScore,
    schoolAverage: schoolAvg?.average || 0,
    normPercentile25: norm?.percentile_25 ?? null,
    normPercentile50: norm?.percentile_50 ?? null,
    normPercentile75: norm?.percentile_75 ?? null,
    normSampleSize: norm?.sample_size ?? null,
    position: 'bilinmiyor',
    percentileLabel: 'Norm verisi mevcut değil',
  };

  if (norm) {
    if (studentScore >= norm.percentile_75) {
      result.position = 'üstünde';
      result.percentileLabel = '75. yüzdelik ve üstü — Ortalamanın üstünde';
    } else if (studentScore >= norm.percentile_50) {
      result.position = 'ortalama';
      result.percentileLabel = '50-75. yüzdelik arası — Ortalama';
    } else if (studentScore >= norm.percentile_25) {
      result.position = 'ortalama';
      result.percentileLabel = '25-50. yüzdelik arası — Ortalamanın altında';
    } else {
      result.position = 'altında';
      result.percentileLabel = '25. yüzdeliğin altı — Dikkat gerektiriyor';
    }
  } else if (schoolAvg) {
    // Norm yok ama okul ortalaması var
    const diff = studentScore - schoolAvg.average;
    if (diff > 10) {
      result.position = 'üstünde';
      result.percentileLabel = `Okul ortalamasının ${diff} puan üstünde`;
    } else if (diff > -10) {
      result.position = 'ortalama';
      result.percentileLabel = 'Okul ortalaması civarında';
    } else {
      result.position = 'altında';
      result.percentileLabel = `Okul ortalamasının ${Math.abs(diff)} puan altında`;
    }
  }

  return result;
}

// ── Norm Tablosu Oluşturma SQL (Migration) ───────────────
export const NORM_TABLE_SQL = `
-- FAZ 3: Norm tablosu
CREATE TABLE IF NOT EXISTS norm_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL,
  grade TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'all',
  percentile_25 NUMERIC NOT NULL DEFAULT 0,
  percentile_50 NUMERIC NOT NULL DEFAULT 0,
  percentile_75 NUMERIC NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(test_type, grade, gender)
);

-- RLS
ALTER TABLE norm_scores ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (norm verileri genel)
CREATE POLICY "norm_scores_select" ON norm_scores
  FOR SELECT USING (true);

-- Sadece admin yazabilir
CREATE POLICY "norm_scores_insert" ON norm_scores
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "norm_scores_update" ON norm_scores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_norm_scores_lookup
  ON norm_scores (test_type, grade, gender);
`;
