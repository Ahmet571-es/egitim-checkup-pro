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
}

// Markdown'ı pdfmake içeriğine dönüştür (basit parser)
function markdownToContent(markdown: string): TDocumentDefinitions['content'] {
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
        // Tablo başlığı mı yoksa veri satırı mı
        const isHeader = cells[0]?.text?.startsWith('#') || i === 0 ||
          (lines[i + 1] && /^\|[-| ]+\|$/.test(lines[i + 1]?.replace(/ /g, '') ?? ''));

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
          ...((markdownToContent(reportText) ?? []) as any[]),
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
