// ============================================================
// BURDON DİKKAT TESTİ — Orijinal Word Form (Emre Bülbün versiyonu)
// Benjamin Bourdon (1895) — MEB Türkçe uyarlaması
//
// YAPI (Orijinal Word dosyasından birebir alınmış):
// - 3 paragraf × 10 satır × 22 harf = 660 harf toplam
// - HEDEF HARFLER: b, c, d, g
// - Her paragrafta ~39-40 hedef harf (toplam ~118)
// - Süre: Ortaokul 3 dk, Lise 2 dk / paragraf
//
// PATRONUN İSTEĞİ: Paragraf-bazlı dikkat dağılımı tespiti
// - 1. paragrafta yoğun hata → "Başlangıçta dikkat dağılıyor"
// - 2. paragrafta yoğun hata → "Ortada dikkat dağılıyor, sonda toparlanıyor"
// - 3. paragrafta yoğun hata → "Başta ve ortada iyi, son 1/3'te dağılıyor"
// ============================================================

export const BURDON_TARGETS = ['b', 'c', 'd', 'g'] as const;
export type BurdonTarget = typeof BURDON_TARGETS[number];

export const BURDON_CONFIG = {
  sections: 3,
  rowsPerSection: 10,
  lettersPerRow: 22,
  totalLettersPerSection: 220,
  totalTargetsPerSection: 39,
  timeSecondsOrtaokul: 180,
  timeSecondsLise: 120,
  practiceSectionRows: 2,
  practiceTimeSeconds: 30,
} as const;

