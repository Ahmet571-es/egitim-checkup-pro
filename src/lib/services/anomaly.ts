/**
 * Faz 8: Anomali Tespit Servisi
 * Şüpheli test davranışlarını otomatik flag'leme
 */

import { createClient } from '@/lib/supabase/client';

export interface AnomalyFlag {
  testResultId: string;
  studentName: string;
  testType: string;
  flagType: 'too_fast' | 'pattern_response' | 'identical_answers';
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

const FLAG_DESCRIPTIONS: Record<string, string> = {
  too_fast: 'Test çok hızlı tamamlanmış',
  pattern_response: 'Tüm sorulara aynı cevap verilmiş',
  identical_answers: 'Ardışık sorularda tekrarlı pattern',
};

/** Test sonuçlarında anomali kontrolü */
export function detectAnomalies(result: {
  test_type: string;
  duration_seconds?: number;
  answers?: Record<string, string | number>;
  expected_duration_minutes?: number;
}): { flagType: string; description: string; severity: string }[] {
  const flags: { flagType: string; description: string; severity: string }[] = [];

  // 1. Çok hızlı tamamlama
  if (result.duration_seconds && result.expected_duration_minutes) {
    const expectedSeconds = result.expected_duration_minutes * 60;
    const ratio = result.duration_seconds / expectedSeconds;

    if (ratio < 0.1) {
      flags.push({
        flagType: 'too_fast',
        description: `Test beklenen sürenin %${Math.round(ratio * 100)}'inde tamamlanmış (${Math.round(result.duration_seconds)}sn / ${expectedSeconds}sn)`,
        severity: 'high',
      });
    } else if (ratio < 0.25) {
      flags.push({
        flagType: 'too_fast',
        description: `Test beklenen sürenin %${Math.round(ratio * 100)}'inde tamamlanmış`,
        severity: 'medium',
      });
    }
  }

  // 2. Pattern yanıtlama (tüm cevaplar aynı)
  if (result.answers) {
    const values = Object.values(result.answers);
    if (values.length > 5) {
      const uniqueValues = new Set(values);
      if (uniqueValues.size === 1) {
        flags.push({
          flagType: 'pattern_response',
          description: `Tüm ${values.length} soruya aynı cevap verilmiş: "${values[0]}"`,
          severity: 'high',
        });
      } else if (uniqueValues.size <= 2 && values.length > 20) {
        flags.push({
          flagType: 'identical_answers',
          description: `${values.length} sorudan sadece ${uniqueValues.size} farklı cevap kullanılmış`,
          severity: 'medium',
        });
      }
    }
  }

  return flags;
}

/** Öğretmenin sınıfındaki şüpheli testleri getir */
export async function getSuspiciousTests(teacherId: string): Promise<AnomalyFlag[]> {
  const supabase = createClient();

  // Öğretmenin sınıflarını getir
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId);

  if (!classes || classes.length === 0) return [];

  const classIds = classes.map(c => c.id);
  const { data: students } = await supabase
    .from('class_students')
    .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
    .in('class_id', classIds);

  if (!students || students.length === 0) return [];

  const studentIds = students.map(s => s.student_id);

  // Son 30 günün test sonuçları
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: results } = await supabase
    .from('test_results')
    .select('id, student_id, test_type, duration_seconds, answers, created_at')
    .in('student_id', studentIds)
    .gte('created_at', thirtyDaysAgo);

  const flags: AnomalyFlag[] = [];
  const nameMap = new Map<string, string>();
  for (const s of students) {
    const sd = s.student as unknown as { full_name: string } | null;
    if (sd) nameMap.set(s.student_id, sd.full_name);
  }

  for (const r of (results || [])) {
    const detected = detectAnomalies({
      test_type: r.test_type,
      duration_seconds: r.duration_seconds,
      answers: r.answers,
      expected_duration_minutes: 30,
    });

    for (const d of detected) {
      flags.push({
        testResultId: r.id,
        studentName: nameMap.get(r.student_id) || 'Bilinmeyen',
        testType: r.test_type,
        flagType: d.flagType as AnomalyFlag['flagType'],
        description: d.description,
        severity: d.severity as AnomalyFlag['severity'],
        createdAt: r.created_at,
      });
    }
  }

  return flags.sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}
