// ============================================================
// FAZ 2 — Kariyer Eşleştirme Motoru
// ============================================================
import { createClient } from '@/lib/supabase/client';

// ── Tipler ──────────────────────────────────────────────────
export interface CareerSuggestion {
  rank: number;
  career: string;
  field: string;
  matchScore: number; // 0-100
  reasons: string[];
  icon: string;
}

export interface CareerMatchResult {
  topCareers: CareerSuggestion[];
  hollandCode: string | null;
  dominantZeka: string | null;
  varkStyle: string | null;
  compatibilityNote: string;
}

// ── Türkiye Meslek Listesi ──────────────────────────────
interface CareerDef {
  name: string;
  field: string;
  icon: string;
  holland: string[]; // uyumlu holland tipleri
  zeka: string[];    // uyumlu zeka alanları
  vark: string[];    // uyumlu vark stilleri
}

const CAREER_DATABASE: CareerDef[] = [
  { name: 'Yazılım Mühendisi', field: 'Teknoloji', icon: '💻', holland: ['I', 'C'], zeka: ['mantiksal', 'mantıksal-matematiksel'], vark: ['R', 'K'] },
  { name: 'Tıp Doktoru', field: 'Sağlık', icon: '🩺', holland: ['I', 'S'], zeka: ['dogaci', 'doğacı', 'mantiksal', 'mantıksal-matematiksel'], vark: ['R', 'K'] },
  { name: 'Mimar', field: 'Tasarım', icon: '🏛️', holland: ['A', 'I'], zeka: ['gorsel', 'görsel-uzamsal', 'mantiksal'], vark: ['V'] },
  { name: 'Psikolog', field: 'Sosyal Bilimler', icon: '🧠', holland: ['S', 'I'], zeka: ['sosyal', 'kisisel', 'kişilerarası', 'icsel', 'içsel'], vark: ['A', 'R'] },
  { name: 'Grafik Tasarımcı', field: 'Tasarım', icon: '🎨', holland: ['A', 'C'], zeka: ['gorsel', 'görsel-uzamsal'], vark: ['V', 'K'] },
  { name: 'Öğretmen', field: 'Eğitim', icon: '📚', holland: ['S', 'A'], zeka: ['sosyal', 'kisisel', 'kişilerarası', 'sozel', 'sözel-dilsel'], vark: ['A', 'R'] },
  { name: 'Avukat', field: 'Hukuk', icon: '⚖️', holland: ['E', 'S'], zeka: ['sozel', 'sözel-dilsel', 'mantiksal'], vark: ['R', 'A'] },
  { name: 'Ekonomist', field: 'Finans', icon: '📈', holland: ['I', 'E'], zeka: ['mantiksal', 'mantıksal-matematiksel'], vark: ['R'] },
  { name: 'Gazeteci', field: 'Medya', icon: '📰', holland: ['A', 'E'], zeka: ['sozel', 'sözel-dilsel', 'sosyal'], vark: ['R', 'A'] },
  { name: 'Müzisyen', field: 'Sanat', icon: '🎵', holland: ['A'], zeka: ['muziksel', 'müziksel-ritmik'], vark: ['A', 'K'] },
  { name: 'Biyolog', field: 'Bilim', icon: '🔬', holland: ['I'], zeka: ['dogaci', 'doğacı', 'mantiksal'], vark: ['R', 'K'] },
  { name: 'İşletme Yöneticisi', field: 'Yönetim', icon: '🏢', holland: ['E', 'C'], zeka: ['sosyal', 'kisisel', 'kişilerarası', 'mantiksal'], vark: ['R', 'A'] },
  { name: 'Fizyoterapist', field: 'Sağlık', icon: '💪', holland: ['S', 'I'], zeka: ['bedensel', 'bedensel-kinestetik', 'sosyal'], vark: ['K'] },
  { name: 'Mühendis (Makine)', field: 'Mühendislik', icon: '⚙️', holland: ['R', 'I'], zeka: ['mantiksal', 'mantıksal-matematiksel', 'gorsel', 'görsel-uzamsal'], vark: ['K', 'V'] },
  { name: 'Eczacı', field: 'Sağlık', icon: '💊', holland: ['I', 'C'], zeka: ['mantiksal', 'mantıksal-matematiksel', 'dogaci'], vark: ['R'] },
  { name: 'Pilot', field: 'Havacılık', icon: '✈️', holland: ['R', 'I'], zeka: ['gorsel', 'görsel-uzamsal', 'bedensel'], vark: ['K', 'V'] },
  { name: 'Veteriner', field: 'Sağlık', icon: '🐾', holland: ['I', 'R'], zeka: ['dogaci', 'doğacı', 'bedensel'], vark: ['K'] },
  { name: 'Diş Hekimi', field: 'Sağlık', icon: '🦷', holland: ['I', 'R'], zeka: ['bedensel', 'bedensel-kinestetik', 'mantiksal'], vark: ['K', 'V'] },
  { name: 'Sosyal Hizmet Uzmanı', field: 'Sosyal', icon: '🤝', holland: ['S'], zeka: ['sosyal', 'kisisel', 'kişilerarası', 'icsel', 'içsel'], vark: ['A'] },
  { name: 'Arkeolog', field: 'Bilim', icon: '🏺', holland: ['I', 'A'], zeka: ['gorsel', 'görsel-uzamsal', 'dogaci', 'doğacı'], vark: ['K', 'V'] },
  { name: 'Muhasebeci', field: 'Finans', icon: '🧮', holland: ['C', 'E'], zeka: ['mantiksal', 'mantıksal-matematiksel'], vark: ['R'] },
  { name: 'Spor Eğitmeni', field: 'Spor', icon: '🏅', holland: ['R', 'S'], zeka: ['bedensel', 'bedensel-kinestetik', 'sosyal'], vark: ['K'] },
  { name: 'İç Mimar', field: 'Tasarım', icon: '🛋️', holland: ['A', 'R'], zeka: ['gorsel', 'görsel-uzamsal'], vark: ['V', 'K'] },
  { name: 'Diplomat', field: 'Uluslararası İlişkiler', icon: '🌍', holland: ['E', 'S'], zeka: ['sozel', 'sözel-dilsel', 'sosyal', 'kisisel'], vark: ['R', 'A'] },
  { name: 'Veri Bilimci', field: 'Teknoloji', icon: '📊', holland: ['I', 'C'], zeka: ['mantiksal', 'mantıksal-matematiksel'], vark: ['R', 'V'] },
];

