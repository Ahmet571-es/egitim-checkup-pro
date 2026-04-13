// ============================================================
// FAZ 2 — Çok Boyutlu Risk Skoru Algoritması
// ============================================================
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore } from './correlation';

// ── Tipler ──────────────────────────────────────────────────
export type RiskLevel = 'kritik' | 'izlenmeli' | 'saglikli';

export interface RiskResult {
  overallScore: number; // 0-100
  level: RiskLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  label: string;
  dimensions: RiskDimension[];
  flags: RiskFlag[];
}

export interface RiskDimension {
  key: string;
  name: string;
  score: number | null; // 0-100, null = veri yok
  weight: number;
  available: boolean;
}

export interface RiskFlag {
  id: string;
  message: string;
  severity: 'kritik' | 'uyarı';
  icon: string;
}

// ── Risk Seviyesi Belirleme ─────────────────────────────
export function getRiskLevel(score: number): { level: RiskLevel; color: string; bgColor: string; borderColor: string; emoji: string; label: string } {
  if (score < 30) {
    return {
      level: 'kritik',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      emoji: '🔴',
      label: 'Kritik',
    };
  }
  if (score <= 60) {
    return {
      level: 'izlenmeli',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-400',
      emoji: '🟡',
      label: 'İzlenmeli',
    };
  }
  return {
    level: 'saglikli',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    emoji: '🟢',
    label: 'Sağlıklı',
  };
}

// ── Risk Skoru Hesapla ──────────────────────────────────
export function calculateRiskScore(
  studentResults: Array<{ test_type: string; scores: Record<string, unknown> }>
): RiskResult {
  const scoreMap: Record<string, number> = {};
  for (const r of studentResults) {
    const s = extractNormalizedScore(r.test_type, r.scores);
    if (s !== null) scoreMap[r.test_type] = s;
  }

  // Boyut tanımları ve ağırlıklar
  const dimensions: RiskDimension[] = [
    {
      key: 'sinav-kaygisi',
      name: 'Sınav Kaygısı',
      score: scoreMap['sinav-kaygisi'] ?? null,
      weight: 0.3,
      available: scoreMap['sinav-kaygisi'] !== undefined,
    },
    {
      key: 'd2-dikkat',
      name: 'Dikkat & Konsantrasyon',
      score: scoreMap['d2-dikkat'] ?? null,
      weight: 0.25,
      available: scoreMap['d2-dikkat'] !== undefined,
    },
    {
      key: 'calisma-davranisi',
      name: 'Çalışma Davranışı',
      score: scoreMap['calisma-davranisi'] ?? null,
      weight: 0.25,
      available: scoreMap['calisma-davranisi'] !== undefined,
    },
    {
      key: 'akademik-analiz',
      name: 'Akademik Analiz',
      score: scoreMap['akademik-analiz'] ?? null,
      weight: 0.2,
      available: scoreMap['akademik-analiz'] !== undefined,
    },
  ];

  // Ağırlıklı ortalama (sadece mevcut boyutlar)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const dim of dimensions) {
    if (dim.available && dim.score !== null) {
      weightedSum += dim.score * dim.weight;
      totalWeight += dim.weight;
    }
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
  const levelInfo = getRiskLevel(overallScore);

  // Otomatik uyarı flag'leri
  const flags: RiskFlag[] = [];

  if (scoreMap['sinav-kaygisi'] !== undefined && scoreMap['sinav-kaygisi'] < 25) {
    flags.push({
      id: 'kaygi-kritik',
      message: 'Çok yüksek sınav kaygısı — acil psikolojik destek değerlendirilmeli',
      severity: 'kritik',
      icon: '😰',
    });
  }

  if (scoreMap['d2-dikkat'] !== undefined && scoreMap['d2-dikkat'] < 20) {
    flags.push({
      id: 'dikkat-kritik',
      message: 'Dikkat performansı çok düşük — uzman değerlendirmesi önerilir',
      severity: 'kritik',
      icon: '🎯',
    });
  }

  if (scoreMap['calisma-davranisi'] !== undefined && scoreMap['calisma-davranisi'] < 25) {
    flags.push({
      id: 'calisma-kritik',
      message: 'Çalışma davranışı çok yetersiz — yapılandırılmış destek gerekli',
      severity: 'kritik',
      icon: '📖',
    });
  }

  if (scoreMap['akademik-analiz'] !== undefined && scoreMap['akademik-analiz'] < 25) {
    flags.push({
      id: 'akademik-kritik',
      message: 'Akademik performans kritik seviyede — bireysel destek planı oluşturulmalı',
      severity: 'kritik',
      icon: '🎓',
    });
  }

  // Kaygı yüksek + çalışma düşük birlikte
  if (
    scoreMap['sinav-kaygisi'] !== undefined &&
    scoreMap['calisma-davranisi'] !== undefined &&
    scoreMap['sinav-kaygisi'] < 35 &&
    scoreMap['calisma-davranisi'] < 35
  ) {
    flags.push({
      id: 'kaygi-calisma-dongu',
      message: 'Kaygı-performans kısır döngüsü tespit edildi',
      severity: 'uyarı',
      icon: '🔁',
    });
  }

  return {
    overallScore,
    ...levelInfo,
    dimensions,
    flags,
  };
}

// ── Supabase: Öğrencinin risk skorunu hesapla ───────────
export async function getStudentRiskScore(studentId: string): Promise<RiskResult> {
  const supabase = createClient();
  const { data } = await supabase
    .from('test_results')
    .select('test_type, scores')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    return calculateRiskScore([]);
  }

  // Her test tipinden son sonuç
  const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
  for (const row of data) {
    if (!latestByType.has(row.test_type)) {
      latestByType.set(row.test_type, {
        test_type: row.test_type,
        scores: row.scores as Record<string, unknown>,
      });
    }
  }

  return calculateRiskScore(Array.from(latestByType.values()));
}

// ── Supabase: Sınıftaki tüm öğrencilerin risk listesi ──
export async function getClassRiskList(classId: string) {
  const supabase = createClient();

  // Sınıf öğrencilerini çek
  const { data: students } = await supabase
    .from('class_students')
    .select('student_id, student:profiles!class_students_student_id_fkey(id, full_name, email)')
    .eq('class_id', classId);

  if (!students || students.length === 0) return [];

  const riskList: Array<{
    studentId: string;
    studentName: string;
    risk: RiskResult;
    mostCriticalFlag: string | null;
  }> = [];

  for (const s of students) {
    const profile = s.student as unknown as { id: string; full_name: string } | null;
    if (!profile) continue;

    const { data: results } = await supabase
      .from('test_results')
      .select('test_type, scores')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });

    if (!results) continue;

    const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
    for (const row of results) {
      if (!latestByType.has(row.test_type)) {
        latestByType.set(row.test_type, {
          test_type: row.test_type,
          scores: row.scores as Record<string, unknown>,
        });
      }
    }

    const risk = calculateRiskScore(Array.from(latestByType.values()));
    riskList.push({
      studentId: profile.id,
      studentName: profile.full_name,
      risk,
      mostCriticalFlag: risk.flags.length > 0 ? risk.flags[0].message : null,
    });
  }

  // Risk skoruna göre sırala (düşük = daha riskli)
  riskList.sort((a, b) => a.risk.overallScore - b.risk.overallScore);
  return riskList;
}
