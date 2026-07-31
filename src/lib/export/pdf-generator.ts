/**
 * PDF Rapor Üretici — pdfmake + Roboto (Türkçe karakter destekli)
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/js/Printer').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const URLResolver = require('pdfmake/js/URLResolver').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const virtualFs = require('pdfmake/js/virtual-fs').default;
import path from 'path';

import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  parseReport,
  AUDIENCE_PALETTES,
  resolveStatColor,
  resolveInsightColor,
  insightLabel,
  type InfographicBlock,
  type InfographicAudience,
  type StatBlock,
  type RingBlock,
  type InsightBlock,
  type BarsBlock,
  type GridBlock,
  type RadarBlock,
  type CompareBlock,
  type ChainBlock,
  type TimelineBlock,
  type QuadrantBlock,
  type DonutBlock,
  type HeatmapBlock,
} from '@/lib/report/infographic-blocks';

// Resolve pdfmake package root via require.resolve on package.json so bundlers
// don't try to parse .ttf files as modules. Next.js outputFileTracingIncludes
// in next.config.ts copies the Roboto .ttf files into the Vercel serverless
// lambda alongside the compiled code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrinter(): any {
  let fontDir: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkgPath: string = require.resolve('pdfmake/package.json');
    fontDir = path.join(path.dirname(pkgPath), 'build', 'fonts', 'Roboto');
  } catch {
    fontDir = path.join(process.cwd(), 'node_modules', 'pdfmake', 'build', 'fonts', 'Roboto');
  }
  const fonts = {
    Roboto: {
      normal: path.join(fontDir, 'Roboto-Regular.ttf'),
      bold: path.join(fontDir, 'Roboto-Medium.ttf'),
      italics: path.join(fontDir, 'Roboto-Italic.ttf'),
      bolditalics: path.join(fontDir, 'Roboto-MediumItalic.ttf'),
    },
  };
  const urlResolver = new URLResolver(virtualFs);
  return new PdfPrinter(fonts, virtualFs, urlResolver);
}

export interface ReportMetadata {
  studentName: string;
  testName: string;
  schoolName?: string;
  generatedAt?: string;
  reportType?: string;
  /** FAZ 2C: infografik tema — 'ogretmen' | 'ogrenci' | 'ebeveyn' */
  audience?: InfographicAudience;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfContentNode = Record<string, any>;

// ─── FAZ 2C: Infografik blok render ──────────────────────────────────────────
function statToPdf(block: StatBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const color = resolveStatColor(palette, block.theme);
  const value = block.value + (block.unit ? ' ' + block.unit : '');
  return {
    table: {
      widths: ['*'],
      body: [[
        {
          stack: [
            { text: block.label.toLocaleUpperCase("tr-TR"), fontSize: 8, color: '#6b7280', bold: true, margin: [0, 0, 0, 3] },
            { text: value, fontSize: 22, color, bold: true },
          ],
          fillColor: color + '0d',
          margin: [10, 8, 10, 8],
          border: [false, false, false, false],
        },
      ]],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
    },
    margin: [0, 4, 0, 4],
  };
}

function ringToPdf(block: RingBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const pct = Math.round((block.value / block.max) * 100);
  const color = pct >= 70 ? palette.success : pct >= 40 ? palette.primary : palette.warning;
  const barWidth = 480;
  const filled = Math.round((pct / 100) * barWidth);

  return {
    stack: [
      {
        columns: [
          { text: block.label, bold: true, fontSize: 11, color: '#111827' },
          {
            text: `${pct}% (${block.value}/${block.max})`,
            alignment: 'right',
            bold: true,
            fontSize: 11,
            color,
          },
        ],
        margin: [0, 2, 0, 4],
      },
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: barWidth, h: 10, r: 4, color: '#e5e7eb' },
          { type: 'rect', x: 0, y: 0, w: filled, h: 10, r: 4, color },
        ],
      },
      ...(block.caption ? [{ text: block.caption, fontSize: 9, color: '#6b7280', margin: [0, 3, 0, 0] }] : []),
    ],
    margin: [0, 6, 0, 8],
  };
}

