// ============================================================
// BURDON DİKKAT TESTİ — Orijinal Formatı (Benjamin Bourdon, 1895)
// Türk MEB Uyarlaması — Prof. Dr. Servet Bayram referansı
//
// YAPISAL SPESİFİKASYON (Orijinal MEB Formu):
// - 3 bölüm × 20 satır × 40 harf = 2400 stimuli
// - Her bölümde orijinal dağılım: 150(a) + 75(g) + 50(b) + 25(d) = 300 hedef
// - Hedef olmayan dolgu harfler: c,e,f,h,i,j,k,l,m,n,o,p,r,s,t,u,v,y,z
// - Süre: Ortaokul 3 dk/bölüm, Lise 2 dk/bölüm (otomatik sınıfa göre)
// - Metrikler: C (Correct), E1 (ihmal), E2 (yanlış), TN (tamamlanan)
// - Profil: dikkat-dagilimi | uyum-guclugu | dikkat-zayifligi | dengeli
// ============================================================

// ── KONFİGÜRASYON (Orijinale Sadık) ─────────────────────
export const BURDON_CONFIG = {
  sections: 3,                  // Orijinal: 3 bölüm (dikkat dayanıklılığı)
  rowsPerSection: 20,           // Her bölümde 20 satır
  lettersPerRow: 40,            // Her satırda 40 harf
  totalLettersPerSection: 800,  // 20 × 40
  totalTargetsPerSection: 300,  // 150a + 75g + 50b + 25d
  targetDistribution: {
    a: 150,
    g: 75,
    b: 50,
    d: 25,
  } as const,
  timeSecondsOrtaokul: 180,  // 3 dakika
  timeSecondsLise: 120,       // 2 dakika
  practiceSectionRows: 2,    // Deneme için 2 satır
  practiceTimeSeconds: 30,   // Deneme için 30 saniye
} as const;

export const BURDON_TARGETS = ['a', 'b', 'd', 'g'] as const;
export type BurdonTarget = typeof BURDON_TARGETS[number];

// Hedef olmayan dolgu harfler (Türk alfabesi benzer, küçük harf)
const FILLER_LETTERS = ['c', 'e', 'f', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'y', 'z'];

// ── Seeded Random (Sabit yaprak için) ───────────────────
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed >>> 0; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ── Tipler ────────────────────────────────────────────────
export interface BurdonCell {
  letter: string;
  isTarget: boolean;  // a, b, d, g ise true
}

export interface BurdonSection {
  index: number;        // 0, 1, 2
  rows: BurdonCell[][]; // 20 satır × 40 hücre
  targetCount: number;  // 300 (her zaman)
}

export interface BurdonRowResponse {
  row: number;                // 0-19
  markedCells: number[];     // Öğrencinin işaretlediği hücre indeksleri (0-39)
}

export interface BurdonSectionResponse {
  section: number;                  // 0, 1, 2
  responses: BurdonRowResponse[];
  completed: boolean;                // Süre bitmeden tamamlandı mı
  timeTakenSeconds: number;
  reachedRow: number;               // En son ulaştığı satır (TN için)
}

export interface BurdonRowScore {
  row: number;
  correct: number;        // C - doğru işaretlenen hedef
  omission: number;       // E1 - atlanan hedef
  commission: number;     // E2 - yanlış işaretlenen (hedef olmayan)
  targetCount: number;    // O satırdaki toplam hedef sayısı
}

export interface BurdonSectionScore {
  section: number;
  rowScores: BurdonRowScore[];
  totalCorrect: number;      // C
  totalOmission: number;     // E1
  totalCommission: number;   // E2
  totalTargets: number;      // 300 (genelde)
  reachedRow: number;        // TN
  accuracy: number;          // 0-100 (E2 hariç doğruluk)
  sustainedAttention: number; // 0-100 (ilk yarı vs son yarı oranı)
  rawScore: number;           // C - E2 (negatif olabilir → 0'a yuvarlanır)
  normalizedScore: number;   // 0-100
}

export interface BurdonOverallScore {
  sections: BurdonSectionScore[];
  totalCorrect: number;
  totalOmission: number;
  totalCommission: number;
  totalTargets: number;          // 900
  overallAccuracy: number;       // 0-100
  attentionPersistence: number;  // 0-100 (bölümler arası dengelilik)
  overallScore: number;          // 0-100 (kompozit)
  profile: BurdonProfile;
  profileLabel: string;
  profileDescription: string;
  attentionCurve: number[];       // 60 değer — her satır için skor (grafik için)
}

export type BurdonProfile =
  | 'dikkat-dagilimi'
  | 'uyum-guclugu'
  | 'dikkat-zayifligi'
  | 'dengeli';

