/**
 * Rapor v2 — PDF çizici (pdfmake)
 *
 * Örnek raporlardaki tasarımı uygular: lacivert kapak bandı, serif başlıklar,
 * bölüm etiketleri, hedef kitle bölümlerinde sayfa kenarı renk şeridi,
 * renkli kutular, 5 kademeli seviye çubukları ve 3D görünümlü SVG grafikler.
 * Fontlar: DejaVu Sans (metin) + DejaVu Serif (başlıklar) — Türkçe karakterler tam.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const PdfPrinter = require('pdfmake/js/Printer').default;
const URLResolver = require('pdfmake/js/URLResolver').default;
const virtualFs = require('pdfmake/js/virtual-fs').default;
/* eslint-enable @typescript-eslint/no-require-imports */

import path from 'path';
import fs from 'fs';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Audience, Block, LevelRow, ReportV2, Section } from '@/lib/report-v2/types';
import { renderChartSvg, svgSize } from '@/lib/report-v2/charts';
import { tint, shade } from '@/lib/tests/colors';

// ── Fontlar ──────────────────────────────────────────────────

function fontDir(): string {
  const candidates = [
    path.join(process.cwd(), 'src', 'lib', 'export', 'fonts'),
    path.join(__dirname, 'fonts'),
    path.join(__dirname, '..', 'fonts'),
  ];
  for (const d of candidates) {
    try {
      if (fs.existsSync(path.join(d, 'DejaVuSans.ttf'))) return d;
    } catch {
      /* sonraki aday */
    }
  }
  return candidates[0];
}

function makePrinter() {
  const d = fontDir();
  const fonts = {
    DejaVuSans: {
      normal: path.join(d, 'DejaVuSans.ttf'),
      bold: path.join(d, 'DejaVuSans-Bold.ttf'),
      italics: path.join(d, 'DejaVuSans-Oblique.ttf'),
      bolditalics: path.join(d, 'DejaVuSans-BoldOblique.ttf'),
    },
    DejaVuSerif: {
      normal: path.join(d, 'DejaVuSerif.ttf'),
      bold: path.join(d, 'DejaVuSerif-Bold.ttf'),
      italics: path.join(d, 'DejaVuSerif.ttf'),
      bolditalics: path.join(d, 'DejaVuSerif-Bold.ttf'),
    },
  };
  return new PdfPrinter(fonts, virtualFs, new URLResolver(virtualFs));
}

// ── Tasarım belirteçleri ─────────────────────────────────────

const PAGE_W = 595.28;
const MARGIN_X = 54;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const INK = '#1F2937';
const MUTED = '#6B7280';
const RULE = '#D1D5DB';
const GREEN = '#2F7D4F';
const ORANGE = '#B5591F';
const RED = '#B42318';

const AUDIENCE_COLOR: Record<Audience, string> = {
  general: '#245B8F',
  student: '#1F7A7A',
  family: '#B5591F',
  expert: '#4A5568',
};
const AUDIENCE_LABEL: Record<Audience, string> = {
  general: '',
  student: 'ÖĞRENCİ İÇİN',
  family: 'AİLE İÇİN',
  expert: 'UZMAN İÇİN',
};

// ── Satır içi **kalın** ──────────────────────────────────────

function runs(text: string): { text: string; bold?: boolean }[] {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) => (p.startsWith('**') && p.endsWith('**') ? { text: p.slice(2, -2), bold: true } : { text: p }));
}

function rich(text: string, base: Record<string, unknown> = {}): Content {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (parts.length <= 1 && !/\*\*/.test(text)) return { text, ...base } as Content;
  return {
    text: parts.map((p) => (p.startsWith('**') && p.endsWith('**') ? { text: p.slice(2, -2), bold: true } : { text: p })),
    ...base,
  } as Content;
}

// ── Bloklar ──────────────────────────────────────────────────

function sectionHead(s: Section, accent: string): Content[] {
  return [
    { text: s.kicker, fontSize: 7.5, bold: true, color: accent, characterSpacing: 0.6, margin: [0, 0, 0, 6] },
    { text: s.title, font: 'DejaVuSerif', bold: true, fontSize: 18, color: '#111827', margin: [0, 0, 0, 4] },
    { canvas: [{ type: 'rect', x: 0, y: 0, w: 38, h: 2.6, color: accent }], margin: [0, 2, 0, 14] },
  ] as Content[];
}

