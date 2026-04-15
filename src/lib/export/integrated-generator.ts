/**
 * Entegre 3'lü Rapor Export — PDF + DOCX (3 rapor tek dosyada)
 */

// ── PDF ──
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/js/Printer').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const URLResolver = require('pdfmake/js/URLResolver').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const virtualFs = require('pdfmake/js/virtual-fs').default;
import path from 'path';

// ── DOCX ──
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  PageBreak,
} from 'docx';

export interface IntegratedExportMeta {
  studentName: string;
  generatedAt?: string;
  schoolName?: string;
  testCount?: number;
}

interface ReportSection {
  label: string;
  icon: string;
  color: string; // hex
  text: string;
}

// ── PDF ──

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

// Markdown → pdfmake content (colored headers)
function markdownToPdfContent(markdown: string, accentColor: string): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      content.push({ text: ' ', margin: [0, 2] });
      continue;
    }

    if (/^# /.test(line)) {
      content.push({ text: line.replace(/^# /, ''), style: 'heading1', color: accentColor, margin: [0, 10, 0, 6] });
      continue;
    }
    if (/^## /.test(line)) {
      content.push({ text: line.replace(/^## /, '').replace(/\*\*/g, ''), style: 'heading2', color: accentColor, margin: [0, 8, 0, 4] });
      continue;
    }
    if (/^### /.test(line)) {
      content.push({ text: line.replace(/^### /, '').replace(/\*\*/g, ''), style: 'heading3', color: accentColor, margin: [0, 6, 0, 3] });
      continue;
    }

    // Table separator
    if (/^\|[-| ]+\|$/.test(line.replace(/ /g, ''))) continue;

    // Table row
    if (/^\|/.test(line)) {
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(cell => ({
        text: cell.trim().replace(/\*\*/g, ''),
        style: 'tableCell',
        margin: [4, 3, 4, 3],
      }));
      if (cells.length > 0) {
        const isHeader = lines[i + 1] && /^\|[-| ]+\|$/.test(lines[i + 1]?.replace(/ /g, '') ?? '');
        if (isHeader) {
          content.push({
            columns: cells.map(c => ({ ...c, width: '*', bold: true, color: accentColor })),
            columnGap: 1,
            margin: [0, 4, 0, 0],
          });
        } else {
          content.push({
            columns: cells.map(c => ({ ...c, width: '*' })),
            columnGap: 1,
            margin: [0, 1],
          });
        }
      }
      continue;
    }

    // Bullet
    if (/^[-*] /.test(line)) {
      content.push({
        text: [
          { text: '• ', bold: true, color: accentColor },
          { text: line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1') },
        ],
        margin: [10, 1, 0, 1],
        style: 'normal',
      });
      continue;
    }

    // Numbered
    if (/^\d+\. /.test(line)) {
      content.push({ text: line.replace(/\*\*(.*?)\*\*/g, '$1'), margin: [10, 1, 0, 1], style: 'normal' });
      continue;
    }

    // Progress bar lines — show as colored text
    const barMatch = /(.+?)\s*:\s*[█░▓▒]+\s*(\d+)%\s*→?\s*(.*)/.exec(line);
    if (barMatch) {
      const pct = parseInt(barMatch[2]);
      const pctColor = pct >= 80 ? '#10b981' : pct >= 60 ? accentColor : pct >= 40 ? '#f59e0b' : '#ef4444';
      content.push({
        text: [
          { text: `${barMatch[1].trim()}: `, bold: true },
          { text: `${pct}%`, bold: true, color: pctColor },
          { text: barMatch[3] ? ` → ${barMatch[3].trim()}` : '' },
        ],
        margin: [0, 2],
        style: 'normal',
      });
      continue;
    }

    // Bold
    if (/\*\*/.test(line)) {
      const parts: Array<Record<string, unknown>> = [];
      const segments = line.split(/(\*\*.*?\*\*)/);
      segments.forEach(seg => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          parts.push({ text: seg.slice(2, -2), bold: true, color: accentColor });
        } else if (seg) {
          parts.push({ text: seg });
        }
      });
      content.push({ text: parts, style: 'normal', margin: [0, 2] });
      continue;
    }

    // HR
    if (/^---/.test(line)) {
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }], margin: [0, 6] });
      continue;
    }

    content.push({ text: line, style: 'normal', margin: [0, 1] });
  }

  return content;
}

export function generateIntegratedPdf(
  reports: { ogretmen: string; ogrenci: string; ebeveyn: string },
  meta: IntegratedExportMeta
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const printer = getPrinter();
      const now = meta.generatedAt
        ? new Date(meta.generatedAt).toLocaleDateString('tr-TR')
        : new Date().toLocaleDateString('tr-TR');

      const sections: ReportSection[] = [
        { label: 'Öğretmen / Koç Raporu', icon: '👩‍🏫', color: '#0f2847', text: reports.ogretmen },
        { label: 'Öğrenci Raporu', icon: '🎓', color: '#7c3aed', text: reports.ogrenci },
        { label: 'Ebeveyn Raporu', icon: '👨‍👩‍👦', color: '#ec4899', text: reports.ebeveyn },
      ];

      // Build content array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content: any[] = [
        // ── KAPAK SAYFASI ──
        { text: '', margin: [0, 80] },
        {
          stack: [
            { text: 'EĞİTİM CHECK UP Pro', fontSize: 28, bold: true, color: '#0f2847', alignment: 'center' },
            { text: 'Entegre 3\'lü Analiz Raporu', fontSize: 18, bold: true, color: '#10b981', alignment: 'center', margin: [0, 10, 0, 30] },
            {
              canvas: [{ type: 'line', x1: 100, y1: 0, x2: 415, y2: 0, lineWidth: 2, lineColor: '#10b981' }],
              margin: [0, 0, 0, 30],
            },
            {
              table: {
                widths: ['auto', '*'],
                body: [
                  [
                    { text: 'Öğrenci:', bold: true, margin: [8, 6], fontSize: 12 },
                    { text: meta.studentName, margin: [8, 6], fontSize: 12 },
                  ],
                  ...(meta.schoolName ? [[
                    { text: 'Okul:', bold: true, margin: [8, 6], fontSize: 12 },
                    { text: meta.schoolName, margin: [8, 6], fontSize: 12 },
                  ]] : []),
                  [
                    { text: 'Rapor Tarihi:', bold: true, margin: [8, 6], fontSize: 12 },
                    { text: now, margin: [8, 6], fontSize: 12 },
                  ],
                  [
                    { text: 'Test Sayısı:', bold: true, margin: [8, 6], fontSize: 12 },
                    { text: `${meta.testCount ?? '—'} test analiz edildi`, margin: [8, 6], fontSize: 12 },
                  ],
                ],
              },
              layout: {
                fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#f8fafc' : null),
                hLineColor: () => '#e5e7eb',
                vLineColor: () => '#e5e7eb',
              },
              margin: [40, 0, 40, 30],
            },
            { text: '', margin: [0, 20] },
            {
              stack: [
                { text: 'Bu rapor 3 farklı perspektiften hazırlanmıştır:', fontSize: 10, alignment: 'center', color: '#6b7280', margin: [0, 0, 0, 10] },
                { columns: [
                  { text: '👩‍🏫 Öğretmen/Koç', alignment: 'center', fontSize: 10, color: '#0f2847', bold: true },
                  { text: '🎓 Öğrenci', alignment: 'center', fontSize: 10, color: '#7c3aed', bold: true },
                  { text: '👨‍👩‍👦 Ebeveyn', alignment: 'center', fontSize: 10, color: '#ec4899', bold: true },
                ]},
              ],
            },
          ],
        },
      ];

      // ── 3 RAPOR BÖLÜMLERİ ──
      for (const section of sections) {
        if (!section.text) continue;

        content.push(
          { text: '', pageBreak: 'before' },
          // Rapor başlığı
          {
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 515, h: 50, r: 8, color: section.color },
                ],
              },
              {
                text: `${section.icon}  ${section.label}`,
                fontSize: 18,
                bold: true,
                color: '#ffffff',
                margin: [15, -40, 0, 20],
              },
            ],
            margin: [0, 0, 0, 15],
          },
          // Rapor içeriği
          ...markdownToPdfContent(section.text, section.color),
        );
      }

      // Yasal uyarı
      content.push(
        { text: '', margin: [0, 30] },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }],
        },
        {
          text: 'Bu rapor, EĞİTİM CHECK UP Pro psikometrik değerlendirme sistemi tarafından yapay zeka destekli analiz altyapısıyla üretilmiştir. Klinik tanı içermez.',
          fontSize: 8,
          color: '#9ca3af',
          alignment: 'center',
          margin: [0, 10],
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.4 },
        styles: {
          header: { fontSize: 8, color: '#6b7280', alignment: 'center' as const },
          footer: { fontSize: 8, color: '#6b7280', alignment: 'center' as const },
          heading1: { fontSize: 16, bold: true },
          heading2: { fontSize: 13, bold: true },
          heading3: { fontSize: 11, bold: true },
          normal: { fontSize: 10, color: '#374151' },
          tableCell: { fontSize: 9, color: '#374151' },
        },
        header: () => ({
          stack: [
            {
              columns: [
                { text: 'EĞİTİM CHECK UP Pro', style: 'header', bold: true, color: '#0f2847' },
                { text: 'Entegre 3\'lü Rapor', style: 'header', alignment: 'right' as const },
              ],
              margin: [40, 15, 40, 0],
            },
            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#10b981' }] },
          ],
        }),
        footer: (currentPage: number, pageCount: number) => ({
          stack: [
            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }] },
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
        content,
      };

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