function insightToPdf(block: InsightBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const color = resolveInsightColor(palette, block.type);
  return {
    table: {
      widths: [4, '*'],
      body: [[
        { text: '', fillColor: color, border: [false, false, false, false] },
        {
          stack: [
            {
              columns: [
                {
                  text: insightLabel(block.type).toLocaleUpperCase("tr-TR"),
                  fontSize: 8,
                  color,
                  bold: true,
                  width: 'auto',
                },
                ...(block.title
                  ? [{ text: '  ' + block.title, fontSize: 11, bold: true, color: '#111827' }]
                  : []),
              ],
              margin: [0, 0, 0, 4],
            },
            { text: inlineRuns(block.content), fontSize: 10, color: '#374151', lineHeight: 1.3 },
          ],
          fillColor: color + '0d',
          margin: [10, 8, 10, 8],
          border: [false, false, false, false],
        },
      ]],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
    },
    margin: [0, 6, 0, 6],
  };
}

function barsToPdf(block: BarsBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const colors = [palette.primary, palette.secondary, palette.accent, palette.info];
  const maxVal = Math.max(
    ...block.items.map((i) => i.max ?? 100),
    ...block.items.map((i) => i.value)
  );
  const labelWidth = 130;
  const barMaxWidth = 320;
  const rowH = 16;
  const padding = 3;

  const stack: PdfContentNode[] = [];
  if (block.title) {
    stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 6] });
  }

  // Her bar için column (label | canvas+label | value)
  for (let i = 0; i < block.items.length; i++) {
    const it = block.items[i];
    const w = Math.max(2, Math.round((it.value / maxVal) * barMaxWidth));
    const color = colors[i % colors.length];
    stack.push({
      columns: [
        { text: it.label, width: labelWidth, fontSize: 10, color: '#374151', alignment: 'right', margin: [0, 3, 6, 0] },
        {
          width: barMaxWidth + 4,
          canvas: [
            { type: 'rect', x: 0, y: 2, w: barMaxWidth, h: 10, r: 3, color: '#f3f4f6' },
            { type: 'rect', x: 0, y: 2, w: w, h: 10, r: 3, color },
          ],
        },
        { text: String(it.value), width: 40, fontSize: 10, bold: true, color: '#111827', margin: [6, 3, 0, 0] },
      ],
      margin: [0, padding, 0, padding],
    });
    void rowH;
  }
  return { stack, margin: [0, 6, 0, 8] };
}

function gridToPdf(block: GridBlock, audience: InfographicAudience): PdfContentNode {
  const cols = block.cols;
  const rows: PdfContentNode[] = [];
  for (let i = 0; i < block.children.length; i += cols) {
    const row = block.children.slice(i, i + cols);
    // Eksikse boş sütunla doldur
    while (row.length < cols) {
      rows.push({ text: '' });
    }
    rows.push({
      columns: row.map((stat) => statToPdf(stat, audience)),
      columnGap: 8,
      margin: [0, 2, 0, 2],
    });
  }
  return { stack: rows, margin: [0, 4, 0, 4] };
}