// ── PROFİL TANIMLARI (Orijinal Bourdon Kriterleri) ─────
const PROFILE_DEFS: Record<BurdonProfile, { label: string; description: string }> = {
  'dikkat-dagilimi': {
    label: 'Dikkati Çabuk Dağılan Profil',
    description: 'İlk satırlarda hata azken ilerledikçe hata artma eğilimi gözleniyor. Dikkatin uzun süre tek bir yerde tutulmasında zorlanılıyor olabilir.',
  },
  'uyum-guclugu': {
    label: 'Uyum Güçlüğü Profili',
    description: 'İlk satırlarda hata çokken sonraki satırlarda hata azalma eğilimi gözleniyor. Çalışmaya ilk başlarken uyum süreci yavaş, bir süre sonra verim artıyor olabilir.',
  },
  'dikkat-zayifligi': {
    label: 'Dikkat Toplama Zayıflığı',
    description: 'Genel işaretleme sayısı beklenen düzeyin altında. Dikkatin bir noktaya toplanmasında zorlanılıyor olabilir.',
  },
  'dengeli': {
    label: 'Dengeli Dikkat Profili',
    description: 'Dikkat süreç boyunca dengeli bir seyir izliyor. Hata oranı makul düzeyde ve zaman içinde dalgalanma sınırlı.',
  },
};

// ============================================================
// TEST YAPRAĞI ÜRETİMİ (Deterministic — Sabit Seed)
// ============================================================

function buildLetterPool(targets: Partial<Record<BurdonTarget, number>>, totalLetters: number): string[] {
  const pool: string[] = [];

  // 1) Hedef harfleri ekle (orijinal dağılımda)
  for (const [letter, count] of Object.entries(targets) as [BurdonTarget, number | undefined][]) {
    const c = count ?? 0;
    for (let i = 0; i < c; i++) pool.push(letter);
  }

  // 2) Dolgu harflerle tamamla
  const totalTargets = Object.values(targets).reduce((a, b) => (a as number) + ((b as number | undefined) ?? 0), 0) as number;
  const fillerNeeded = totalLetters - totalTargets;
  // Her dolgu harfinden eşit dağıt (tam bölme mümkün değilse artanları ilk birkaç harfe dağıt)
  const perFiller = Math.floor(fillerNeeded / FILLER_LETTERS.length);
  const remainder = fillerNeeded - perFiller * FILLER_LETTERS.length;
  for (let i = 0; i < FILLER_LETTERS.length; i++) {
    const count = perFiller + (i < remainder ? 1 : 0);
    for (let j = 0; j < count; j++) pool.push(FILLER_LETTERS[i]);
  }

  return pool;
}

function generateSection(sectionIndex: number, seed: number): BurdonSection {
  const rng = new SeededRandom(seed);
  const pool = buildLetterPool(BURDON_CONFIG.targetDistribution, BURDON_CONFIG.totalLettersPerSection);
  const shuffled = rng.shuffle(pool);

  const rows: BurdonCell[][] = [];
  for (let r = 0; r < BURDON_CONFIG.rowsPerSection; r++) {
    const row: BurdonCell[] = [];
    for (let c = 0; c < BURDON_CONFIG.lettersPerRow; c++) {
      const letter = shuffled[r * BURDON_CONFIG.lettersPerRow + c];
      const isTarget = (BURDON_TARGETS as readonly string[]).includes(letter);
      row.push({ letter, isTarget });
    }
    rows.push(row);
  }

  return {
    index: sectionIndex,
    rows,
    targetCount: BURDON_CONFIG.totalTargetsPerSection,
  };
}

// Sabit seedlerle 3 bölüm — tüm öğrenciler aynı yaprağı görür
// (orijinal "sabit yaprak" mantığına sadık)
const FIXED_SEEDS = [0x12345678, 0x23456789, 0x3456789a];

export function generateBurdonTest(): BurdonSection[] {
  return [
    generateSection(0, FIXED_SEEDS[0]),
    generateSection(1, FIXED_SEEDS[1]),
    generateSection(2, FIXED_SEEDS[2]),
  ];
}