function levelBar(level: number, color: string): Content {
  const seg = 17;
  const gap = 3;
  return {
    canvas: Array.from({ length: 5 }, (_, i) => ({ type: 'rect', x: i * (seg + gap), y: 2, w: seg, h: 6.5, r: 1.5, color: i < level ? (i === level - 1 ? shade(color, 0.08) : color) : '#E5E7EB' })),
    width: 5 * seg + 4 * gap,
  } as unknown as Content;
}

const LEVEL_TXT = ['', 'Düşük', 'Orta altı', 'Orta', 'Orta üstü', 'Yüksek'];

function levelsTable(levels: LevelRow[], color: string): Content {
  return {
    table: {
      widths: ['*', 102, 92],
      body: levels.map((l) => [
        { text: l.label, fontSize: 9, color: INK, margin: [0, 3, 0, 3] },
        { ...(levelBar(l.level, color) as object), margin: [0, 4, 0, 0] },
        { text: LEVEL_TXT[l.level], fontSize: 8, color: MUTED, margin: [6, 3, 0, 3] },
      ]),
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 1, paddingBottom: () => 1 },
    margin: [0, 2, 0, 8],
  } as unknown as Content;
}

function chartContent(svg: string, width = 400, caption?: string): Content[] {
  if (!svg) return [];
  const { w, h } = svgSize(svg);
  const out: Content[] = [{ svg, width, height: (width * h) / w, alignment: 'center', margin: [0, 4, 0, caption ? 2 : 10] } as unknown as Content];
  if (caption) out.push({ text: caption, fontSize: 7.5, italics: true, color: MUTED, alignment: 'center', margin: [0, 0, 0, 10] });
  return out;
}

function boxed(content: Content[], fill: string, border?: string, opts: { padding?: number; marginBottom?: number } = {}): Content {
  const pad = opts.padding ?? 10;
  return {
    table: { widths: ['*'], body: [[{ stack: content, fillColor: fill }]] },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i: number) => (border && i === 0 ? 3 : 0),
      vLineColor: () => border ?? fill,
      paddingLeft: () => pad + (border ? 2 : 0),
      paddingRight: () => pad,
      paddingTop: () => pad - 2,
      paddingBottom: () => pad - 2,
    },
    margin: [0, 2, 0, opts.marginBottom ?? 12],
  } as unknown as Content;
}

function bulletList(items: string[], color = INK): Content {
  return {
    ul: items.map((it) => rich(it, { fontSize: 9.5, color, margin: [0, 0, 0, 3] })),
    markerColor: MUTED,
    margin: [2, 0, 0, 8],
  } as unknown as Content;
}

