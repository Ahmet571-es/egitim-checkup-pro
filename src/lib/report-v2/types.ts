// ============================================================
// Rapor v2 — Veri Modeli
// ============================================================
// Yeni "Bütünsel Değerlendirme Raporu" formatının yapılandırılmış modeli.
// Rapor bir kez bu modele göre kurulur; ekran (React), PDF (pdfmake) ve
// Word (docx) çiziciler aynı modeli okur. Böylece üç çıktı birebir aynı
// içeriği gösterir.

/** 1 = Düşük … 5 = Yüksek (beş kademe). */
export type Level = 1 | 2 | 3 | 4 | 5;

/** Rapor içi bölüm hedef kitlesi (sayfa şeridi rengi ve üst bilgi etiketi). */
export type Audience = 'general' | 'student' | 'family' | 'expert';

export interface LevelRow {
  label: string;
  level: Level;
  /** Ham yüzde (grafiklerde kullanılır; metinde gösterilmez). */
  pct?: number;
}

// ── Grafikler ───────────────────────────────────────────────

export interface ChartPoint {
  label: string;
  value: number; // 0-100
}

export type ChartSpec =
  | { kind: 'radar'; color: string; points: ChartPoint[]; title?: string }
  | { kind: 'columns3d'; color: string; points: ChartPoint[]; title?: string; highlightTop?: number }
  | { kind: 'hbars3d'; color: string; points: ChartPoint[]; title?: string; reverse?: boolean }
  | { kind: 'ring'; color: string; points: ChartPoint[]; title?: string; centerLabel?: string; centerValue?: string }
  | { kind: 'gauge'; color: string; value: number; label: string; title?: string; zones?: { from: number; to: number; label: string }[]; invert?: boolean }
  | { kind: 'enneagram'; color: string; values: number[]; main: number; wing?: number; title?: string }
  | { kind: 'hexagon'; color: string; values: { key: string; label: string; value: number }[]; title?: string }
  | { kind: 'line'; color: string; points: ChartPoint[]; title?: string; yLabel?: string }
  | { kind: 'balance'; color: string; left: { label: string; value: number }; right: { label: string; value: number }; title?: string }
  | { kind: 'speedo'; color: string; value: number; max: number; unit: string; marks: { at: number; label: string }[]; title?: string; secondary?: { label: string; value: number } };

// ── Bloklar ─────────────────────────────────────────────────

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h3'; num?: string; text: string }
  | { t: 'bullets'; items: string[] }
  | { t: 'callout'; tone: 'key' | 'note' | 'warn'; title?: string; text: string }
  | { t: 'lead'; text: string }
  | {
      t: 'twoCol';
      left: { title: string; items: string[] };
      right: { title: string; items: string[] };
      tone?: 'strengths' | 'doDont';
    }
  | { t: 'priority'; title: string; text: string }
  | {
      t: 'testResult';
      testId: string;
      name: string;
      color: string;
      description: string;
      headline?: string;
      levels: LevelRow[];
      chart?: ChartSpec;
      paragraphs: string[];
      note?: string;
    }
  | { t: 'dialog'; leftTitle: string; rightTitle: string; pairs: { instead: string; tryThis: string }[] }
  | { t: 'plan'; rows: { period: string; title: string; text: string }[] }
  | { t: 'table'; head: [string, string]; rows: [string, string][] }
  | { t: 'chart'; chart: ChartSpec; caption?: string };

export interface Section {
  id: 'about' | 'summary' | 'results' | 'holistic' | 'student' | 'family' | 'expert' | 'closing';
  /** Bölüm üstündeki küçük büyük harfli etiket (ör. "BAŞLARKEN"). */
  kicker: string;
  title: string;
  audience: Audience;
  blocks: Block[];
  /** Bölüm yeni sayfadan başlasın mı. */
  newPage?: boolean;
}

export interface ReportStudent {
  fullName: string;
  firstName: string;
  grade?: number | null;
  age?: number | null;
  school?: string | null;
  target?: string | null;
}

export interface AppliedTest {
  testId: string;
  name: string;
  color: string;
}

export interface ReportV2 {
  v: 2;
  kind: 'package' | 'single';
  /** Paket kimliği (paket raporu) ya da test kimliği (tek test raporu). */
  sourceId: string;
  /** Kapak başlığı: "Potansiyel & Mizaç Paketi" / "Enneagram Kişilik Testi". */
  title: string;
  /** Kapak alt başlığı: "Bütünsel Değerlendirme Raporu". */
  subtitle: string;
  /** Sayfa üst bilgisinde adın yanında yazan kısa ad. */
  shortTitle: string;
  /** Kapak bandı ve genel vurgu rengi. */
  accent: string;
  student: ReportStudent;
  dateLabel: string;
  generatedAt: string;
  tests: AppliedTest[];
  /** Kapaktaki içindekiler listesi (bölüm başlıkları). */
  toc: string[];
  sections: Section[];
  /** Son sayfanın altındaki küçük yasal not. */
  footerNote: string;
}