// ─── FAZ 0 blokları — PDF karşılıkları ───────────────────────────────────────
function compareToPdf(block: CompareBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const barMax = 300, labelW = 120;
  const stack: PdfContentNode[] = [];
  if (block.title) stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 3] });
  stack.push({ text: `Dolu çubuk: ${block.selfLabel} · Açık çubuk: ${block.refLabel}`, fontSize: 8, color: '#6b7280', margin: [0, 0, 0, 6] });
  for (const it of block.items) {
    const mx = it.max ?? 100;
    const ws = Math.max(2, Math.round((it.self / mx) * barMax));
    const wr = Math.max(2, Math.round((it.ref / mx) * barMax));
    const d = Math.round((it.self - it.ref) * 10) / 10;
    stack.push({
      columns: [
        { text: it.label, width: labelW, fontSize: 9, color: '#374151', alignment: 'right', margin: [0, 4, 6, 0] },
        {
          width: barMax + 4,
          canvas: [
            { type: 'rect', x: 0, y: 1, w: barMax, h: 8, r: 2, color: '#f3f4f6' },
            { type: 'rect', x: 0, y: 1, w: ws, h: 8, r: 2, color: palette.primary },
            { type: 'rect', x: 0, y: 11, w: barMax, h: 6, r: 2, color: '#f3f4f6' },
            { type: 'rect', x: 0, y: 11, w: wr, h: 6, r: 2, color: '#cbd5e1' },
          ],
        },
        { text: `${it.self} / ${it.ref}  (${d >= 0 ? '+' : ''}${d})`, width: 85, fontSize: 9, bold: true, color: '#111827', margin: [6, 4, 0, 0] },
      ],
      margin: [0, 3, 0, 3],
    });
  }
  return { stack, margin: [0, 6, 0, 8] };
}

function chainToPdf(block: ChainBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const body: PdfContentNode[][] = [[
    { text: 'NEDEN', bold: true, fontSize: 8, color: '#ffffff', fillColor: palette.primary, margin: [4, 4, 4, 4] },
    { text: 'NİÇİN / ETKİ', bold: true, fontSize: 8, color: '#ffffff', fillColor: palette.primary, margin: [4, 4, 4, 4] },
    { text: 'SONUÇ', bold: true, fontSize: 8, color: '#ffffff', fillColor: palette.primary, margin: [4, 4, 4, 4] },
  ]];
  for (const l of block.links) {
    body.push([
      { text: l.cause, fontSize: 9, color: '#374151', margin: [4, 4, 4, 4] },
      { text: l.effect, fontSize: 9, color: '#374151', margin: [4, 4, 4, 4] },
      { text: l.result, fontSize: 9, color: '#111827', bold: true, margin: [4, 4, 4, 4] },
    ]);
  }
  const stack: PdfContentNode[] = [];
  if (block.title) stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 6] });
  stack.push({ table: { widths: ['*', '*', '*'], body }, layout: 'lightHorizontalLines' });
  return { stack, margin: [0, 6, 0, 8] };
}

function timelineToPdf(block: TimelineBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const stack: PdfContentNode[] = [];
  if (block.title) stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 6] });
  block.steps.forEach((s, i) => {
    stack.push({
      columns: [
        { text: String(i + 1), width: 16, fontSize: 10, bold: true, color: palette.primary, alignment: 'center', margin: [0, 2, 0, 0] },
        {
          width: '*',
          stack: [
            { text: s.title, fontSize: 10, bold: true, color: '#111827' },
            ...(s.detail ? [{ text: s.detail, fontSize: 9, color: '#4b5563', margin: [0, 1, 0, 0] } as PdfContentNode] : []),
            ...(s.tag ? [{ text: s.tag, fontSize: 8, color: palette.secondary, margin: [0, 1, 0, 0] } as PdfContentNode] : []),
          ],
        },
      ],
      margin: [0, 3, 0, 3],
    });
  });
  return { stack, margin: [0, 6, 0, 8] };
}