function blockToPdf(b: Block, accent: string, audience: Audience): Content[] {
  const aColor = AUDIENCE_COLOR[audience] === AUDIENCE_COLOR.general ? accent : AUDIENCE_COLOR[audience];
  switch (b.t) {
    case 'p':
      return [rich(b.text, { fontSize: 9.5, lineHeight: 1.32, color: INK, margin: [0, 0, 0, 7] })];
    case 'lead':
      return [boxed([rich(b.text, { font: 'DejaVuSerif', fontSize: 11, lineHeight: 1.35, color: '#1E3A5F' })], tint(accent, 0.9), accent, { padding: 12 })];
    case 'h3':
      return [
        {
          columns: [
            ...(b.num ? [{ text: b.num, width: 26, bold: true, fontSize: 11, color: aColor }] : []),
            { text: b.text, width: '*', bold: true, fontSize: 11, color: '#111827' },
          ],
          margin: [0, 10, 0, 5],
          unbreakable: true,
          headlineLevel: 1,
        } as unknown as Content,
      ];
    case 'bullets':
      return [bulletList(b.items)];
    case 'callout': {
      const color = b.tone === 'warn' ? RED : aColor;
      return [boxed([...(b.title ? [{ text: b.title, bold: true, fontSize: 8.5, color, margin: [0, 0, 0, 3] } as Content] : []), rich(b.text, { fontSize: 9.3, lineHeight: 1.3, color: INK })], tint(color, 0.9), color)];
    }
    case 'priority':
      return [boxed([{ text: b.title, bold: true, fontSize: 7.5, color: '#FFFFFF', characterSpacing: 0.5, margin: [0, 0, 0, 4] } as Content, rich(b.text, { fontSize: 10, lineHeight: 1.35, color: '#FFFFFF' })], shade(accent, 0.05), shade(accent, 0.35), { padding: 12 })];
    case 'twoCol': {
      const dd = b.tone === 'doDont';
      const lc = GREEN;
      const rc = dd ? RED : ORANGE;
      const mark = (items: string[], m: string, col: string) =>
        items.map((x) => ({ text: [{ text: `${m} `, color: col, bold: true }, ...runs(x)], fontSize: 9, lineHeight: 1.28, margin: [0, 0, 0, 4] }));
      return [
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { stack: [{ text: b.left.title, bold: true, fontSize: 9, color: lc, margin: [0, 0, 0, 5] }, ...mark(b.left.items, dd ? '✓' : '•', lc)], fillColor: '#EAF5EE' },
                { stack: [{ text: b.right.title, bold: true, fontSize: 9, color: rc, margin: [0, 0, 0, 5] }, ...mark(b.right.items, dd ? '✕' : '•', rc)], fillColor: dd ? '#FBEAEA' : '#FBEFE6' },
              ],
            ],
          },
          layout: { hLineWidth: () => 0, vLineWidth: (i: number) => (i === 1 ? 2 : 0), vLineColor: () => '#FFFFFF', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 6 },
          margin: [0, 2, 0, 12],
        } as unknown as Content,
      ];
    }
    case 'testResult': {
      const out: Content[] = [];
      out.push({
        table: { widths: [4, '*'], body: [[{ text: '', fillColor: b.color }, { stack: [{ text: b.name, bold: true, fontSize: 12, color: shade(b.color, 0.25) }, { text: b.description, italics: true, fontSize: 8.3, color: MUTED, margin: [0, 2, 0, 0] }], margin: [6, 0, 0, 0] }]] },
        layout: 'noBorders',
        margin: [0, 6, 0, 8],
        unbreakable: true,
        headlineLevel: 2,
      } as unknown as Content);
      if (b.headline) out.push(rich(b.headline, { fontSize: 9.5, bold: true, color: INK, margin: [0, 0, 0, 6] }));
      if (b.levels.length) out.push(levelsTable(b.levels, b.color));
      if (b.chart) {
        const big = b.chart.kind === 'radar' || b.chart.kind === 'enneagram' || b.chart.kind === 'hexagon';
        out.push(...chartContent(renderChartSvg(b.chart), b.chart.kind === 'hbars3d' ? 430 : big ? 320 : 360));
      }
      b.paragraphs.forEach((p) => out.push(rich(p, { fontSize: 9.5, lineHeight: 1.32, color: INK, margin: [0, 0, 0, 7] })));
      if (b.note) out.push({ text: b.note, fontSize: 7.8, italics: true, color: MUTED, margin: [0, 0, 0, 10] });
      out.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.5, lineColor: '#E5E7EB' }], margin: [0, 4, 0, 6] } as unknown as Content);
      return out;
    }
    case 'dialog':
      return [
        {
          table: {
            widths: ['*', '*'],
            headerRows: 1,
            body: [
              [
                { text: b.leftTitle, bold: true, fontSize: 8.5, color: '#FFFFFF', fillColor: aColor },
                { text: b.rightTitle, bold: true, fontSize: 8.5, color: '#FFFFFF', fillColor: aColor },
              ],
              ...b.pairs.map((p) => [
                { text: `“${p.instead}”`, italics: true, fontSize: 9, color: shade(RED, 0.1) },
                { text: `“${p.tryThis}”`, italics: true, fontSize: 9, color: shade(GREEN, 0.1) },
              ]),
            ],
          },
          layout: { hLineWidth: (i: number) => (i <= 1 ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => RULE, paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
          margin: [0, 2, 0, 12],
        } as unknown as Content,
      ];
    case 'plan':
      return [
        {
          table: {
            widths: [110, '*'],
            dontBreakRows: true,
            body: b.rows.map((r) => [
              { stack: [{ text: `${r.period}:`, bold: true, fontSize: 8.8, color: aColor }, { text: r.title, bold: true, fontSize: 8.8, color: aColor }], fillColor: tint(aColor, 0.9) },
              rich(r.text, { fontSize: 9, lineHeight: 1.3, color: INK }),
            ]),
          },
          layout: { hLineWidth: () => 0.6, vLineWidth: () => 0, hLineColor: () => '#FFFFFF', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 7, paddingBottom: () => 7 },
          margin: [0, 2, 0, 12],
        } as unknown as Content,
      ];
    case 'table':
      return [
        {
          table: {
            widths: [140, '*'],
            headerRows: 1,
            dontBreakRows: true,
            body: [
              [
                { text: b.head[0], bold: true, fontSize: 8.5, color: '#FFFFFF', fillColor: aColor },
                { text: b.head[1], bold: true, fontSize: 8.5, color: '#FFFFFF', fillColor: aColor },
              ],
              ...b.rows.map(([x, y], i) => [
                rich(x, { bold: true, fontSize: 8.8, color: INK, fillColor: i % 2 ? '#FFFFFF' : '#F7F8FA' }),
                rich(y, { fontSize: 8.8, color: INK, lineHeight: 1.28, fillColor: i % 2 ? '#FFFFFF' : '#F7F8FA' }),
              ]),
            ],
          },
          layout: { hLineWidth: (i: number) => (i <= 1 ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => '#E5E7EB', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
          margin: [0, 2, 0, 12],
        } as unknown as Content,
      ];
    case 'chart':
      return chartContent(renderChartSvg(b.chart), 380, b.caption);
    default:
      return [];
  }
}

// ── Kapak ────────────────────────────────────────────────────

function coverSection(r: ReportV2): Content {
  const band = 248;
  const s = r.student;
  const info: [string, Content][] = [
    ['Öğrenci', { text: s.fullName, bold: true, fontSize: 11, color: '#111827' }],
  ];
  const gl = [s.grade ? `${s.grade}. sınıf` : '', s.age ? `${s.age} yaş` : ''].filter(Boolean).join(' · ');
  if (gl) info.push(['Sınıf / Yaş', { text: gl, fontSize: 9.5 }]);
  if (s.school) info.push(['Okul', { text: s.school, fontSize: 9.5 }]);
  if (s.target) info.push(['Hedef', { text: s.target, fontSize: 9.5 }]);
  info.push(['Değerlendirme tarihi', { text: r.dateLabel, fontSize: 9.5 }]);
  info.push([
    'Uygulanan değerlendirmeler',
    {
      stack: r.tests.map((t) => ({
        columns: [
          { canvas: [{ type: 'ellipse', x: 4, y: 6, r1: 3.4, r2: 3.4, color: t.color }], width: 12 },
          { text: t.name, fontSize: 9.5, width: '*' },
        ],
        margin: [0, 0, 0, 2],
      })),
    } as unknown as Content,
  ]);
  const half = Math.ceil(r.toc.length / 2);
  const tocCol = (start: number, items: string[]) => ({
    stack: items.map((t, i) => ({ columns: [{ text: String(start + i + 1), width: 18, bold: true, fontSize: 9, color: r.accent }, { text: t, fontSize: 9, width: '*' }], margin: [0, 0, 0, 7] })),
    width: '*',
  });
  return {
    section: [
      { text: 'EĞİTİM CHECK-UP', absolutePosition: { x: MARGIN_X, y: 40 }, fontSize: 8, bold: true, color: '#FFFFFF', characterSpacing: 0.8 },
      { text: 'Kişiye Özel Değerlendirme Raporu', absolutePosition: { x: MARGIN_X, y: 40 }, width: CONTENT_W, alignment: 'right', fontSize: 7.5, color: tint(r.accent, 0.7) } as unknown as Content,
      { text: r.title, absolutePosition: { x: MARGIN_X, y: 118 }, font: 'DejaVuSerif', bold: true, fontSize: 24, color: '#FFFFFF', lineHeight: 1.15 } as unknown as Content,
      { text: r.subtitle, absolutePosition: { x: MARGIN_X, y: r.title.length > 32 ? 186 : 160 }, fontSize: 10.5, color: tint(r.accent, 0.8) } as unknown as Content,
      { text: '', margin: [0, band - 16, 0, 0] },
      {
        table: {
          widths: [120, '*'],
          body: info.map(([k, v]) => [{ text: k, fontSize: 8.5, color: MUTED, margin: [0, 6, 0, 6] }, { ...(v as object), margin: [0, 5, 0, 5] }]),
        },
        layout: { hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === node.table.body.length ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => '#E5E7EB', paddingLeft: () => 0, paddingRight: () => 4 },
        margin: [0, 0, 0, 22],
      } as unknown as Content,
      { text: 'BU RAPORDA', fontSize: 7.5, bold: true, color: r.accent, characterSpacing: 0.6, margin: [0, 0, 0, 10] },
      { columns: [tocCol(0, r.toc.slice(0, half)), tocCol(half, r.toc.slice(half))], columnGap: 24 } as unknown as Content,
    ],
    pageMargins: [MARGIN_X, 40, MARGIN_X, 60],
    background: (_page: number, size: { width: number }) => ({
      canvas: [
        { type: 'rect', x: 0, y: 0, w: size.width, h: band, color: r.accent },
        { type: 'rect', x: 0, y: band, w: size.width, h: 4, color: shade(r.accent, 0.25) },
      ],
    }),
    header: null,
    footer: () => ({ text: 'Bu rapor kişiye özeldir ve yalnızca öğrenci, ailesi ve öğrenciyle çalışan uzman tarafından kullanılmalıdır.', fontSize: 7, color: MUTED, margin: [MARGIN_X, 20, MARGIN_X, 0] }),
  } as unknown as Content;
}

// ── İçerik bölümleri ─────────────────────────────────────────

function pageHeader(r: ReportV2, audience: Audience) {
  const label = AUDIENCE_LABEL[audience];
  const color = AUDIENCE_COLOR[audience];
  return () => ({
    stack: [
      {
        columns: [
          { text: `${r.student.fullName}  ·  ${r.shortTitle}`, fontSize: 7, color: MUTED },
          { text: label, fontSize: 7, bold: true, color, alignment: 'right' },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 4, x2: CONTENT_W, y2: 4, lineWidth: 0.5, lineColor: RULE }] },
    ],
    margin: [MARGIN_X, 26, MARGIN_X, 0],
  });
}

function pageBackground(audience: Audience) {
  if (audience === 'general') return null;
  const color = AUDIENCE_COLOR[audience];
  return (_page: number, size: { width: number; height: number }) => ({ canvas: [{ type: 'rect', x: size.width - 14, y: 0, w: 14, h: size.height, color }] });
}

function contentSection(group: Section[], r: ReportV2): Content {
  const audience = group[0].audience;
  const accent = audience === 'general' ? r.accent : AUDIENCE_COLOR[audience];
  const body: Content[] = [];
  group.forEach((s, gi) => {
    if (gi > 0) body.push({ text: '', margin: [0, 10, 0, 0] });
    body.push(...sectionHead(s, accent));
    for (const b of s.blocks) body.push(...blockToPdf(b, r.accent, s.audience));
    if (s.id === 'closing') body.push({ text: r.footerNote, fontSize: 7.5, color: MUTED, margin: [0, 18, 0, 0] });
  });
  return {
    section: body,
    pageMargins: [MARGIN_X, 62, MARGIN_X, 54],
    header: pageHeader(r, audience),
    footer: (page: number) => ({ text: String(page), alignment: 'center', fontSize: 8, color: MUTED, margin: [0, 18, 0, 0] }),
    background: pageBackground(audience),
  } as unknown as Content;
}

export function buildReportV2DocDefinition(r: ReportV2): TDocumentDefinitions {
  const groups: Section[][] = [];
  for (const s of r.sections) {
    if (!groups.length || s.newPage !== false) groups.push([s]);
    else groups[groups.length - 1].push(s);
  }
  return {
    pageSize: 'A4',
    info: { title: `${r.student.fullName} — ${r.title}`, author: 'Eğitim Check-Up', subject: r.subtitle },
    defaultStyle: { font: 'DejaVuSans', fontSize: 9.5, color: INK },
    content: [coverSection(r), ...groups.map((g) => contentSection(g, r))],
    // Başlık sayfanın en altında yalnız kalmasın: alt başlık için sayfanın son %15'i,
    // test kartı başlığı için son %28'i yeni sayfaya taşınır.
    pageBreakBefore: (node: { headlineLevel?: number; startPosition?: { verticalRatio?: number } }) => {
      const r = node.startPosition?.verticalRatio ?? 0;
      return (node.headlineLevel === 1 && r > 0.85) || (node.headlineLevel === 2 && r > 0.72);
    },
  } as unknown as TDocumentDefinitions;
}

export async function generateReportV2Pdf(r: ReportV2): Promise<Buffer> {
  const printer = makePrinter();
  const doc = await printer.createPdfKitDocument(buildReportV2DocDefinition(r));
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (d: Buffer) => chunks.push(d));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}
