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
  type CompareBlock,
  type ChainBlock,
  type TimelineBlock,
  type QuadrantBlock,
  type DonutBlock,
  type HeatmapBlock,
} from '@/lib/report/infographic-blocks';

export interface DocxMetadata {
  studentName: string;
  testName: string;
  schoolName?: string;
  reportType?: string;
  generatedAt?: string;
  /** FAZ 2C: infografik tema */
  audience?: InfographicAudience;
}

// ─── FAZ 2C: DOCX için infografik blok renderları ────────────────────────────
/** #rrggbb → RRGGBB (docx için hex format, # olmadan) */
function hex(color: string): string {
  return color.replace('#', '').toUpperCase();
}

function statToDocx(block: StatBlock, audience: InfographicAudience): Table {
  const palette = AUDIENCE_PALETTES[audience];
  const color = hex(resolveStatColor(palette, block.theme));
  const value = block.value + (block.unit ? ' ' + block.unit : '');

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color },
      bottom: { style: BorderStyle.SINGLE, size: 4, color },
      left: { style: BorderStyle.SINGLE, size: 4, color },
      right: { style: BorderStyle.SINGLE, size: 4, color },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F9FAFB' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: block.label.toLocaleUpperCase("tr-TR"),
                    size: 16,
                    bold: true,
                    color: '6B7280',
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: value, size: 44, bold: true, color }),
                ],
                spacing: { after: 120 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function ringToDocx(block: RingBlock, audience: InfographicAudience): Paragraph[] {
  const palette = AUDIENCE_PALETTES[audience];
  const pct = Math.round((block.value / block.max) * 100);
  const color = hex(pct >= 70 ? palette.success : pct >= 40 ? palette.primary : palette.warning);

  // Visual progress: [████████░░░░] karakterleriyle
  const filled = Math.round((pct / 100) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

  return [
    new Paragraph({
      children: [
        new TextRun({ text: block.label, bold: true, size: 22 }),
        new TextRun({ text: '   ' + pct + '%  (' + block.value + '/' + block.max + ')', bold: true, color, size: 22 }),
      ],
      spacing: { before: 120, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: bar, color, size: 22 })],
      spacing: { after: 60 },
    }),
    ...(block.caption
      ? [new Paragraph({
          children: [new TextRun({ text: block.caption, italics: true, color: '6B7280', size: 18 })],
          spacing: { after: 120 },
        })]
      : []),
  ];
}

function insightToDocx(block: InsightBlock, audience: InfographicAudience): Table {
  const palette = AUDIENCE_PALETTES[audience];
  const color = hex(resolveInsightColor(palette, block.type));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [100, 8900],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          // Sol renkli şerit
          new TableCell({
            width: { size: 100, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: color },
            children: [new Paragraph({ text: '' })],
          }),
          // İçerik
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FAFAFA' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: insightLabel(block.type).toLocaleUpperCase("tr-TR") + (block.title ? '  •  ' + block.title : ''),
                    bold: true,
                    color,
                    size: 20,
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                children: inlineDocxRuns(block.content, 20),
                spacing: { after: 120 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function barsToDocx(block: BarsBlock, audience: InfographicAudience): Array<Paragraph | Table> {
  const palette = AUDIENCE_PALETTES[audience];
  const colors = [palette.primary, palette.secondary, palette.accent, palette.info].map(hex);
  const maxVal = Math.max(
    ...block.items.map((i) => i.max ?? 100),
    ...block.items.map((i) => i.value)
  );

  const out: Array<Paragraph | Table> = [];
  if (block.title) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: block.title, bold: true, size: 22 })],
        spacing: { before: 120, after: 80 },
      })
    );
  }

  for (let i = 0; i < block.items.length; i++) {
    const it = block.items[i];
    const color = colors[i % colors.length];
    const filled = Math.round((it.value / maxVal) * 20);
    const bar = '█'.repeat(Math.max(1, filled)) + '░'.repeat(Math.max(0, 20 - filled));

    out.push(
      new Paragraph({
        children: [
          new TextRun({ text: it.label.padEnd(25, ' ').slice(0, 25), size: 20 }),
          new TextRun({ text: '  ' + bar + '  ', color, size: 20 }),
          new TextRun({ text: String(it.value), bold: true, size: 20 }),
        ],
        spacing: { after: 40 },
      })
    );
  }
  // Küçük alt boşluk
  out.push(new Paragraph({ text: '', spacing: { after: 100 } }));
  return out;
}

