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
            { text: block.label.toUpperCase(), fontSize: 8, color: '#6b7280', bold: true, margin: [0, 0, 0, 3] },
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
                  text: insightLabel(block.type).toUpperCase(),
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
            { text: block.content, fontSize: 10, color: '#374151', lineHeight: 1.3 },
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
    case 'grid':
      return gridToPdf(block, audience);
  }
}

/** FAZ 2C: Başka export modüllerinin (integrated-generator vb.) blokları render etmesi için. */
export { infographicToPdf };

// ─── Metin parçası → pdfmake içerik (eski markdownToContent, satır satır) ───
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
        .map(cell => ({
          text: cell.trim().replace(/\*\*/g, '').replace(/\*/g, ''),
          style: 'tableCell',
          margin: [4, 3, 4, 3],
        }));

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