// ── DOCX ──

function markdownToDocxParagraphs(markdown: string, accentColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }

    if (/^# /.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/^# /, '').replace(/\*\*/g, ''), size: 32, bold: true, color: accentColor.replace('#', '') })],
        spacing: { before: 300, after: 150 },
      }));
      continue;
    }
    if (/^## /.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/^## /, '').replace(/\*\*/g, ''), size: 26, bold: true, color: accentColor.replace('#', '') })],
        spacing: { before: 200, after: 100 },
      }));
      continue;
    }
    if (/^### /.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/^### /, '').replace(/\*\*/g, ''), size: 22, bold: true, color: accentColor.replace('#', '') })],
        spacing: { before: 150, after: 80 },
      }));
      continue;
    }

    if (/^\|[-| ]+\|$/.test(line.replace(/ /g, ''))) continue;

    if (/^\|/.test(line)) {
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim().replace(/\*\*/g, ''));
      if (cells.length > 0) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: cells.join(' | '), size: 18 })],
          spacing: { after: 80 },
        }));
      }
      continue;
    }

    if (/^---/.test(line)) {
      paragraphs.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
        spacing: { before: 100, after: 100 },
      }));
      continue;
    }

    // Progress bar
    const barMatch = /(.+?)\s*:\s*[█░▓▒]+\s*(\d+)%\s*→?\s*(.*)/.exec(line);
    if (barMatch) {
      const pct = parseInt(barMatch[2]);
      const pctColor = pct >= 80 ? '10B981' : pct >= 60 ? accentColor.replace('#', '') : pct >= 40 ? 'F59E0B' : 'EF4444';
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: `${barMatch[1].trim()}: `, bold: true, size: 20 }),
          new TextRun({ text: `${pct}%`, bold: true, color: pctColor, size: 20 }),
          ...(barMatch[3] ? [new TextRun({ text: ` → ${barMatch[3].trim()}`, size: 20 })] : []),
        ],
        spacing: { after: 80 },
      }));
      continue;
    }

    if (/^[-*] /.test(line)) {
      const text = line.replace(/^[-*] /, '').replace(/\*\*/g, '');
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: '• ', bold: true, color: accentColor.replace('#', '') }),
          new TextRun({ text, size: 20 }),
        ],
        indent: { left: 360 },
        spacing: { after: 60 },
      }));
      continue;
    }

    if (/\*\*/.test(line)) {
      const runs: TextRun[] = [];
      const segments = line.split(/(\*\*.*?\*\*)/);
      segments.forEach(seg => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          runs.push(new TextRun({ text: seg.slice(2, -2), bold: true, color: accentColor.replace('#', '') }));
        } else if (seg) {
          runs.push(new TextRun({ text: seg, size: 20 }));
        }
      });
      paragraphs.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
      continue;
    }

    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: line, size: 20 })],
      spacing: { after: 80 },
    }));
  }

  return paragraphs;
}