function quadrantToPdf(block: QuadrantBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const S = 150, pad = 12;
  const px = pad + (block.x / 100) * (S - 2 * pad);
  const py = S - pad - (block.y / 100) * (S - 2 * pad);
  const idx = (block.x >= 50 ? 1 : 0) + (block.y >= 50 ? 2 : 0);
  const stack: PdfContentNode[] = [];
  if (block.title) stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 6] });
  stack.push({
    columns: [
      {
        width: S + 6,
        canvas: [
          { type: 'rect', x: pad, y: pad, w: S - 2 * pad, h: S - 2 * pad, r: 4, color: '#f8fafc' },
          { type: 'line', x1: S / 2, y1: pad, x2: S / 2, y2: S - pad, lineWidth: 1, lineColor: '#e2e8f0' },
          { type: 'line', x1: pad, y1: S / 2, x2: S - pad, y2: S / 2, lineWidth: 1, lineColor: '#e2e8f0' },
          { type: 'ellipse', x: px, y: py, r1: 5, r2: 5, color: palette.primary },
        ],
      },
      {
        width: '*',
        stack: [
          { text: `${block.xLabel}: ${Math.round(block.x)}`, fontSize: 9, color: '#374151' },
          { text: `${block.yLabel}: ${Math.round(block.y)}`, fontSize: 9, color: '#374151', margin: [0, 2, 0, 4] },
          { text: `Konum: ${block.quadrants[idx] || '—'}`, fontSize: 10, bold: true, color: palette.primary },
          ...(block.caption ? [{ text: block.caption, fontSize: 8, color: '#6b7280', margin: [0, 4, 0, 0] } as PdfContentNode] : []),
        ],
        margin: [10, 20, 0, 0],
      },
    ],
  });
  return { stack, margin: [0, 6, 0, 8] };
}

function donutToPdf(block: DonutBlock, audience: InfographicAudience): PdfContentNode {
  const total = block.items.reduce((a, b) => a + b.value, 0) || 1;
  return barsToPdf({
    kind: 'bars',
    title: block.title,
    items: block.items.map((i) => ({ label: i.label, value: Math.round((i.value / total) * 100), max: 100 })),
  }, audience);
}

function heatmapToPdf(block: HeatmapBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const head: PdfContentNode[] = [{ text: '', fontSize: 8, margin: [3, 3, 3, 3] }];
  for (const cl of block.cols) {
    head.push({ text: cl, fontSize: 8, bold: true, color: '#ffffff', fillColor: palette.primary, alignment: 'center', margin: [3, 3, 3, 3] });
  }
  const body: PdfContentNode[][] = [head];
  for (const r of block.rows) {
    const row: PdfContentNode[] = [{ text: r.label, fontSize: 9, bold: true, color: '#374151', margin: [3, 3, 3, 3] }];
    for (const v of r.values) {
      const t = Math.max(0, Math.min(100, v)) / 100;
      row.push({
        text: String(Math.round(v)), fontSize: 9, bold: true, alignment: 'center',
        color: t > 0.55 ? '#ffffff' : '#334155',
        fillColor: t > 0.55 ? palette.primary : '#eef2f7',
        margin: [3, 3, 3, 3],
      });
    }
    body.push(row);
  }
  const stack: PdfContentNode[] = [];
  if (block.title) stack.push({ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 6] });
  stack.push({ table: { widths: ['auto', ...block.cols.map(() => '*')], body }, layout: 'noBorders' });
  if (block.caption) stack.push({ text: block.caption, fontSize: 8, color: '#6b7280', margin: [0, 4, 0, 0] });
  return { stack, margin: [0, 6, 0, 8] };
}

// ═══════════════════════════════════════════════════════════════════════════
// Gerçek grafik çizimleri (pdfmake canvas)
// Önceden radar → düz çubuk, donut → düz çubuk'a düşürülüyordu; web'deki
// zengin görselin PDF karşılığı yoktu ve çıktı "basit" görünüyordu.
// ═══════════════════════════════════════════════════════════════════════════

