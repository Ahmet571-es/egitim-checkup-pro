/**
 * Ortak deterministik rapor yardımcıları (API'SIZ rapor motorları için).
 *
 * Tüm test raporları (Çoklu Zekâ, VARK, Holland, Enneagram, ...) bu modülü
 * kullanarak TUTARLI ve RENKLİ görsel bloklar üretir. Bloklar
 * (_infographic-instructions.ts sözdizimi) web/PDF/DOCX render yollarınca parse edilir.
 *
 * Ton kuralı: yalın, tavsiye edici (emir kipi yok), puan referanslı, olasılıksal.
 */

export type StatTheme = 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type InsightType = 'strength' | 'risk' | 'action' | 'note';

/** Yüzdeyi 0-100 aralığına kırpar (bozuk veriye karşı savunma). */
export function clampPct(pct: number): number {
  const p = Number.isFinite(pct) ? pct : 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/** █░ metin çubuğu (0-100). */
export function bar(pct: number): string {
  const n = Math.max(0, Math.min(10, Math.round(clampPct(pct) / 10)));
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

// ── Grafik blok emitter'ları ─────────────────────────────
export interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  theme?: StatTheme;
  icon?: string;
}

function statLine(s: StatItem): string {
  const parts = [`label="${s.label}"`, `value="${s.value}"`];
  if (s.unit) parts.push(`unit="${s.unit}"`);
  if (s.theme) parts.push(`theme="${s.theme}"`);
  if (s.icon) parts.push(`icon="${s.icon}"`);
  return `[!stat ${parts.join(' ')}]`;
}

/** Tek stat kartı. */
export function stat(s: StatItem): string {
  return statLine(s) + '\n';
}

/** 2-4 stat kartını renkli ızgarada (giriş özeti için ideal). */
export function statGrid(items: StatItem[], cols: 2 | 3 | 4 = 3): string {
  return `[!grid cols="${cols}"]\n` + items.map(statLine).join('\n') + `\n[/!grid]\n`;
}

/** Skor halkası. */
export function ring(label: string, value: number, max = 100, caption?: string): string {
  const cap = caption ? ` caption="${caption}"` : '';
  return `[!ring label="${label}" value="${clampPct(value)}" max="${max}"${cap}]\n`;
}

/** Renkli kuşaklı akrep göstergesi. zones: "Etiket:0-40,Etiket:40-70,..." */
export function gauge(label: string, value: number, opts?: { max?: number; zones?: string; caption?: string }): string {
  const max = opts?.max ?? 100;
  const z = opts?.zones ? ` zones="${opts.zones}"` : '';
  const cap = opts?.caption ? ` caption="${opts.caption}"` : '';
  return `[!gauge label="${label}" value="${Math.round(value)}" max="${max}"${z}${cap}]\n`;
}

/** Yatay çubuk grafik. items: [etiket, değer][] */
export function barsBlock(title: string, items: [string, number][]): string {
  return `[!bars title="${title}"]\n` + items.map(([l, v]) => `${l}: ${clampPct(v)}`).join('\n') + `\n[/!bars]\n`;
}

/** Radar / örümcek grafik (3-8 boyut; MI/VARK/Holland için bars'tan iyi). */
export function radarBlock(title: string, items: [string, number][]): string {
  return `[!radar title="${title}"]\n` + items.map(([l, v]) => `${l}: ${clampPct(v)}`).join('\n') + `\n[/!radar]\n`;
}

/** Vurgulu içgörü kartı (strength/risk/action/note). */
export function insight(type: InsightType, title: string, body: string): string {
  return `[!insight type="${type}" title="${title}"]\n${body}\n[/!insight]\n`;
}

// ── Ortak bölümler ───────────────────────────────────────
export interface StudentInfo {
  studentName: string;
  studentAge?: number | string | null;
  studentGrade?: number | string | null;
  studentGender?: string | null;
}

/** Rapor başlığı + öğrenci dosyası tablosu. */
export function reportHeader(title: string, evaluation: string, student: StudentInfo): string {
  const name = (student.studentName || 'Öğrenci').trim();
  const grade = student.studentGrade ? `${student.studentGrade}. Sınıf` : 'Belirtilmemiş';
  const age = student.studentAge && student.studentAge !== '—' ? `${student.studentAge}` : 'Belirtilmemiş';
  return (
    `# ${title}\n\n` +
    `| Alan | Bilgi |\n|---|---|\n` +
    `| İsim | ${name} |\n| Yaş | ${age} |\n| Sınıf | ${grade} |\n| Değerlendirme | ${evaluation} |\n`
  );
}

/** Standart footer. */
export function reportFooter(): string {
  return `\n---\n*Bu rapor, EĞİTİM CHECK UP Pro deterministik analiz motoru tarafından, öğrencinin puan profiline göre üretilmiştir. Klinik tanı içermez.*`;
}

/** İki ondalık dilde güvenli isim (öğrenci adı boşsa "Öğrenci"). */
export function safeName(student: StudentInfo): string {
  return (student.studentName || 'Öğrenci').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// FAZ 0 — Derinleştirilmiş rapor blokları (üreteçler)
// ═══════════════════════════════════════════════════════════════════════════

/** Öğrenciyi bir referansla kıyaslar. items: [etiket, öğrenci, referans] */
export function compareBlock(
  title: string,
  items: [string, number, number][],
  opts?: { selfLabel?: string; refLabel?: string },
): string {
  const head = `[!compare title="${title}" self="${opts?.selfLabel ?? 'Öğrenci'}" ref="${opts?.refLabel ?? 'Yaş grubu ortalaması'}"]`;
  const body = items.map(([l, s, r]) => `${l}: ${clampPct(s)} | ${clampPct(r)}`).join('\n');
  return `${head}\n${body}\n[/!compare]\n`;
}

/** Neden → Etki → Sonuç zinciri. */
export function chainBlock(title: string, links: [string, string, string][]): string {
  const body = links.map(([c, e, r]) => `${c} :: ${e} :: ${r}`).join('\n');
  return `[!chain title="${title}"]\n${body}\n[/!chain]\n`;
}

/** Sıralı yol haritası. steps: [başlık, açıklama?, etiket?] */
export function timelineBlock(title: string, steps: [string, string?, string?][]): string {
  const body = steps
    .map(([t, d, g]) => [t, d ?? '', g ?? ''].join(' :: ').replace(/(\s*::\s*)+$/, ''))
    .join('\n');
  return `[!timeline title="${title}"]\n${body}\n[/!timeline]\n`;
}

/** İki eksende konumlandırma. quadrants: [sol-alt, sağ-alt, sol-üst, sağ-üst] */
export function quadrantBlock(
  title: string,
  x: number, y: number,
  xLabel: string, yLabel: string,
  quadrants: [string, string, string, string],
  caption?: string,
): string {
  const q = quadrants.join('|');
  const cap = caption ? ` caption="${caption}"` : '';
  return `[!quadrant title="${title}" x="${clampPct(x)}" y="${clampPct(y)}" xlabel="${xLabel}" ylabel="${yLabel}" quadrants="${q}"${cap}]\n`;
}

/** Parça-bütün halka grafiği. */
export function donutBlock(title: string, items: [string, number][], centerLabel?: string): string {
  const center = centerLabel ? ` center="${centerLabel}"` : '';
  const body = items.filter(([, v]) => v > 0).map(([l, v]) => `${l}: ${v}`).join('\n');
  return `[!donut title="${title}"${center}]\n${body}\n[/!donut]\n`;
}

/** Satır × sütun yoğunluk matrisi. */
export function heatmapBlock(
  title: string,
  cols: string[],
  rows: [string, number[]][],
  caption?: string,
): string {
  const cap = caption ? ` caption="${caption}"` : '';
  const body = rows.map(([l, vs]) => `${l}: ${vs.map((v) => clampPct(v)).join(',')}`).join('\n');
  return `[!heatmap title="${title}" cols="${cols.join(',')}"${cap}]\n${body}\n[/!heatmap]\n`;
}
