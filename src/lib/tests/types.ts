// ============================================================
// Ortak Test Tipleri — Eğitim Check-Up Pro
// ============================================================

export type AnswerValue = string | number | string[];

export interface TestQuestion {
  id: string | number;
  text: string;
  type: 'likert' | 'mc' | 'binary' | 'multiselect';
  options?: Record<string, string>;
  category?: string;
}

export interface LikertQuestion {
  id: string | number;
  text: string;
}

export interface MCQuestion {
  id: string;
  text: string;
  options: Record<string, string>;
  answer: string;
  difficulty?: 'kolay' | 'orta' | 'zor';
  skill?: string;
  passage?: string;
}

export interface BinaryQuestion {
  id: string | number;
  text: string;
  options?: { a: string; b: string };
}

// ── Genel Skor Sonuç Tipi ──────────────────────────────────
export interface TestScores {
  [key: string]: unknown;
}

// ── Test Motor Arayüzü ─────────────────────────────────────
export interface TestEngine<TScores extends TestScores = TestScores> {
  testId: string;
  calculate(answers: Record<string | number, AnswerValue>): TScores;
  generateReport(scores: TScores): string;
}

// ── Test Registry Tipi ────────────────────────────────────
export type TestLevel = 'ilkogretim' | 'lise' | 'hepsi';
export type TestCategory =
  | 'kisilik'
  | 'ogrenme'
  | 'kariyer'
  | 'dikkat'
  | 'akademik'
  | 'psikolojik';

export interface RegisteredTest {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  category: TestCategory;
  level: TestLevel;
  estimatedMinutes: number;
  questionCount: number;
  tags: string[];
}

// ── D2 Dikkat Testi Tipleri ───────────────────────────────
export interface D2Symbol {
  index: number;
  letter: 'd' | 'p';
  above: number; // 0-2 çizgi
  below: number; // 0-2 çizgi
  total: number; // toplam çizgi
  isTarget: boolean; // 'd' && total === 2
}

export interface D2RowResult {
  symbols: D2Symbol[];
  selected: boolean[];
  elapsedTime: number;
}

export interface D2Scores {
  TN: number;
  E1: number;
  E2: number;
  E: number;
  TN_E: number;
  CP: number;
  FR: number;
  cpPct: number;
  hitRate: number;
  errorPct: number;
  level: string;
  levelDesc: string;
  balance: string;
  balanceDesc: string;
  consistency: string;
  consistencyDesc: string;
  rowPerformances: number[];
  rowDetails: D2RowDetail[];
  totalTargets: number;
  totalCorrect: number;
  timePerRow: number;
}

export interface D2RowDetail {
  rowNum: number;
  totalSymbols: number;
  targetsInRow: number;
  correct: number;
  missed: number;
  wrong: number;
  blank: number;
  cp: number;
  tn: number;
  elapsed: number;
  missedIndices: number[];
  wrongIndices: number[];
  correctIndices: number[];
  symbols: D2Symbol[];
  selected: boolean[];
}

// ── Hızlı Okuma Tipleri ───────────────────────────────────
export type Kademe = 'kademe_1' | 'kademe_2' | 'kademe_3' | 'kademe_4';

export interface ReadingPassage {
  id: string;
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  text: string;
  options: Record<string, string>;
  answer: string;
}

export interface SpeedReadingScores {
  passageTitle: string;
  wordCount: number;
  readingTimeSeconds: number;
  readingTimeMinutes: number;
  wpm: number;
  speedKey: string;
  speedLabel: string;
  speedEmoji: string;
  speedComment: string;
  kademe: Kademe;
  kademLabel: string;
  correct: number;
  total: number;
  comprehensionPct: number;
  compLevel: string;
  compEmoji: string;
  effectiveScore: number;
  effLevel: string;
  effEmoji: string;
  profile: string;
  profileDesc: string;
  detail: QuestionDetail[];
}

export interface QuestionDetail {
  id: string;
  text: string;
  user: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// ── Enneagram Tipleri ─────────────────────────────────────
export interface EnneagramScores {
  scores: Record<number, number>;
  normalized: Record<number, number>;
  mainType: number;
  mainScore: number;
  wingType: number;
  fullTypeStr: string;
  sortedScores: [number, number][];
}

// ── VARK Tipleri ──────────────────────────────────────────
export interface VarkScores {
  counts: Record<string, number>;
  percentages: Record<string, number>;
  totalResponses: number;
  sorted: [string, number][];
  dominant: [string, number];
  isMultimodal: boolean;
}

// ── Holland Tipleri ───────────────────────────────────────
export interface HollandScores {
  R: number; I: number; A: number;
  S: number; E: number; C: number;
  hollandCode: string;
  sortedTypes: [string, number][];
  top3: [string, number][];
}

// ── Çoklu Zekâ Tipleri ───────────────────────────────────
export interface ZekaScore {
  raw: number;
  max: number;
  pct: number;
}

export interface CokluZekaScores {
  version: 'lise' | 'ilkogretim';
  scores: Record<string, ZekaScore>;
  scoresNamed: Record<string, number>;
  top3: [string, ZekaScore][];
  bottom2: [string, ZekaScore][];
  profile: { type: string; name: string; description: string };
  synergies: { name: string; detail: string }[];
}

// ── Sınav Kaygısı Tipleri ─────────────────────────────────
export interface SinavKaygisiScores {
  categories: Record<string, number>;
  categoriesNamed: Record<string, number>;
  total: number;
  maxTotal: number;
  totalPct: number;
  overallLevel: string;
  levelEmoji: string;
  dominantType: string;
  dominantInfo: {
    name: string;
    icon: string;
    description: string;
    strategy: string;
  };
  typeScores: Record<string, number>;
}

// ── Çalışma Davranışı Tipleri ─────────────────────────────
export interface CalismaDavranisiScores {
  categories: Record<string, number>;
  categoriesPositive: Record<string, number>;
  categoriesNamed: Record<string, number>;
  total: number;
  totalPositive: number;
  maxTotal: number;
  positivePct: number;
  level: string;
  levelEmoji: string;
  combinations: CalismaCombination[];
}

export interface CalismaCombination {
  type: string;
  title: string;
  detail: string;
  tip: string;
}

// ── Akademik Analiz Tipleri ───────────────────────────────
export interface AkademikScores {
  version: string;
  kademe: string;
  kademLabel: string;
  grade: number | null;
  sections: Record<string, AkademikSectionResult>;
  performanceAvg: number;
  selfAssessment: number;
  overall: number;
  level: string;
  levelEmoji: string;
  levelDesc: string;
  strongest: { name: string; pct: number };
  weakest: { name: string; pct: number };
  gap: number;
  gapType: string;
  gapDesc: string;
}

export interface AkademikSectionResult {
  correct?: number;
  total?: number;
  pct: number;
  weightedScore?: number;
  weightedMax?: number;
  score?: number;
  max?: number;
  count?: number;
  difficultyBreakdown?: Record<string, { correct: number; total: number; pct: number }>;
  skillBreakdown?: Record<string, { correct: number; total: number; pct: number }>;
}

// ── Sağ-Sol Beyin Tipleri ─────────────────────────────────
export interface SagSolBeyinScores {
  sagBeyin: number;
  solBeyin: number;
  sagYuzde: number;
  solYuzde: number;
  dominant: 'sag' | 'sol' | 'dengeli';
  level: string;
}
