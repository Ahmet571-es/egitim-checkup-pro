/**
 * Word (DOCX) Rapor Üretici — docx kütüphanesi (tam Unicode/Türkçe desteği)
 */
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
} from 'docx';

export interface DocxMetadata {
  studentName: string;
  testName: string;
  schoolName?: string;
  reportType?: string;
  generatedAt?: string;
}

// Markdown'ı docx paragraflarına dönüştür
function markdownToDocx(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }

    // H1
    if (/^# /.test(line)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^# /, '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
      continue;
    }

    // H2
    if (/^## /.test(line)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^## /, '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      continue;
    }

    // H3
    if (/^### /.test(line)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^### /, '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 80 },
        })
      );
      continue;
    }

    // Tablo ayraç satırı atla
    if (/^\|[-| ]+\|$/.test(line.replace(/ /g, ''))) continue;

    // Tablo satırı — basit dönüşüm
    if (/^\|/.test(line)) {
      const cells = line
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(c => c.trim().replace(/\*\*/g, ''));

      if (cells.length > 0) {
        const row = new TableRow({
          children: cells.map(
            cell =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: cell, size: 18 })],
                    spacing: { before: 50, after: 50 },
                  }),
                ],
                width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                },
              })
          ),
        });

        // Tek satırlı tablo olarak ekle
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cells.join(' | '),
                size: 18,
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
      continue;
    }

    // Ayraç
    if (/^---/.test(line)) {
      paragraphs.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
          spacing: { before: 100, after: 100 },
        })
      );
      continue;
    }

    // Madde işareti
    if (/^[-*] /.test(line)) {
      const text = line.replace(/^[-*] /, '').replace(/\*\*/g, '');
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', bold: true, color: '10b981' }),
            new TextRun({ text }),
          ],
          indent: { left: 360 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Bold içerikli satır
    if (/\*\*/.test(line)) {
      const runs: TextRun[] = [];
      const segments = line.split(/(\*\*.*?\*\*)/);
      segments.forEach(seg => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          runs.push(new TextRun({ text: seg.slice(2, -2), bold: true }));
        } else if (seg) {
          runs.push(new TextRun({ text: seg }));
        }
      });
      paragraphs.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
      continue;
    }

    // Normal satır
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 20 })],
        spacing: { after: 80 },
      })
    );
  }

  return paragraphs;
}

function createInfoTable(meta: DocxMetadata): Table {
  const now = meta.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString('tr-TR')
    : new Date().toLocaleDateString('tr-TR');

  const rows = [
    ['Öğrenci Adı', meta.studentName],
    ['Test / Rapor', meta.testName],
    ...(meta.schoolName ? [['Okul', meta.schoolName]] : []),
    ['Rapor Türü', meta.reportType ?? 'AI Analiz Raporu'],
    ['Oluşturma Tarihi', now],
  ];

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map(
      ([label, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 20 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
              width: { size: 2500, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF', fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 20 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
              width: { size: 6500, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF', fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
              },
            }),
          ],
        })
    ),
  });
}

export async function generateReportDocx(reportText: string, meta: DocxMetadata): Promise<Buffer> {
  const doc = new Document({
    creator: 'EĞİTİM CHECK UP Pro',
    title: `${meta.studentName} — ${meta.testName}`,
    description: 'AI Analiz Raporu',
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, color: '0F2847' },
          paragraph: { spacing: { before: 300, after: 150 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, color: '0F2847' },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 22, bold: true, color: '374151' },
          paragraph: { spacing: { before: 150, after: 80 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children: [
          // Başlık
          new Paragraph({
            children: [
              new TextRun({
                text: 'EĞİTİM CHECK UP Pro',
                size: 36,
                bold: true,
                color: '0F2847',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: meta.reportType ?? 'AI Analiz Raporu',
                size: 28,
                color: '10B981',
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Bilgi tablosu
          createInfoTable(meta),
          new Paragraph({ text: '', spacing: { after: 400 } }),
          // Rapor içeriği
          ...markdownToDocx(reportText),
          // Alt not
          new Paragraph({
            children: [
              new TextRun({
                text: 'Bu rapor, EĞİTİM CHECK UP Pro psikometrik değerlendirme sistemi tarafından yapay zeka destekli analiz altyapısıyla üretilmiştir. Klinik tanı içermez.',
                size: 16,
                color: '9CA3AF',
                italics: true,
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