// Word dosyasından birebir — 3 paragraf × 10 satır × 22 harf
const BURDON_LETTER_GRID: string[][][] = [
  [
    ["a", "e", "p", "z", "s", "u", "a", "h", "v", "k", "l", "a", "s", "i", "b", "i", "o", "u", "o", "u", "o", "e"],
    ["r", "v", "b", "p", "m", "i", "b", "i", "r", "b", "s", "m", "n", "t", "d", "a", "u", "f", "c", "f", "k", "a"],
    ["c", "k", "a", "h", "s", "e", "y", "p", "h", "b", "p", "s", "d", "g", "y", "z", "d", "v", "r", "i", "f", "g"],
    ["y", "d", "v", "c", "o", "y", "e", "r", "z", "h", "e", "z", "s", "e", "g", "m", "k", "f", "z", "d", "a", "y"],
    ["f", "s", "d", "y", "i", "b", "t", "d", "h", "m", "l", "n", "i", "e", "m", "t", "g", "t", "b", "d", "f", "u"],
    ["k", "c", "i", "c", "k", "o", "k", "o", "s", "t", "l", "u", "z", "u", "g", "m", "a", "f", "l", "v", "u", "t"],
    ["i", "z", "r", "f", "o", "u", "d", "v", "h", "y", "p", "n", "b", "p", "m", "v", "h", "n", "n", "g", "r", "y"],
    ["p", "v", "k", "l", "n", "t", "y", "o", "r", "z", "n", "c", "p", "h", "t", "e", "m", "z", "i", "o", "i", "m"],
    ["r", "a", "l", "y", "g", "s", "o", "i", "v", "a", "i", "n", "a", "r", "c", "h", "o", "d", "b", "f", "p", "h"],
    ["k", "u", "b", "s", "y", "g", "u", "e", "m", "k", "l", "t", "c", "g", "v", "g", "r", "i", "p", "c", "t", "e"],
  ],
  [
    ["c", "i", "t", "e", "l", "r", "n", "z", "f", "u", "d", "b", "m", "s", "h", "d", "k", "u", "f", "d", "s", "m"],
    ["s", "i", "v", "e", "t", "c", "p", "l", "r", "g", "v", "g", "c", "t", "l", "r", "m", "e", "u", "g", "y", "e"],
    ["b", "o", "k", "e", "h", "b", "u", "k", "o", "p", "f", "u", "d", "o", "h", "o", "r", "a", "n", "i", "a", "v"],
    ["i", "o", "s", "g", "y", "l", "a", "r", "m", "i", "f", "b", "z", "m", "e", "l", "h", "t", "z", "n", "z", "r"],
    ["o", "y", "t", "n", "a", "k", "v", "p", "y", "k", "g", "v", "n", "n", "h", "v", "m", "p", "b", "n", "p", "y"],
    ["v", "d", "u", "o", "f", "r", "h", "i", "t", "u", "v", "l", "u", "a", "m", "f", "a", "c", "u", "l", "t", "s"],
    ["o", "k", "o", "k", "c", "i", "c", "k", "u", "f", "s", "b", "t", "g", "t", "m", "e", "i", "n", "i", "z", "h"],
    ["d", "t", "b", "i", "y", "a", "s", "f", "y", "n", "d", "z", "f", "k", "m", "g", "e", "s", "z", "e", "h", "z"],
    ["r", "e", "n", "e", "o", "c", "v", "d", "y", "f", "f", "l", "r", "v", "d", "z", "y", "g", "d", "z", "p", "b"],
    ["p", "y", "c", "a", "a", "s", "c", "g", "c", "a", "h", "t", "n", "m", "p", "b", "r", "i", "b", "i", "k", "p"],
  ],
  [
    ["a", "f", "n", "p", "v", "d", "m", "t", "o", "y", "m", "i", "l", "g", "d", "e", "o", "t", "o", "c", "n", "t"],
    ["l", "u", "p", "z", "n", "k", "r", "h", "p", "u", "c", "b", "o", "y", "g", "u", "d", "v", "y", "a", "o", "l"],
    ["s", "z", "o", "a", "p", "f", "f", "t", "c", "v", "k", "i", "r", "b", "p", "m", "n", "e", "r", "g", "e", "s"],
    ["b", "a", "h", "v", "i", "h", "s", "c", "k", "z", "r", "f", "d", "r", "a", "c", "g", "y", "n", "m", "h", "y"],
    ["t", "d", "s", "v", "c", "g", "z", "y", "f", "m", "p", "t", "r", "o", "g", "e", "u", "u", "b", "b", "y", "h"],
    ["i", "u", "a", "n", "y", "a", "d", "u", "m", "f", "a", "p", "y", "z", "e", "b", "k", "d", "b", "o", "l", "z"],
    ["e", "l", "z", "h", "e", "a", "d", "z", "t", "c", "l", "p", "r", "y", "f", "m", "s", "n", "v", "i", "c", "v"],
    ["s", "b", "i", "v", "m", "z", "g", "p", "s", "m", "r", "k", "b", "k", "r", "e", "h", "c", "u", "v", "n", "s"],
    ["f", "l", "s", "l", "e", "i", "o", "l", "g", "l", "k", "t", "h", "z", "o", "k", "t", "d", "e", "a", "r", "h"],
    ["f", "m", "i", "ı", "c", "f", "t", "i", "b", "s", "g", "k", "m", "k", "n", "p", "h", "v", "b", "g", "u", "x"],
  ],
];

const BURDON_PRACTICE_GRID: string[][] = [
  ["b", "s", "a", "o", "c", "k", "m", "d", "r", "t", "i", "b", "n", "u", "g", "p", "e", "d", "l", "h", "c", "b"],
  ["r", "g", "t", "a", "k", "d", "v", "l", "b", "o", "c", "u", "g", "m", "i", "n", "e", "b", "p", "c", "d", "s"],
];

// ── Tipler ─────────────────────────────────────────────
export interface BurdonCell {
  letter: string;
  isTarget: boolean;
}

export interface BurdonSection {
  index: number;
  rows: BurdonCell[][];
  targetCount: number;
}

export interface BurdonRowResponse {
  row: number;
  markedCells: number[];
}

export interface BurdonSectionResponse {
  section: number;
  responses: BurdonRowResponse[];
  completed: boolean;
  timeTakenSeconds: number;
  reachedRow: number;
}

export interface BurdonRowScore {
  row: number;
  correct: number;
  omission: number;
  commission: number;
  targetCount: number;
}