function gridToDocx(block: GridBlock, audience: InfographicAudience): Table {
  const cols = block.cols;
  const cellWidth = Math.floor(9000 / cols);

  const rows: TableRow[] = [];
  for (let i = 0; i < block.children.length; i += cols) {
    const rowStats = block.children.slice(i, i + cols);
    const cells: TableCell[] = [];
    for (let c = 0; c < cols; c++) {
      const stat = rowStats[c];
      if (stat) {
        const palette = AUDIENCE_PALETTES[audience];
        const color = hex(resolveStatColor(palette, stat.theme));
        const value = stat.value + (stat.unit ? ' ' + stat.unit : '');
        cells.push(
          new TableCell({
            width: { size: cellWidth, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F9FAFB' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color },
              bottom: { style: BorderStyle.SINGLE, size: 4, color },
              left: { style: BorderStyle.SINGLE, size: 4, color },
              right: { style: BorderStyle.SINGLE, size: 4, color },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: stat.label.toLocaleUpperCase("tr-TR"),
                    size: 14,
                    bold: true,
                    color: '6B7280',
                  }),
                ],
                spacing: { before: 100, after: 40 },
              }),
              new Paragraph({
                children: [new TextRun({ text: value, size: 32, bold: true, color })],
                spacing: { after: 100 },
              }),
            ],
          })
        );
      } else {
        cells.push(
          new TableCell({
            width: { size: cellWidth, type: WidthType.DXA },
            children: [new Paragraph({ text: '' })],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          })
        );
      }
    }
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// ─── FAZ 0 blokları — DOCX karşılıkları ──────────────────────────────────────
function p(text: string, opts?: { bold?: boolean; size?: number; before?: number; after?: number }): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts?.bold, size: opts?.size ?? 20 })],
    spacing: { before: opts?.before ?? 0, after: opts?.after ?? 60 },
  });
}

function compareToDocx(block: CompareBlock, audience: InfographicAudience): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  if (block.title) out.push(p(block.title, { bold: true, size: 22, before: 120, after: 80 }));
  out.push(p(`${block.selfLabel} / ${block.refLabel} karşılaştırması`, { size: 18, after: 60 }));
  for (const it of block.items) {
    const mx = it.max ?? 100;
    const f = (v: number) => '█'.repeat(Math.max(1, Math.round((v / mx) * 16))) + '░'.repeat(Math.max(0, 16 - Math.round((v / mx) * 16)));
    const d = Math.round((it.self - it.ref) * 10) / 10;
    out.push(p(`${it.label.padEnd(22, ' ').slice(0, 22)} ${f(it.self)} ${it.self}   (${block.refLabel}: ${it.ref}, fark ${d >= 0 ? '+' : ''}${d})`, { size: 18 }));
  }
  void audience;
  return out;
}

function chainToDocx(block: ChainBlock, audience: InfographicAudience): Array<Paragraph | Table> {
  const palette = AUDIENCE_PALETTES[audience];
  const out: Array<Paragraph | Table> = [];
  if (block.title) out.push(p(block.title, { bold: true, size: 22, before: 120, after: 80 }));
  const head = ['NEDEN', 'NİÇİN / ETKİ', 'SONUÇ'];
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: head.map((h) => new TableCell({
          shading: { fill: hex(palette.primary) },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16, color: 'FFFFFF' })] })],
        })),
      }),
      ...block.links.map((l) => new TableRow({
        children: [l.cause, l.effect, l.result].map((t) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t, size: 18 })] })],
        })),
      })),
    ],
  }));
  out.push(p('', { after: 100 }));
  return out;
}

function timelineToDocx(block: TimelineBlock): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  if (block.title) out.push(p(block.title, { bold: true, size: 22, before: 120, after: 80 }));
  block.steps.forEach((s, i) => {
    out.push(p(`${i + 1}. ${s.title}`, { bold: true, size: 19 }));
    if (s.detail) out.push(p(`    ${s.detail}`, { size: 18 }));
    if (s.tag) out.push(p(`    [${s.tag}]`, { size: 16 }));
  });
  out.push(p('', { after: 100 }));
  return out;
}

function quadrantToDocx(block: QuadrantBlock): Array<Paragraph | Table> {
  const idx = (block.x >= 50 ? 1 : 0) + (block.y >= 50 ? 2 : 0);
  const where = block.quadrants[idx] || '—';
  const out: Array<Paragraph | Table> = [];
  if (block.title) out.push(p(block.title, { bold: true, size: 22, before: 120, after: 80 }));
  out.push(p(`${block.xLabel}: ${Math.round(block.x)} · ${block.yLabel}: ${Math.round(block.y)}`, { size: 19 }));
  out.push(p(`Konum: ${where}`, { bold: true, size: 19 }));
  if (block.caption) out.push(p(block.caption, { size: 17 }));
  out.push(p('', { after: 100 }));
  return out;
}