/** Radar (örümcek ağı) — eksen sayısı 3+ olduğunda çizilir. */
function radarCanvasToPdf(block: RadarBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const items: { label: string; value: number }[] = block.items.slice(0, 10).map((i) => ({ label: String(i.label), value: Number(i.value) || 0 }));
  const n = items.length;
  const S = 220, R = 78, cx = S / 2, cy = S / 2 + 4;
  const ang = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const px = (i: number, r: number) => cx + r * Math.cos(ang(i));
  const py = (i: number, r: number) => cy + r * Math.sin(ang(i));

  const canvas: Record<string, unknown>[] = [];
  // Izgara halkaları (polygon)
  for (const frac of [0.25, 0.5, 0.75, 1]) {
    canvas.push({
      type: 'polyline',
      closePath: true,
      lineWidth: 0.6,
      lineColor: frac === 1 ? '#cbd5e1' : '#e8edf3',
      points: items.map((_, i) => ({ x: px(i, R * frac), y: py(i, R * frac) })),
    });
  }
  // Eksen çizgileri
  for (let i = 0; i < n; i++) {
    canvas.push({ type: 'line', x1: cx, y1: cy, x2: px(i, R), y2: py(i, R), lineWidth: 0.5, lineColor: '#e2e8f0' });
  }
  // Veri poligonu
  const pts = items.map((it, i) => {
    const v = Math.max(0, Math.min(100, Number(it.value) || 0)) / 100;
    return { x: px(i, R * v), y: py(i, R * v) };
  });
  canvas.push({ type: 'polyline', closePath: true, points: pts, color: palette.primary, fillOpacity: 0.22 });
  canvas.push({ type: 'polyline', closePath: true, points: pts, lineWidth: 1.6, lineColor: palette.primary });
  for (const p of pts) canvas.push({ type: 'ellipse', x: p.x, y: p.y, r1: 2.2, r2: 2.2, color: palette.primary });

  // Etiketler tabloda (canvas metin desteklemiyor)
  const legend = items.map((it) => ({
    columns: [
      { text: it.label, fontSize: 8.5, color: '#374151', width: '*' },
      { text: `${Math.round(Number(it.value) || 0)}`, fontSize: 8.5, bold: true, color: palette.primary, width: 24, alignment: 'right' },
    ],
    margin: [0, 1, 0, 1],
  }));

  return {
    stack: [
      ...(block.title ? [{ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 4] } as PdfContentNode] : []),
      {
        columns: [
          { width: S + 8, canvas },
          { width: '*', stack: legend, margin: [8, 14, 0, 0] },
        ],
      },
    ],
    margin: [0, 6, 0, 10],
  };
}