// ── VARK Etiket Eşleme ─────────────────────────────────
const VARK_LABELS: Record<string, string> = {
  V: 'Görsel',
  A: 'İşitsel',
  R: 'Okuma/Yazma',
  K: 'Kinestetik',
};

// ── Kariyer Eşleştirme ──────────────────────────────────
export function matchCareers(
  studentResults: Array<{ test_type: string; scores: Record<string, unknown> }>
): CareerMatchResult {
  // Holland verisi
  const hollandResult = studentResults.find(r => r.test_type === 'holland');
  const hollandCode = hollandResult
    ? (hollandResult.scores as Record<string, unknown>).hollandCode as string | undefined
    : undefined;
  const hollandTop3 = hollandResult
    ? ((hollandResult.scores as Record<string, unknown>).top3 as [string, number][] | undefined) ?? []
    : [];

  // Çoklu Zekâ verisi
  const zekaResult = studentResults.find(r => r.test_type === 'coklu-zeka');
  const zekaTop3 = zekaResult
    ? ((zekaResult.scores as Record<string, unknown>).top3 as Array<[string, { pct: number }]> | undefined) ?? []
    : [];
  const dominantZekaKeys = zekaTop3.map(z => z[0].toLowerCase());

  // VARK verisi
  const varkResult = studentResults.find(r => r.test_type === 'vark');
  const varkDominant = varkResult
    ? ((varkResult.scores as Record<string, unknown>).dominant as [string, number] | undefined)?.[0]
    : undefined;
  const varkSorted = varkResult
    ? ((varkResult.scores as Record<string, unknown>).sorted as [string, number][] | undefined) ?? []
    : [];

  // Çalışma Davranışı verisi
  const calismaResult = studentResults.find(r => r.test_type === 'calisma-davranisi');
  const calismaPct = calismaResult
    ? (calismaResult.scores as Record<string, unknown>).positivePct as number | undefined
    : undefined;

  // Her kariyer için skor hesapla
  const scoredCareers = CAREER_DATABASE.map(career => {
    let score = 0;
    const reasons: string[] = [];

    // Holland uyumu (max 40 puan)
    if (hollandTop3.length > 0) {
      const hollandLetters = hollandTop3.map(h => h[0]);
      for (const hl of hollandLetters) {
        if (career.holland.includes(hl)) {
          const idx = hollandLetters.indexOf(hl);
          const pts = idx === 0 ? 40 : idx === 1 ? 25 : 15;
          score += pts;
          reasons.push(`Holland ${hl} tipi ile uyumlu`);
          break;
        }
      }
    }

    // Çoklu Zekâ uyumu (max 35 puan)
    if (dominantZekaKeys.length > 0) {
      for (const zk of dominantZekaKeys) {
        if (career.zeka.some(cz => cz.includes(zk) || zk.includes(cz))) {
          const idx = dominantZekaKeys.indexOf(zk);
          const pts = idx === 0 ? 35 : idx === 1 ? 20 : 10;
          score += pts;
          reasons.push(`Zekâ alanı uyumu`);
          break;
        }
      }
    }

    // VARK uyumu (max 15 puan)
    if (varkDominant && career.vark.includes(varkDominant)) {
      score += 15;
      reasons.push(`${VARK_LABELS[varkDominant] || varkDominant} öğrenme stili uyumlu`);
    }

    // Çalışma davranışı bonusu (max 10 puan)
    if (calismaPct !== undefined && calismaPct > 60) {
      score += 10;
    }

    return { ...career, matchScore: Math.min(100, score), reasons };
  });

  // En yüksek 5'i seç
  scoredCareers.sort((a, b) => b.matchScore - a.matchScore);
  const topCareers: CareerSuggestion[] = scoredCareers.slice(0, 5).map((c, i) => ({
    rank: i + 1,
    career: c.name,
    field: c.field,
    matchScore: c.matchScore,
    reasons: c.reasons,
    icon: c.icon,
  }));

  // VARK + Çalışma uyumluluk notu
  let compatibilityNote = '';
  if (varkDominant && calismaPct !== undefined) {
    const style = VARK_LABELS[varkDominant] || varkDominant;
    if (calismaPct < 40) {
      compatibilityNote = `${style} öğrenme tercihiniz var ancak çalışma alışkanlıklarınız bu stile uygun yöntemlerle desteklenmeye ihtiyaç duyuyor.`;
    } else if (calismaPct < 65) {
      compatibilityNote = `${style} öğrenme stiliniz ve çalışma alışkanlıklarınız orta düzeyde uyumlu. Stil odaklı çalışma teknikleri ile veriminizi artırabilirsiniz.`;
    } else {
      compatibilityNote = `${style} öğrenme stiliniz ile çalışma alışkanlıklarınız iyi düzeyde uyumlu. Bu dengeyi sürdürün.`;
    }
  }

  return {
    topCareers,
    hollandCode: hollandCode ?? null,
    dominantZeka: zekaTop3.length > 0 ? zekaTop3[0][0] : null,
    varkStyle: varkDominant ? VARK_LABELS[varkDominant] ?? varkDominant : null,
    compatibilityNote,
  };
}

// ── Supabase: Öğrenci kariyer eşleştirmesi ──────────────
export async function getStudentCareerMatch(studentId: string): Promise<CareerMatchResult> {
  const supabase = createClient();
  const { data } = await supabase
    .from('test_results')
    .select('test_type, scores')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    return { topCareers: [], hollandCode: null, dominantZeka: null, varkStyle: null, compatibilityNote: '' };
  }

  const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
  for (const row of data) {
    if (!latestByType.has(row.test_type)) {
      latestByType.set(row.test_type, {
        test_type: row.test_type,
        scores: row.scores as Record<string, unknown>,
      });
    }
  }

  return matchCareers(Array.from(latestByType.values()));
}