// Deneme için kısa (2 satır) bölüm — ayrı seed
export function generateBurdonPractice(): BurdonSection {
  const rng = new SeededRandom(0x99999999);
  const practiceLetterCount = BURDON_CONFIG.practiceSectionRows * BURDON_CONFIG.lettersPerRow;
  // Deneme yaprağında orijinal dağılımı küçültüp uygula (oranlar korunsun)
  // 80 harf için: ~30(a) + 15(g) + 10(b) + 5(d) = 60 hedef, 20 dolgu kalır (scale factor 0.2)
  const scale = practiceLetterCount / BURDON_CONFIG.totalLettersPerSection;
  const practiceTargets = {
    a: Math.round(BURDON_CONFIG.targetDistribution.a * scale),
    g: Math.round(BURDON_CONFIG.targetDistribution.g * scale),
    b: Math.round(BURDON_CONFIG.targetDistribution.b * scale),
    d: Math.round(BURDON_CONFIG.targetDistribution.d * scale),
  };
  const pool = buildLetterPool(practiceTargets, practiceLetterCount);
  const shuffled = rng.shuffle(pool);

  const rows: BurdonCell[][] = [];
  for (let r = 0; r < BURDON_CONFIG.practiceSectionRows; r++) {
    const row: BurdonCell[] = [];
    for (let c = 0; c < BURDON_CONFIG.lettersPerRow; c++) {
      const letter = shuffled[r * BURDON_CONFIG.lettersPerRow + c];
      const isTarget = (BURDON_TARGETS as readonly string[]).includes(letter);
      row.push({ letter, isTarget });
    }
    rows.push(row);
  }

  return {
    index: -1,
    rows,
    targetCount: Object.values(practiceTargets).reduce((a, b) => a + b, 0),
  };
}

// ============================================================
// SKORLAMA
// ============================================================