export interface BurdonSectionScore {
  section: number;
  rowScores: BurdonRowScore[];
  totalCorrect: number;
  totalOmission: number;
  totalCommission: number;
  totalErrors: number;  // E1 + E2
  totalTargets: number;
  reachedRow: number;
  accuracy: number;
  normalizedScore: number;
}

export type BurdonAttentionPattern =
  | 'mukemmel'
  | 'basta-dagilan'
  | 'ortada-dagilan'
  | 'sonda-dagilan'
  | 'dengeli';

export interface BurdonOverallScore {
  sections: BurdonSectionScore[];
  totalCorrect: number;
  totalOmission: number;
  totalCommission: number;
  totalTargets: number;
  overallAccuracy: number;
  overallScore: number;
  attentionPattern: BurdonAttentionPattern;
  patternTitle: string;
  patternFinding: string;
  patternSuggestion: string;
  paragraphErrors: [number, number, number];
}

// ── Test Üretimi ───────────────────────────────────────

function buildSectionFromGrid(rows: string[][], sectionIndex: number): BurdonSection {
  const builtRows: BurdonCell[][] = rows.map(row =>
    row.map(letter => ({
      letter,
      isTarget: (BURDON_TARGETS as readonly string[]).includes(letter),
    }))
  );
  const targetCount = builtRows.reduce(
    (sum, row) => sum + row.filter(c => c.isTarget).length,
    0
  );
  return { index: sectionIndex, rows: builtRows, targetCount };
}

export function generateBurdonTest(): BurdonSection[] {
  return BURDON_LETTER_GRID.map((para, idx) => buildSectionFromGrid(para, idx));
}

export function generateBurdonPractice(): BurdonSection {
  return { ...buildSectionFromGrid(BURDON_PRACTICE_GRID, -1), index: -1 };
}

// ── Skorlama ──────────────────────────────────────────

function scoreRow(row: BurdonCell[], markedIndices: Set<number>, rowIdx: number): BurdonRowScore {
  let correct = 0, omission = 0, commission = 0, targetCount = 0;
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    const isMarked = markedIndices.has(i);
    if (cell.isTarget) {
      targetCount++;
      if (isMarked) correct++;
      else omission++;
    } else if (isMarked) {
      commission++;
    }
  }
  return { row: rowIdx, correct, omission, commission, targetCount };
}

function scoreSection(section: BurdonSection, response: BurdonSectionResponse): BurdonSectionScore {
  const rowScores: BurdonRowScore[] = [];
  let totalC = 0, totalE1 = 0, totalE2 = 0, totalT = 0;
  for (let r = 0; r < section.rows.length; r++) {
    const resp = response.responses.find(x => x.row === r);
    const markedSet = new Set<number>(resp?.markedCells ?? []);
    const rs = scoreRow(section.rows[r], markedSet, r);
    rowScores.push(rs);
    totalC += rs.correct;
    totalE1 += rs.omission;
    totalE2 += rs.commission;
    totalT += rs.targetCount;
  }
  const accuracy = totalT > 0 ? (totalC / totalT) * 100 : 0;
  const rawScore = Math.max(0, totalC - totalE2);
  const normalizedScore = totalT > 0 ? Math.max(0, Math.min(100, (rawScore / totalT) * 100)) : 0;

  return {
    section: section.index,
    rowScores,
    totalCorrect: totalC,
    totalOmission: totalE1,
    totalCommission: totalE2,
    totalErrors: totalE1 + totalE2,
    totalTargets: totalT,
    reachedRow: response.reachedRow,
    accuracy: Math.round(accuracy * 10) / 10,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
  };
}

// ── Paragraf-Bazlı Dikkat Örüntüsü Tespiti ─────────────