function donutToDocx(block: DonutBlock, audience: InfographicAudience): Array<Paragraph | Table> {
  const total = block.items.reduce((a, b) => a + b.value, 0) || 1;
  return barsToDocx({
    kind: 'bars',
    title: block.title,
    items: block.items.map((i) => ({ label: i.label, value: Math.round((i.value / total) * 100), max: 100 })),
  }, audience);
}

function heatmapToDocx(block: HeatmapBlock, audience: InfographicAudience): Array<Paragraph | Table> {
  const palette = AUDIENCE_PALETTES[audience];
  const out: Array<Paragraph | Table> = [];
  if (block.title) out.push(p(block.title, { bold: true, size: 22, before: 120, after: 80 }));
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '', size: 16 })] })] }),
          ...block.cols.map((cl) => new TableCell({
            shading: { fill: hex(palette.primary) },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cl, bold: true, size: 15, color: 'FFFFFF' })] })],
          })),
        ],
      }),
      ...block.rows.map((r) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.label, bold: true, size: 17 })] })] }),
          ...r.values.map((v) => new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(Math.round(v)), size: 17 })] })],
          })),
        ],
      })),
    ],
  }));
  if (block.caption) out.push(p(block.caption, { size: 16, before: 60 }));
  out.push(p('', { after: 100 }));
  return out;
}

/**
 * Satır içi **kalın** işaretlerini docx TextRun'larına çevirir.
 * Insight/chain gibi blok gövdelerinde markdown işlenmediği için '**' ham
 * olarak DOCX'e sızıyordu.
 */
function inlineDocxRuns(text: string, size = 20): TextRun[] {
  const out: TextRun[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), size }));
    out.push(new TextRun({ text: m[1], bold: true, size }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), size }));
  if (!out.length) out.push(new TextRun({ text, size }));
  return out;
}

function infographicToDocx(
  block: InfographicBlock,
  audience: InfographicAudience
): Array<Paragraph | Table> {
  switch (block.kind) {
    case 'stat':
      return [statToDocx(block, audience), new Paragraph({ text: '', spacing: { after: 100 } })];
    case 'ring':
      return ringToDocx(block, audience);
    case 'insight':
      return [insightToDocx(block, audience), new Paragraph({ text: '', spacing: { after: 100 } })];
    case 'bars':
      return barsToDocx(block, audience);
    case 'compare':
      return compareToDocx(block, audience);
    case 'chain':
      return chainToDocx(block, audience);
    case 'timeline':
      return timelineToDocx(block);
    case 'quadrant':
      return quadrantToDocx(block);
    case 'donut':
      return donutToDocx(block, audience);
    case 'heatmap':
      return heatmapToDocx(block, audience);
    case 'radar':
      // DOCX'te radar render etmiyoruz; bars olarak göster (içerik aynı)
      return barsToDocx({ kind: 'bars', title: block.title, items: block.items }, audience);
    case 'gauge':
      // DOCX'te gauge render etmiyoruz; ring olarak göster (tek değer)
      return ringToDocx(
        { kind: 'ring', label: block.label, value: block.value, max: block.max, caption: block.caption },
        audience,
      );
    case 'grid':
      return [gridToDocx(block, audience), new Paragraph({ text: '', spacing: { after: 100 } })];
  }
}

/** FAZ 2C: integrated-generator vb. dış modüllerin blokları render etmesi için. */
export { infographicToDocx };

// Markdown'ı docx paragraflarına dönüştür (FAZ 2C: blok-aware)
function markdownToDocx(
  markdown: string,
  audience: InfographicAudience = 'ogretmen'
): Array<Paragraph | Table> {
  const segments = parseReport(markdown);
  const out: Array<Paragraph | Table> = [];
  for (const seg of segments) {
    if (seg.kind === 'block') {
      out.push(...infographicToDocx(seg.block, audience));
    } else {
      out.push(...textSegmentToDocx(seg.text));
    }
  }
  return out;
}

// Eski markdownToDocx — artık metin parçalarına uygulanıyor
function textSegmentToDocx(markdown: string): Paragraph[] {
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
          ...markdownToDocx(reportText, meta.audience ?? 'ogretmen'),
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
