// ============================================================
// Rapor v2 — Sunucu tarafı yardımcıları
// ============================================================
// API rotalarının ortak kullandığı: öğrenci künyesi + okul adı + test
// sonuçlarının (gerekirse ham cevaplardan yeniden hesaplanmış) zengin skorları.

import type { SupabaseClient } from '@supabase/supabase-js';
import { bestScoresForReport } from '@/lib/report/recompute-scores';
import { buildReportV2, type BuildInput, type BuildInputTest, type ReportPackageId } from './build';
import { encodeReportV2 } from './serialize';
import { analyzeTest } from './analyze';
import type { ReportV2 } from './types';

export interface StudentRow {
  full_name?: string | null;
  grade?: number | string | null;
  birth_date?: string | null;
  school_id?: string | null;
}

export interface ResultRow {
  test_type: string;
  scores: unknown;
  raw_answers?: unknown;
  completed_at?: string | null;
  created_at?: string | null;
}

/** Okul adını getirir; bulunamazsa null. */
export async function fetchSchoolName(admin: SupabaseClient, schoolId: string | null | undefined): Promise<string | null> {
  if (!schoolId) return null;
  try {
    const { data } = await admin.from('schools').select('name').eq('id', schoolId).maybeSingle();
    const name = (data as { name?: string } | null)?.name;
    return name && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

function toGrade(g: unknown): number | null {
  const n = typeof g === 'number' ? g : parseInt(String(g ?? ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null;
}

/** Sonuç satırlarını, eski kayıtlar için ham cevaplardan yeniden hesaplayarak hazırlar. */
export async function prepareTests(rows: ResultRow[]): Promise<BuildInputTest[]> {
  const out: BuildInputTest[] = [];
  for (const r of rows) {
    const { scores } = await bestScoresForReport(r.test_type, r.scores, r.raw_answers);
    out.push({ test_type: r.test_type, scores, date: r.completed_at || r.created_at || null });
  }
  return out;
}

export async function buildStoredReportV2(
  admin: SupabaseClient,
  opts: { kind: 'package' | 'single'; packageId?: ReportPackageId; student: StudentRow; results: ResultRow[] },
): Promise<{ report: ReportV2; text: string } | null> {
  const tests = await prepareTests(opts.results);
  // En az bir test çözümlenebilmeli; yoksa çağıran taraf eski motora düşer.
  if (!tests.some((t) => analyzeTest(t.test_type, t.scores))) return null;
  const input: BuildInput = {
    kind: opts.kind,
    packageId: opts.packageId,
    tests,
    student: {
      fullName: opts.student.full_name || 'Öğrenci',
      grade: toGrade(opts.student.grade),
      birthDate: opts.student.birth_date ?? null,
      school: await fetchSchoolName(admin, opts.student.school_id),
    },
  };
  const report = buildReportV2(input);
  return { report, text: encodeReportV2(report) };
}