function detectAttentionPattern(
  sections: BurdonSectionScore[]
): { pattern: BurdonAttentionPattern; errors: [number, number, number] } {
  const e = sections.map(s => s.totalErrors);
  const errors: [number, number, number] = [e[0] ?? 0, e[1] ?? 0, e[2] ?? 0];
  const total = errors.reduce((a, b) => a + b, 0);

  // Hiç hata yok → mükemmel dikkat
  if (total === 0) return { pattern: 'mukemmel', errors };

  // 1 hata → genel olarak dengeli
  if (total <= 1) return { pattern: 'dengeli', errors };

  // 2+ hata → hatalar tek bir paragrafa yoğunlaşmış mı?
  const maxIdx = errors.indexOf(Math.max(...errors));
  const maxVal = errors[maxIdx];
  const otherSum = total - maxVal;

  // Yoğunlaşma kriteri: en yüksek paragrafın hatası diğerlerinin toplamının ≥1.5 katı
  // VEYA tüm hatalar tek paragrafta (otherSum=0 ve maxVal≥2)
  const isConcentrated =
    (otherSum === 0 && maxVal >= 2) ||
    (maxVal >= 2 && maxVal >= otherSum * 1.5);

  if (isConcentrated) {
    if (maxIdx === 0) return { pattern: 'basta-dagilan', errors };
    if (maxIdx === 1) return { pattern: 'ortada-dagilan', errors };
    return { pattern: 'sonda-dagilan', errors };
  }

  // Hatalar dağınık, belirgin örüntü yok
  return { pattern: 'dengeli', errors };
}

const PATTERN_COPY: Record<BurdonAttentionPattern, { title: string; finding: string; suggestion: string }> = {
  'mukemmel': {
    title: 'Mükemmel Dikkat Profili',
    finding:
      'Tebrikler! Test boyunca hiç hata yapmadın. Tüm paragraflarda dikkatini eksiksiz koruyabilmen, çok güçlü bir konsantrasyon yeteneğine işaret ediyor olabilir.',
    suggestion:
      'Bu seviyeyi sürdürmek için düzenli uyku, sağlıklı beslenme ve günlük kısa odaklanma egzersizleri (örn. derin okuma, yap-boz, satranç) yardımcı olur. Ayrıca dikkatini gerektiren yeni alanlara da yönelmek bu yeteneğini geliştirmeye devam eder.',
  },
  'basta-dagilan': {
    title: 'Başlangıçta Dikkat Dağılımı',
    finding:
      'Derslerde ve sınavlarda başlangıçta dikkatinin daha fazla dağılma eğilimi gözleniyor olabilir. İlk paragrafta hata ve atlama sayısı diğer bölümlere göre belirgin yüksek çıktı.',
    suggestion:
      'Ders veya sınavdan önce 2-3 dakikalık bir zihinsel ısınma denemek faydalı olabilir: birkaç basit soru çöz, nefes egzersizi yap, çalışma ortamını hazırla. Aynı şekilde aşamalı başlangıç yapılabilir — kolay konulardan başla, sonra zora geç.',
  },
  'ortada-dagilan': {
    title: 'Ortada Dikkat Dağılımı',
    finding:
      'Başlangıçta dikkatin iyi durumda olmakla birlikte, ortalara doğru dikkat dağılma eğilimi gösterebiliyor, ardından sona doğru tekrar toparlanma gözleniyor. İkinci paragrafta hata/atlama sayısı diğer iki paragrafa göre belirgin yüksek.',
    suggestion:
      'Uzun çalışmalarda tam ortada (15-20 dakika sonrası) kısa bir mola denenebilir — 3-5 dakika ayağa kalkmak, su içmek, gözleri dinlendirmek yardımcı olabilir. Sınav sırasında ortadaki soruları acele etmeden, bir daha okuyarak çözmen performansı koruyabilir.',
  },
  'sonda-dagilan': {
    title: 'Sonda Dikkat Dağılımı',
    finding:
      "Başta ve ortada dikkatin iyi olmakla birlikte, son 1/3'lük kısımda dikkatin dağılma eğilimi gösteriyor olabilir. Üçüncü paragrafta hata/atlama sayısı diğer bölümlere göre belirgin yüksek çıktı.",
    suggestion:
      'Uzun sınavlarda ve derslerin son bölümünde dikkat yorgunluğu doğal bir durum — zor soruları ve kritik konuları başa veya ortaya yerleştirmek yerinde olabilir. Çalışma seanslarını 30-40 dakikalık bloklara bölmek, son kısımda taze kalmana yardımcı olabilir.',
  },
  'dengeli': {
    title: 'Dengeli Dikkat Profili',
    finding:
      'Üç paragraf boyunca dikkatin dengeli bir seyir izliyor. Hata dağılımı belirgin bir bölgede yoğunlaşmıyor — bu, sürdürülebilir bir dikkat yapısına işaret ediyor olabilir.',
    suggestion:
      'Mevcut çalışma düzenini korumak yerinde görünüyor. Dikkati daha da güçlendirmek için haftada birkaç kez 20-30 dakikalık odak egzersizleri (satranç, yap-boz, derin okuma) faydalı olabilir.',
  },
};