/** Donut — halka dilimleri poligonla yaklaşık çizilir (pdfmake'te arc yok). */
function donutCanvasToPdf(block: DonutBlock, audience: InfographicAudience): PdfContentNode {
  const palette = AUDIENCE_PALETTES[audience];
  const items = block.items.filter((i) => Number(i.value) > 0).slice(0, 8);
  const total = items.reduce((a, b) => a + Number(b.value), 0) || 1;
  const S = 150, R = 60, r = 34, cx = S / 2, cy = S / 2;
  const colors = [palette.primary, palette.secondary, palette.info, palette.warning, palette.accent, '#94a3b8', '#a78bfa', '#f472b6'];

  const canvas: Record<string, unknown>[] = [];
  let acc = 0;
  items.forEach((it, idx) => {
    const frac = Number(it.value) / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const steps = Math.max(3, Math.ceil((a1 - a0) / 0.18));
    const pts: { x: number; y: number }[] = [];
    for (let s = 0; s <= steps; s++) {
      const a = a0 + ((a1 - a0) * s) / steps;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    for (let s = steps; s >= 0; s--) {
      const a = a0 + ((a1 - a0) * s) / steps;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    canvas.push({ type: 'polyline', closePath: true, points: pts, color: colors[idx % colors.length] });
  });

  const legend = items.map((it, idx) => ({
    columns: [
      { canvas: [{ type: 'rect', x: 0, y: 2, w: 7, h: 7, r: 1.5, color: colors[idx % colors.length] }], width: 11 },
      { text: it.label, fontSize: 8.5, color: '#374151', width: '*' },
      { text: `%${Math.round((Number(it.value) / total) * 100)}`, fontSize: 8.5, bold: true, color: '#111827', width: 26, alignment: 'right' },
    ],
    margin: [0, 1.5, 0, 1.5],
  }));

  return {
    stack: [
      ...(block.title ? [{ text: block.title, bold: true, fontSize: 11, color: '#111827', margin: [0, 0, 0, 4] } as PdfContentNode] : []),
      {
        columns: [
          { width: S + 8, canvas },
          { width: '*', stack: legend, margin: [8, 10, 0, 0] },
        ],
      },
    ],
    margin: [0, 6, 0, 10],
  };
}

function infographicToPdf(block: InfographicBlock, audience: InfographicAudience): PdfContentNode {
  switch (block.kind) {
    case 'stat':
      return statToPdf(block, audience);
    case 'ring':
      return ringToPdf(block, audience);
    case 'insight':
      return insightToPdf(block, audience);
    case 'bars':
      return barsToPdf(block, audience);
    case 'radar':
      // Gerçek radar çizimi (3+ eksen). Daha azsa çubuk daha okunur.
      return block.items.length >= 3
        ? radarCanvasToPdf(block, audience)
        : barsToPdf({ kind: 'bars', title: block.title, items: block.items.map((i) => ({ label: i.label, value: i.value, max: 100 })) }, audience);
    case 'gauge':
      // PDF'te gauge yerine ring (tek değer)
      return ringToPdf(
        { kind: 'ring', label: block.label, value: block.value, max: block.max, caption: block.caption },
        audience,
      );
    case 'grid':
      return gridToPdf(block, audience);
    case 'compare':
      return compareToPdf(block, audience);
    case 'chain':
      return chainToPdf(block, audience);
    case 'timeline':
      return timelineToPdf(block, audience);
    case 'quadrant':
      return quadrantToPdf(block, audience);
    case 'donut':
      return donutCanvasToPdf(block, audience);
    case 'heatmap':
      return heatmapToPdf(block, audience);
  }
}

/** FAZ 2C: Başka export modüllerinin (integrated-generator vb.) blokları render etmesi için. */
export { infographicToPdf };

// ─── Metin parçası → pdfmake içerik (eski markdownToContent, satır satır) ───
/**
 * Satır içi **kalın** işaretlerini pdfmake text run'larına çevirir.
 * Insight/chain gibi blok gövdelerinde markdown işlenmediği için '**' ham
 * olarak PDF'e sızıyordu; bu yardımcı onu düzeltir.
 */
function inlineRuns(text: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  if (!out.length) out.push({ text });
  return out;
}

/** Metin barı (███░░░) — Roboto'da blok karakteri glifi yok. */
const BAR_RE = /[\u2588\u2591]/;

/**
 * '███░░░░░░░' gibi metin barını gerçek çizime çevirir.
 * Roboto U+2588/U+2591 glifi taşımadığı için bu hücreler PDF'te BOŞ çıkıyordu;
 * tablolarda başlıklı ama içi boş bir 'Grafik' sütunu kalıyordu.
 */
function textBarToCanvas(cell: string, color: string): Record<string, unknown> {
  const filled = (cell.match(/\u2588/g) || []).length;
  const empty = (cell.match(/\u2591/g) || []).length;
  const total = filled + empty;
  const W = 74, H = 7;
  const w = total > 0 ? Math.max(2, Math.round((filled / total) * W)) : 0;
  return {
    canvas: [
      { type: 'rect', x: 0, y: 2, w: W, h: H, r: 2, color: '#eef2f7' },
      ...(w > 0 ? [{ type: 'rect', x: 0, y: 2, w, h: H, r: 2, color }] : []),
    ],
    margin: [0, 1, 0, 1],
  };
}

function textSegmentToContent(markdown: string): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      content.push({ text: ' ', margin: [0, 2] });
      continue;
    }

    // H1 (#)
    if (/^# /.test(line)) {
      content.push({
        text: line.replace(/^# /, ''),
        style: 'heading1',
        margin: [0, 10, 0, 6],
      });
      continue;
    }

    // H2 (##)
    if (/^## /.test(line)) {
      content.push({
        text: line.replace(/^## /, ''),
        style: 'heading2',
        margin: [0, 8, 0, 4],
      });
      continue;
    }

    // H3 (###)
    if (/^### /.test(line)) {
      content.push({
        text: line.replace(/^### /, ''),
        style: 'heading3',
        margin: [0, 6, 0, 3],
      });
      continue;
    }

    // Tablo satırı (|...|)
    if (/^\|/.test(line)) {
      // Başlık çizgisi atla
      if (/^\|[-| ]+\|$/.test(line.replace(/ /g, ''))) continue;

      const cells = line
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(cell => {
          const raw = cell.trim();
          // '███░░░' metin barı: Roboto'da blok karakteri glifi yok → çizime çevir.
          if (BAR_RE.test(raw)) {
            return { ...textBarToCanvas(raw, '#10b981'), style: 'tableCell', margin: [4, 3, 4, 3] };
          }
          return {
            text: raw.replace(/\*\*/g, '').replace(/\*/g, ''),
            style: 'tableCell',
            margin: [4, 3, 4, 3],
          };
        });

      if (cells.length > 0) {
        content.push({
          columns: cells.map(c => ({ ...c, width: '*' })),
          columnGap: 1,
          margin: [0, 1],
        });
      }
      continue;
    }

    // Madde işareti (- veya *)
    if (/^[-*] /.test(line)) {
      content.push({
        text: [
          { text: '• ', bold: true, color: '#10b981' },
          { text: line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1') },
        ],
        margin: [10, 1, 0, 1],
        style: 'normal',
      });
      continue;
    }

    // Numaralı madde (1. 2. ...)
    if (/^\d+\. /.test(line)) {
      content.push({
        text: line.replace(/\*\*(.*?)\*\*/g, '$1'),
        margin: [10, 1, 0, 1],
        style: 'normal',
      });
      continue;
    }

    // Bold ile başlayan satır
    if (/\*\*/.test(line)) {
      const parts: Array<Record<string, unknown>> = [];
      const segments = line.split(/(\*\*.*?\*\*)/);
      segments.forEach(seg => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          parts.push({ text: seg.slice(2, -2), bold: true });
        } else if (seg) {
          parts.push({ text: seg });
        }
      });
      content.push({ text: parts, style: 'normal', margin: [0, 2] });
      continue;
    }

    // Ayraç çizgi
    if (/^---/.test(line)) {
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }],
        margin: [0, 6],
      });
      continue;
    }

    // Normal metin
    content.push({ text: line, style: 'normal', margin: [0, 1] });
  }
  return content;
}