function createCoverInfoTable(meta: IntegratedExportMeta): Table {
  const now = meta.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString('tr-TR')
    : new Date().toLocaleDateString('tr-TR');

  const rows = [
    ['Öğrenci Adı', meta.studentName],
    ...(meta.schoolName ? [['Okul', meta.schoolName]] : []),
    ['Rapor Türü', 'Entegre 3\'lü Analiz Raporu'],
    ['Oluşturma Tarihi', now],
    ['Test Sayısı', `${meta.testCount ?? '—'} test analiz edildi`],
  ];

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22 })], spacing: { before: 80, after: 80 } })],
              width: { size: 3000, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF', fill: idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
              },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: value, size: 22 })], spacing: { before: 80, after: 80 } })],
              width: { size: 6000, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF', fill: idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1FAE5' },
              },
            }),
          ],
        })
    ),
  });
}

export async function generateIntegratedDocx(
  reports: { ogretmen: string; ogrenci: string; ebeveyn: string },
  meta: IntegratedExportMeta
): Promise<Buffer> {
  const sections: { label: string; color: string; text: string }[] = [
    { label: 'Öğretmen / Koç Raporu', color: '0F2847', text: reports.ogretmen },
    { label: 'Öğrenci Raporu', color: '7C3AED', text: reports.ogrenci },
    { label: 'Ebeveyn Raporu', color: 'EC4899', text: reports.ebeveyn },
  ];

  // Cover page children
  const coverChildren: Paragraph[] = [
    new Paragraph({ text: '', spacing: { before: 2000 } }),
    new Paragraph({
      children: [new TextRun({ text: 'EĞİTİM CHECK UP Pro', size: 48, bold: true, color: '0F2847' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Entegre 3\'lü Analiz Raporu', size: 32, bold: true, color: '10B981' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    createCoverInfoTable(meta) as unknown as Paragraph,
    new Paragraph({ text: '', spacing: { after: 800 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Bu rapor 3 farklı perspektiften hazırlanmıştır:', size: 20, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '👩‍🏫 Öğretmen/Koç', bold: true, color: '0F2847', size: 20 }),
        new TextRun({ text: '   |   ', color: 'D1D5DB', size: 20 }),
        new TextRun({ text: '🎓 Öğrenci', bold: true, color: '7C3AED', size: 20 }),
        new TextRun({ text: '   |   ', color: 'D1D5DB', size: 20 }),
        new TextRun({ text: '👨‍👩‍👦 Ebeveyn', bold: true, color: 'EC4899', size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  // Report section children (each starting with page break)
  const reportSections = sections.filter(s => s.text).map(section => ({
    properties: {
      page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
    },
    children: [
      // Section title with colored bar
      new Paragraph({
        children: [new TextRun({ text: section.label, size: 36, bold: true, color: section.color })],
        spacing: { before: 200, after: 100 },
        border: { bottom: { style: BorderStyle.THICK, size: 6, color: section.color } },
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
      // Content
      ...markdownToDocxParagraphs(section.text, `#${section.color}`),
    ],
  }));

  const doc = new Document({
    creator: 'EĞİTİM CHECK UP Pro',
    title: `${meta.studentName} — Entegre 3'lü Rapor`,
    description: 'Entegre 3\'lü Analiz Raporu',
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, color: '0F2847' },
          paragraph: { spacing: { before: 300, after: 150 } },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, color: '0F2847' },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      ],
    },
    sections: [
      // Cover page
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children: coverChildren,
      },
      // Report sections
      ...reportSections,
      // Footer section
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Bu rapor, EĞİTİM CHECK UP Pro psikometrik değerlendirme sistemi tarafından yapay zeka destekli analiz altyapısıyla üretilmiştir. Klinik tanı içermez.',
                size: 16, color: '9CA3AF', italics: true,
              }),
            ],
            spacing: { before: 600 },
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