// ── Ana Hesaplama ─────────────────────────────────────

export function calculateBurdon(
  test: BurdonSection[],
  responses: BurdonSectionResponse[]
): BurdonOverallScore {
  const sectionScores: BurdonSectionScore[] = [];
  for (const section of test) {
    const resp = responses.find(r => r.section === section.index);
    if (!resp) {
      sectionScores.push({
        section: section.index,
        rowScores: section.rows.map((_, r) => ({ row: r, correct: 0, omission: 0, commission: 0, targetCount: 0 })),
        totalCorrect: 0,
        totalOmission: section.targetCount,
        totalCommission: 0,
        totalErrors: section.targetCount,
        totalTargets: section.targetCount,
        reachedRow: 0,
        accuracy: 0,
        normalizedScore: 0,
      });
    } else {
      sectionScores.push(scoreSection(section, resp));
    }
  }

  const totalC = sectionScores.reduce((a, s) => a + s.totalCorrect, 0);
  const totalE1 = sectionScores.reduce((a, s) => a + s.totalOmission, 0);
  const totalE2 = sectionScores.reduce((a, s) => a + s.totalCommission, 0);
  const totalT = sectionScores.reduce((a, s) => a + s.totalTargets, 0);
  const overallAccuracy = totalT > 0 ? (totalC / totalT) * 100 : 0;

  const { pattern, errors } = detectAttentionPattern(sectionScores);
  const copy = PATTERN_COPY[pattern];

  const rawOverall = Math.max(0, totalC - totalE2);
  const overallScore = totalT > 0 ? Math.max(0, Math.min(100, (rawOverall / totalT) * 100)) : 0;

  return {
    sections: sectionScores,
    totalCorrect: totalC,
    totalOmission: totalE1,
    totalCommission: totalE2,
    totalTargets: totalT,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10,
    attentionPattern: pattern,
    patternTitle: copy.title,
    patternFinding: copy.finding,
    patternSuggestion: copy.suggestion,
    paragraphErrors: errors,
  };
}

export function getBurdonTimePerSection(studentGrade: number | null | undefined): number {
  if (!studentGrade) return BURDON_CONFIG.timeSecondsOrtaokul;
  if (studentGrade >= 9 && studentGrade <= 12) return BURDON_CONFIG.timeSecondsLise;
  return BURDON_CONFIG.timeSecondsOrtaokul;
}

export function generateBurdonReport(score: BurdonOverallScore): Record<string, unknown> {
  return {
    toplam_dogru: score.totalCorrect,
    toplam_ihmal_hatasi: score.totalOmission,
    toplam_yanlis_isaret: score.totalCommission,
    toplam_hedef: score.totalTargets,
    genel_dogruluk_yuzdesi: score.overallAccuracy,
    genel_puan: score.overallScore,
    dikkat_oruntusu: score.attentionPattern,
    oruntu_basligi: score.patternTitle,
    oruntu_tespiti: score.patternFinding,
    oruntu_tavsiyesi: score.patternSuggestion,
    paragraf_hatalari: {
      paragraf_1: score.paragraphErrors[0],
      paragraf_2: score.paragraphErrors[1],
      paragraf_3: score.paragraphErrors[2],
    },
    bolumler: score.sections.map(s => ({
      bolum: s.section + 1,
      dogru: s.totalCorrect,
      ihmal_hatasi: s.totalOmission,
      yanlis_isaret: s.totalCommission,
      toplam_hata: s.totalErrors,
      dogruluk_yuzdesi: s.accuracy,
      bolum_puani: s.normalizedScore,
    })),
  };
}