function scoreRow(row: BurdonCell[], markedIndices: Set<number>, rowIdx: number): BurdonRowScore {
  let correct = 0;
  let omission = 0;
  let commission = 0;
  let targetCount = 0;

  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    const isMarked = markedIndices.has(i);
    if (cell.isTarget) {
      targetCount++;
      if (isMarked) correct++;
      else omission++;
    } else {
      if (isMarked) commission++;
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

  // Accuracy: E2 hariç doğruluk (doğru / toplam hedef)
  const accuracy = totalT > 0 ? (totalC / totalT) * 100 : 0;

  // Sustained attention: ilk yarı vs son yarı C oranı (10 satır)
  const firstHalfC = rowScores.slice(0, 10).reduce((a, r) => a + r.correct, 0);
  const secondHalfC = rowScores.slice(10, 20).reduce((a, r) => a + r.correct, 0);
  const avgHalf = (firstHalfC + secondHalfC) / 2;
  const variance = Math.abs(firstHalfC - secondHalfC);
  // Düşük varyans = yüksek sürdürülebilirlik
  const sustainedAttention = avgHalf > 0
    ? Math.max(0, 100 - (variance / avgHalf) * 100)
    : 0;

  // Raw score: C - E2 (yanlış işaretleme cezası)
  const rawScore = Math.max(0, totalC - totalE2);

  // Normalized score (0-100): (C - E2) / toplam hedef
  const normalizedScore = totalT > 0 ? Math.max(0, Math.min(100, (rawScore / totalT) * 100)) : 0;

  return {
    section: section.index,
    rowScores,
    totalCorrect: totalC,
    totalOmission: totalE1,
    totalCommission: totalE2,
    totalTargets: totalT,
    reachedRow: response.reachedRow,
    accuracy: Math.round(accuracy * 10) / 10,
    sustainedAttention: Math.round(sustainedAttention * 10) / 10,
    rawScore,
    normalizedScore: Math.round(normalizedScore * 10) / 10,
  };
}

// ── Profil Tespiti (Orijinal Bourdon Kriterleri) ────────
function detectProfile(sections: BurdonSectionScore[]): BurdonProfile {
  // Tüm satır hatalarını (E1 + E2) bir araya topla — 60 satır
  const allErrors: number[] = [];
  for (const s of sections) {
    for (const rs of s.rowScores) {
      allErrors.push(rs.omission + rs.commission);
    }
  }

  const totalCorrect = sections.reduce((a, s) => a + s.totalCorrect, 0);
  const totalTargets = sections.reduce((a, s) => a + s.totalTargets, 0);
  const overallAccuracy = totalTargets > 0 ? (totalCorrect / totalTargets) : 0;

  // Profil 3: Dikkat Zayıflığı — genel doğruluk %40'ın altında
  if (overallAccuracy < 0.4) {
    return 'dikkat-zayifligi';
  }

  const firstThird = allErrors.slice(0, 20).reduce((a, b) => a + b, 0);
  const lastThird = allErrors.slice(40, 60).reduce((a, b) => a + b, 0);

  // Profil 1: Dikkati Çabuk Dağılan — son kısımda hatalar belirgin artmış
  if (lastThird >= firstThird * 1.5 && (lastThird - firstThird) >= 10) {
    return 'dikkat-dagilimi';
  }

  // Profil 2: Uyum Güçlüğü — ilk kısımda hata çok, sonra azalmış
  if (firstThird >= lastThird * 1.5 && (firstThird - lastThird) >= 10) {
    return 'uyum-guclugu';
  }

  // Profil 4: Dengeli
  return 'dengeli';
}

export function calculateBurdon(
  test: BurdonSection[],
  responses: BurdonSectionResponse[]
): BurdonOverallScore {
  const sectionScores: BurdonSectionScore[] = [];
  for (const section of test) {
    const resp = responses.find(r => r.section === section.index);
    if (!resp) {
      // Bölüm yapılmamışsa boş skor
      sectionScores.push({
        section: section.index,
        rowScores: section.rows.map((_, r) => ({ row: r, correct: 0, omission: 0, commission: 0, targetCount: 0 })),
        totalCorrect: 0,
        totalOmission: section.targetCount,
        totalCommission: 0,
        totalTargets: section.targetCount,
        reachedRow: 0,
        accuracy: 0,
        sustainedAttention: 0,
        rawScore: 0,
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

  // Attention persistence: bölümler arası normalizedScore varyansı
  const scores = sectionScores.map(s => s.normalizedScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  // Düşük stdDev = yüksek persistence (dayanıklılık)
  const attentionPersistence = Math.max(0, 100 - stdDev * 2);

  // Kompozit overall score: doğruluk (0.5) + dayanıklılık (0.3) + sürdürülebilirlik (0.2)
  const avgSustained = sectionScores.reduce((a, s) => a + s.sustainedAttention, 0) / sectionScores.length;
  const overallScore =
    overallAccuracy * 0.5 +
    attentionPersistence * 0.3 +
    avgSustained * 0.2;

  const profile = detectProfile(sectionScores);

  // Dikkat eğrisi (60 satır) — her satırdaki doğruluk oranı
  const attentionCurve: number[] = [];
  for (const s of sectionScores) {
    for (const rs of s.rowScores) {
      const rowAccuracy = rs.targetCount > 0
        ? Math.max(0, (rs.correct - rs.commission) / rs.targetCount) * 100
        : 0;
      attentionCurve.push(Math.round(rowAccuracy * 10) / 10);
    }
  }

  return {
    sections: sectionScores,
    totalCorrect: totalC,
    totalOmission: totalE1,
    totalCommission: totalE2,
    totalTargets: totalT,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    attentionPersistence: Math.round(attentionPersistence * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10,
    profile,
    profileLabel: PROFILE_DEFS[profile].label,
    profileDescription: PROFILE_DEFS[profile].description,
    attentionCurve,
  };
}

// ============================================================
// SÜRE HESAPLAMA (Sınıfa Göre Otomatik)
// ============================================================
export function getBurdonTimePerSection(studentGrade: number | null | undefined): number {
  // Lise: 9, 10, 11, 12. sınıf → 2 dk
  // Ortaokul: 5, 6, 7, 8. sınıf → 3 dk
  // Belirsizse ortaokul varsayılır (daha uzun süre, güvende tarafta)
  if (!studentGrade) return BURDON_CONFIG.timeSecondsOrtaokul;
  if (studentGrade >= 9 && studentGrade <= 12) return BURDON_CONFIG.timeSecondsLise;
  return BURDON_CONFIG.timeSecondsOrtaokul;
}

// ============================================================
// RAPOR METNİ ÜRETİMİ (Prompt'a gidecek skor verisi)
// ============================================================
export function generateBurdonReport(score: BurdonOverallScore): Record<string, unknown> {
  return {
    toplam_dogru: score.totalCorrect,
    toplam_ihmal_hatasi: score.totalOmission,  // E1
    toplam_yanlis_isaret: score.totalCommission,  // E2
    toplam_hedef: score.totalTargets,
    genel_dogruluk_yuzdesi: score.overallAccuracy,
    dikkat_dayanikliligi: score.attentionPersistence,
    genel_puan: score.overallScore,
    profil: score.profile,
    profil_etiketi: score.profileLabel,
    profil_aciklama: score.profileDescription,
    bolumler: score.sections.map(s => ({
      bolum: s.section + 1,
      dogru: s.totalCorrect,
      ihmal_hatasi: s.totalOmission,
      yanlis_isaret: s.totalCommission,
      dogruluk_yuzdesi: s.accuracy,
      ulasilan_satir: s.reachedRow + 1,
      bolum_puani: s.normalizedScore,
    })),
    dikkat_egrisi: score.attentionCurve,  // 60 değer — grafik için
  };
}
