// ============================================================
// Rapor v2 — Saklama biçimi
// ============================================================
// Raporlar veritabanında mevcut metin sütunlarına (test_results.ai_report,
// holistic_reports.report_text) yazılır; şema değişikliği gerekmez.
//
// Biçim:   <okunur düz metin (markdown)>\n\n<!--ECR2:<base64 JSON>-->
//
// • Yeni çiziciler sondaki yapılandırılmış veriyi okur ve yeni tasarımı çizer.
// • Eski ekranlar (ör. veli önizlemesi, Excel dışa aktarımı) baştaki düz
//   metni gösterir; böylece hiçbir ekran bozuk görünmez.

import type { Block, ReportV2 } from './types';

const OPEN = '<!--ECR2:';
const CLOSE = '-->';

function toBase64(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf-8').toString('base64');
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf-8');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const strip = (s: string) => s.replace(/\*\*/g, '');

function blockToMd(b: Block): string {
  switch (b.t) {
    case 'p':
    case 'lead':
      return strip(b.text);
    case 'h3':
      return `### ${b.num ? `${b.num} ` : ''}${b.text}`;
    case 'bullets':
      return b.items.map((x) => `- ${strip(x)}`).join('\n');
    case 'callout':
      return `> ${b.title ? `${b.title}: ` : ''}${strip(b.text)}`;
    case 'priority':
      return `> ${b.title}: ${strip(b.text)}`;
    case 'twoCol':
      return [`**${b.left.title}**`, ...b.left.items.map((x) => `- ${strip(x)}`), '', `**${b.right.title}**`, ...b.right.items.map((x) => `- ${strip(x)}`)].join('\n');
    case 'testResult':
      return [
        `### ${b.name}`,
        b.description,
        b.headline ? strip(b.headline) : '',
        ...b.levels.map((l) => `- ${l.label}: ${['', 'Düşük', 'Orta altı', 'Orta', 'Orta üstü', 'Yüksek'][l.level]}`),
        ...b.paragraphs.map(strip),
        b.note ?? '',
      ]
        .filter(Boolean)
        .join('\n\n');
    case 'dialog':
      return b.pairs.map((p) => `- Bunun yerine: "${p.instead}" → Şunu deneyin: "${p.tryThis}"`).join('\n');
    case 'plan':
      return b.rows.map((r) => `- ${r.period} (${r.title}): ${strip(r.text)}`).join('\n');
    case 'table':
      return b.rows.map(([a, c]) => `- ${strip(a)}: ${strip(c)}`).join('\n');
    case 'chart':
      return b.caption ? `_${b.caption}_` : '';
    default:
      return '';
  }
}

/** Raporun okunur düz metin hâli (eski ekranlar ve önizlemeler için). */
export function reportV2ToMarkdown(r: ReportV2): string {
  const out: string[] = [];
  out.push(`# ${r.title} — ${r.subtitle}`);
  out.push(`**Öğrenci:** ${r.student.fullName}${r.student.grade ? ` · ${r.student.grade}. sınıf` : ''} · **Tarih:** ${r.dateLabel}`);
  out.push(`**Uygulanan değerlendirmeler:** ${r.tests.map((t) => t.name).join(', ')}`);
  for (const s of r.sections) {
    out.push(`## ${s.title}`);
    for (const b of s.blocks) {
      const md = blockToMd(b);
      if (md) out.push(md);
    }
  }
  out.push(`---\n${r.footerNote}`);
  return out.join('\n\n');
}

/** Raporu veritabanına yazılacak metne çevirir. */
export function encodeReportV2(r: ReportV2): string {
  return `${reportV2ToMarkdown(r)}\n\n${OPEN}${toBase64(JSON.stringify(r))}${CLOSE}`;
}

/** Metin v2 raporu taşıyor mu (hızlı kontrol). */
export function isReportV2Text(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.includes(OPEN);
}

/** Saklanan metinden v2 raporu çıkarır; değilse null. */
export function decodeReportV2(text: string | null | undefined): ReportV2 | null {
  if (!text || typeof text !== 'string') return null;
  const i = text.lastIndexOf(OPEN);
  if (i < 0) return null;
  const j = text.indexOf(CLOSE, i + OPEN.length);
  if (j < 0) return null;
  try {
    const obj = JSON.parse(fromBase64(text.slice(i + OPEN.length, j).trim())) as ReportV2;
    return obj && obj.v === 2 && Array.isArray(obj.sections) ? obj : null;
  } catch {
    return null;
  }
}

/** Saklanan metnin yalnızca okunur kısmı (önizleme için). */
export function stripReportV2Payload(text: string): string {
  const i = text.lastIndexOf(OPEN);
  return i < 0 ? text : text.slice(0, i).trimEnd();
}

/** Kısa önizleme metni: v2 raporda "Kısaca" kutusu, eski raporda baştaki metin. */
export function reportPreviewText(text: string | null | undefined, max = 400): string {
  if (!text) return '';
  const r = decodeReportV2(text);
  if (r) {
    const summary = r.sections.find((s) => s.id === 'summary');
    const lead = summary?.blocks.find((b) => b.t === 'lead');
    if (lead && lead.t === 'lead') return lead.text.replace(/\*\*/g, '').slice(0, max);
    return stripReportV2Payload(text).slice(0, max);
  }
  return text.slice(0, max);
}
