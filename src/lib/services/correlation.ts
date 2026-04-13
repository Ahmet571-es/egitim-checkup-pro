// ============================================================
// FAZ 2 — Çapraz Test Korelasyon Motoru
// ============================================================
import { createClient } from '@/lib/supabase/client';

// ── Tipler ──────────────────────────────────────────────────
export interface CorrelationPair {
  testA: string;
  testB: string;
  coefficient: number; // -1 … +1
  strength: 'güçlü' | 'orta' | 'zayıf';
  direction: 'pozitif' | 'negatif';
}

export interface PatternInsight {
  id: string;
  title: string;
  description: string;
  severity: 'kritik' | 'uyarı' | 'bilgi';
  relatedTests: string[];
  icon: string;
}

export interface CorrelationMatrix {
  tests: string[];
  matrix: number[][];
  pairs: CorrelationPair[];
}

// ── Test Adı Eşlemesi ────────────────────────────────────
export const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram',
  vark: 'VARK',
  holland: 'Holland RIASEC',
  'coklu-zeka': 'Çoklu Zekâ',
  'sinav-kaygisi': 'Sınav Kaygısı',
  'calisma-davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hızlı Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};

// ── Skoru normalize et (0-100) ──────────────────────────
export function extractNormalizedScore(testType: string, scores: Record<string, unknown>): number | null {
  try {
    switch (testType) {
      case 'enneagram': {
        const mainScore = scores.mainScore as number;
        return mainScore ? Math.min(100, (mainScore / 45) * 100) : null;
      }
      case 'vark': {
        const dominant = scores.dominant as [string, number] | undefined;
        if (!dominant) return null;
        const totalResp = (scores.totalResponses as number) || 16;
        return Math.min(100, (dominant[1] / totalResp) * 100);
      }
      case 'holland': {
        const sorted = scores.sortedTypes as [string, number][] | undefined;
        if (!sorted || sorted.length === 0) return null;
        return Math.min(100, (sorted[0][1] / 84) * 100);
      }
      case 'coklu-zeka': {
        const top3 = scores.top3 as Array<[string, { pct: number }]> | undefined;
        if (!top3 || top3.length === 0) return null;
        return top3[0][1].pct;
      }
      case 'sinav-kaygisi': {
        const totalPct = scores.totalPct as number;
        // Düşük kaygı = yüksek skor (ters çevir)
        return totalPct != null ? 100 - totalPct : null;
      }
      case 'calisma-davranisi': {
        const positivePct = scores.positivePct as number;
        return positivePct ?? null;
      }
      case 'akademik-analiz': {
        const overall = scores.overall as number;
        return overall ?? null;
      }
      case 'hizli-okuma': {
        const effectiveScore = scores.effectiveScore as number;
        return effectiveScore ?? null;
      }
      case 'd2-dikkat': {
        const cpPct = scores.cpPct as number;
        return cpPct ?? null;
      }
      case 'sag-sol-beyin': {
        const sagYuzde = scores.sagYuzde as number;
        const solYuzde = scores.solYuzde as number;
        // Denge skoru: dengeli = yüksek
        if (sagYuzde == null || solYuzde == null) return null;
        return 100 - Math.abs(sagYuzde - solYuzde);
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ── Pearson Korelasyon Katsayısı ────────────────────────
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ── Korelasyon Matrisi Hesapla ──────────────────────────
export function calculateCorrelation(
  studentResults: Array<{ test_type: string; scores: Record<string, unknown> }>
): CorrelationMatrix {
  const testTypes = [...new Set(studentResults.map(r => r.test_type))];
  const scoreMap: Record<string, number> = {};

  for (const r of studentResults) {
    const score = extractNormalizedScore(r.test_type, r.scores);
    if (score !== null) {
      scoreMap[r.test_type] = score;
    }
  }

  const validTests = testTypes.filter(t => scoreMap[t] !== undefined);
  const n = validTests.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      // Basitleştirilmiş korelasyon: normalize skorlar arasındaki benzerlik
      const scoreA = scoreMap[validTests[i]];
      const scoreB = scoreMap[validTests[j]];
      // Benzerlik bazlı korelasyon (tek öğrenci): normalize farkı kullan
      const diff = Math.abs(scoreA - scoreB);
      const coeff = Number((1 - diff / 100).toFixed(3));

      matrix[i][j] = coeff;
      matrix[j][i] = coeff;

      const absCoeff = Math.abs(coeff);
      const strength: CorrelationPair['strength'] =
        absCoeff >= 0.7 ? 'güçlü' : absCoeff >= 0.4 ? 'orta' : 'zayıf';

      pairs.push({
        testA: validTests[i],
        testB: validTests[j],
        coefficient: coeff,
        strength,
        direction: coeff >= 0 ? 'pozitif' : 'negatif',
      });
    }
  }

  return { tests: validTests, matrix, pairs };
}

// ── Örüntü Tespiti ──────────────────────────────────────
export function identifyPatterns(
  studentResults: Array<{ test_type: string; scores: Record<string, unknown> }>
): PatternInsight[] {
  const insights: PatternInsight[] = [];
  const scoreMap: Record<string, number> = {};

  for (const r of studentResults) {
    const s = extractNormalizedScore(r.test_type, r.scores);
    if (s !== null) scoreMap[r.test_type] = s;
  }

  // 1) Kaygı ↑ + Dikkat ↓ → kaygı-dikkat bağlantısı
  const kaygıScore = scoreMap['sinav-kaygisi']; // ters: düşük = yüksek kaygı
  const dikkatScore = scoreMap['d2-dikkat'];
  if (kaygıScore !== undefined && dikkatScore !== undefined) {
    if (kaygıScore < 40 && dikkatScore < 50) {
      insights.push({
        id: 'kaygi-dikkat',
        title: 'Kaygı-Dikkat Bağlantısı',
        description:
          'Yüksek sınav kaygısı ile düşük dikkat performansı arasında güçlü bir bağlantı tespit edildi. Kaygı, dikkat süresini kısaltıyor olabilir.',
        severity: 'kritik',
        relatedTests: ['sinav-kaygisi', 'd2-dikkat'],
        icon: '⚠️',
      });
    }
  }

  // 2) VARK kinestetik + çalışma davranışı düşük → öğrenme stili uyumsuzluğu
  const calismaSkor = scoreMap['calisma-davranisi'];
  const varkResult = studentResults.find(r => r.test_type === 'vark');
  if (varkResult && calismaSkor !== undefined && calismaSkor < 45) {
    const dominant = (varkResult.scores as Record<string, unknown>).dominant as [string, number] | undefined;
    if (dominant && dominant[0] === 'K') {
      insights.push({
        id: 'vark-calisma-uyumsuzluk',
        title: 'Öğrenme Stili Uyumsuzluğu',
        description:
          'Kinestetik (yaparak-yaşayarak) öğrenme tercihi ile düşük çalışma davranışı skoru, mevcut çalışma yöntemlerinin öğrenme stiline uymadığını gösteriyor.',
        severity: 'uyarı',
        relatedTests: ['vark', 'calisma-davranisi'],
        icon: '🔄',
      });
    }
  }

  // 3) Akademik düşük + çalışma düşük → temel akademik risk
  const akademikScore = scoreMap['akademik-analiz'];
  if (akademikScore !== undefined && calismaSkor !== undefined) {
    if (akademikScore < 40 && calismaSkor < 40) {
      insights.push({
        id: 'akademik-calisma-risk',
        title: 'Akademik Risk Alanı',
        description:
          'Hem akademik performans hem de çalışma alışkanlıkları düşük seviyelerde. Yapılandırılmış bir destek programı önerilir.',
        severity: 'kritik',
        relatedTests: ['akademik-analiz', 'calisma-davranisi'],
        icon: '🚨',
      });
    }
  }

  // 4) Kaygı ↑ + Çalışma düşük → kaygı-performans döngüsü
  if (kaygıScore !== undefined && calismaSkor !== undefined) {
    if (kaygıScore < 35 && calismaSkor < 40) {
      insights.push({
        id: 'kaygi-performans-dongusu',
        title: 'Kaygı-Performans Döngüsü',
        description:
          'Yüksek kaygı ve düşük çalışma skoru, kısır bir döngüye işaret ediyor: kaygı → çalışamama → düşük performans → daha fazla kaygı.',
        severity: 'kritik',
        relatedTests: ['sinav-kaygisi', 'calisma-davranisi'],
        icon: '🔁',
      });
    }
  }

  // 5) Çoklu zekâ güçlü ama akademik düşük → potansiyel-performans açığı
  const zekaScore = scoreMap['coklu-zeka'];
  if (zekaScore !== undefined && akademikScore !== undefined) {
    if (zekaScore > 70 && akademikScore < 50) {
      insights.push({
        id: 'potansiyel-performans-acigi',
        title: 'Potansiyel-Performans Açığı',
        description:
          'Yüksek zekâ potansiyeli ile düşük akademik performans arasında belirgin bir açık var. Motivasyon, öğrenme yöntemi veya çevresel faktörler incelenmeli.',
        severity: 'uyarı',
        relatedTests: ['coklu-zeka', 'akademik-analiz'],
        icon: '📊',
      });
    }
  }

  // 6) Hızlı okuma yüksek + akademik yüksek → güçlü okuma profili
  const okumaScore = scoreMap['hizli-okuma'];
  if (okumaScore !== undefined && akademikScore !== undefined) {
    if (okumaScore > 70 && akademikScore > 70) {
      insights.push({
        id: 'guclu-okuma-profili',
        title: 'Güçlü Okuma-Akademik Profili',
        description:
          'Hızlı okuma becerisi ile akademik başarı arasında olumlu bir korelasyon mevcut. Bu güçlü yön sürdürülmeli.',
        severity: 'bilgi',
        relatedTests: ['hizli-okuma', 'akademik-analiz'],
        icon: '✅',
      });
    }
  }

  // 7) Sağ-Sol beyin + VARK uyumu
  const beyinResult = studentResults.find(r => r.test_type === 'sag-sol-beyin');
  if (beyinResult && varkResult) {
    const dominant = (beyinResult.scores as Record<string, unknown>).dominant as string | undefined;
    const varkDominant = (varkResult.scores as Record<string, unknown>).dominant as [string, number] | undefined;
    if (dominant === 'sag' && varkDominant && (varkDominant[0] === 'V' || varkDominant[0] === 'K')) {
      insights.push({
        id: 'beyin-vark-uyumu',
        title: 'Beyin-Öğrenme Stili Uyumu',
        description:
          'Sağ beyin dominansı ile görsel/kinestetik öğrenme tercihi birbiriyle uyumlu. Bu öğrenci deneyimsel ve görsel yöntemlerle daha iyi öğrenebilir.',
        severity: 'bilgi',
        relatedTests: ['sag-sol-beyin', 'vark'],
        icon: '🧠',
      });
    }
  }

  return insights;
}

// ── Supabase'den tüm test sonuçlarını çek ───────────────
export async function getStudentCorrelationData(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('test_results')
    .select('test_type, scores, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error || !data) return { results: [], correlation: null, patterns: [] };

  // Her test tipinden en son sonucu al
  const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
  for (const row of data) {
    if (!latestByType.has(row.test_type)) {
      latestByType.set(row.test_type, {
        test_type: row.test_type,
        scores: row.scores as Record<string, unknown>,
      });
    }
  }

  const results = Array.from(latestByType.values());
  const correlation = calculateCorrelation(results);
  const patterns = identifyPatterns(results);

  return { results, correlation, patterns };
}