/**
 * Markdown'ı pdfmake içeriğine dönüştür.
 * FAZ 2C: Önce infografik bloklarını ayırır; metin parçaları eski parser'dan
 * geçirilir, blok parçaları pdfmake primitif'lerine çevrilir.
 */
function markdownToContent(
  markdown: string,
  audience: InfographicAudience = 'ogretmen'
): TDocumentDefinitions['content'] {
  const segments = parseReport(markdown);
  const content: Array<Record<string, unknown>> = [];
  for (const seg of segments) {
    if (seg.kind === 'text') {
      content.push(...textSegmentToContent(seg.text));
    } else {
      content.push(infographicToPdf(seg.block, audience));
    }
  }
  return content as unknown as TDocumentDefinitions['content'];
}

export function generateReportPdf(reportText: string, meta: ReportMetadata): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const printer = getPrinter();
      const now = meta.generatedAt
        ? new Date(meta.generatedAt).toLocaleDateString('tr-TR')
        : new Date().toLocaleDateString('tr-TR');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          lineHeight: 1.4,
        },
        styles: {
          header: { fontSize: 8, color: '#6b7280', alignment: 'center' as const },
          footer: { fontSize: 8, color: '#6b7280', alignment: 'center' as const },
          heading1: { fontSize: 16, bold: true, color: '#0f2847' },
          heading2: { fontSize: 13, bold: true, color: '#0f2847' },
          heading3: { fontSize: 11, bold: true, color: '#374151' },
          normal: { fontSize: 10, color: '#374151' },
          tableCell: { fontSize: 9, color: '#374151' },
          highlight: { color: '#10b981', bold: true },
        },
        header: () => ({
          stack: [
            {
              columns: [
                { text: 'EĞİTİM CHECK UP Pro', style: 'header', bold: true, color: '#0f2847' },
                { text: `${meta.reportType ?? 'AI Analiz Raporu'}`, style: 'header', alignment: 'right' as const },
              ],
              margin: [40, 15, 40, 0],
            },
            {
              canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#10b981' }],
            },
          ],
        }),
        footer: (currentPage: number, pageCount: number) => ({
          stack: [
            {
              canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }],
            },
            {
              columns: [
                { text: `Öğrenci: ${meta.studentName}`, style: 'footer', alignment: 'left' as const },
                { text: `Sayfa ${currentPage} / ${pageCount}`, style: 'footer' },
                { text: `Tarih: ${now}`, style: 'footer', alignment: 'right' as const },
              ],
              margin: [40, 5, 40, 0],
            },
          ],
        }),
        content: [
          // Başlık sayfası
          {
            stack: [
              {
                text: 'EĞİTİM CHECK UP Pro',
                style: 'heading1',
                alignment: 'center',
                color: '#0f2847',
                margin: [0, 20, 0, 5],
              },
              {
                text: meta.reportType ?? 'AI Analiz Raporu',
                style: 'heading2',
                alignment: 'center',
                color: '#10b981',
                margin: [0, 0, 0, 20],
              },
              {
                table: {
                  widths: ['auto', '*'],
                  body: [
                    [
                      { text: 'Öğrenci:', bold: true, margin: [6, 4] },
                      { text: meta.studentName, margin: [6, 4] },
                    ],
                    [
                      { text: 'Test:', bold: true, margin: [6, 4] },
                      { text: meta.testName, margin: [6, 4] },
                    ],
                    ...(meta.schoolName
                      ? [[{ text: 'Okul:', bold: true, margin: [6, 4] }, { text: meta.schoolName, margin: [6, 4] }]]
                      : []),
                    [
                      { text: 'Rapor Tarihi:', bold: true, margin: [6, 4] },
                      { text: now, margin: [6, 4] },
                    ],
                  ],
                },
                layout: {
                  fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#f8fafc' : null),
                  hLineColor: () => '#e5e7eb',
                  vLineColor: () => '#e5e7eb',
                },
                margin: [0, 0, 0, 20],
              },
              {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#10b981' }],
                margin: [0, 0, 0, 20],
              },
            ],
          },
          // Rapor içeriği
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...((markdownToContent(reportText, meta.audience ?? 'ogretmen') ?? []) as any[]),
          // Yasal not
          {
            text: '\n\nBu rapor, EĞİTİM CHECK UP Pro psikometrik değerlendirme sistemi tarafından yapay zeka destekli analiz altyapısıyla üretilmiştir. Klinik tanı içermez.',
            style: 'header',
            margin: [0, 20, 0, 0],
          },
        ],
      };

      // pdfmake v0.3+: createPdfKitDocument returns a Promise<PDFDocument>
      Promise.resolve(printer.createPdfKitDocument(docDefinition))
        .then((pdfDoc: NodeJS.ReadableStream & { end: () => void }) => {
          const chunks: Buffer[] = [];
          pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
          pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
          pdfDoc.on('error', reject);
          pdfDoc.end();
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}
