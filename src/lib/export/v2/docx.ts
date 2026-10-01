/**
 * Rapor v2 — Word (DOCX) çizici
 *
 * PDF ile aynı veri modelinden, düzenlenebilir bir Word belgesi üretir.
 * Grafikler SVG olarak gömülür (güncel Word sürümleri gösterir). SVG
 * desteklemeyen eski programlar için küçük, boş bir yedek görsel eklenir;
 * bu durumda grafiklerin en iyi görünümü PDF çıktısındadır.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  Footer,
  Header,
  PageNumber,
} from 'docx';
import type { Audience, Block, ReportV2, Section } from '@/lib/report-v2/types';
import { renderChartSvg, svgSize } from '@/lib/report-v2/charts';
import { tint } from '@/lib/tests/colors';

const FONT = 'Calibri';
const SERIF = 'Georgia';
const INK = '1F2937';
const MUTED = '6B7280';
const AUD: Record<Audience, string> = { general: '245B8F', student: '1F7A7A', family: 'B5591F', expert: '4A5568' };
const AUD_LABEL: Record<Audience, string> = { general: '', student: 'ÖĞRENCİ İÇİN', family: 'AİLE İÇİN', expert: 'UZMAN İÇİN' };
const LEVEL_TXT = ['', 'Düşük', 'Orta altı', 'Orta', 'Orta üstü', 'Yüksek'];

// 1x1 şeffaf PNG (SVG göstermeyen programlar için yedek)
const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const hex = (c: string) => c.replace('#', '').toUpperCase();

function runs(text: string, o: { size?: number; color?: string; bold?: boolean; italics?: boolean; font?: string } = {}): TextRun[] {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) => {
      const b = p.startsWith('**') && p.endsWith('**');
      return new TextRun({ text: b ? p.slice(2, -2) : p, bold: b || o.bold, italics: o.italics, size: o.size ?? 21, color: o.color ?? INK, font: o.font ?? FONT });
    });
}

function para(text: string, o: { size?: number; color?: string; bold?: boolean; italics?: boolean; after?: number; font?: string } = {}): Paragraph {
  return new Paragraph({ children: runs(text, o), spacing: { after: o.after ?? 140, line: 300 } });
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

function shadedBox(children: Paragraph[], fill: string, borderColor?: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { ...NO_BORDERS, left: borderColor ? { style: BorderStyle.SINGLE, size: 24, color: borderColor } : NO_BORDER },
    rows: [
      new TableRow({
        children: [new TableCell({ children, shading: { type: ShadingType.CLEAR, color: 'auto', fill }, margins: { top: 120, bottom: 120, left: 180, right: 180 } })],
      }),
    ],
  });
}

function chart(svg: string): Paragraph | null {
  if (!svg) return null;
  const { w, h } = svgSize(svg);
  const width = 430;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [
      new ImageRun({
        type: 'svg',
        data: Buffer.from(svg, 'utf-8'),
        transformation: { width, height: Math.round((width * h) / w) },
        fallback: { type: 'png', data: BLANK_PNG },
      }),
    ],
  });
}

function twoColTable(left: { title: string; items: string[] }, right: { title: string; items: string[] }, doDont: boolean): Table {
  const cell = (title: string, items: string[], fill: string, color: string, mark: string) =>
    new TableCell({
      shading: { type: ShadingType.CLEAR, color: 'auto', fill },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, color, size: 20, font: FONT })], spacing: { after: 80 } }),
        ...items.map((x) => new Paragraph({ children: [new TextRun({ text: `${mark} `, bold: true, color, size: 20, font: FONT }), ...runs(x, { size: 20 })], spacing: { after: 60 } })),
      ],
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [cell(left.title, left.items, 'EAF5EE', '2F7D4F', doDont ? '✓' : '•'), cell(right.title, right.items, doDont ? 'FBEAEA' : 'FBEFE6', doDont ? 'B42318' : 'B5591F', doDont ? '✕' : '•')] })],
  });
}

function twoColumnTable(head: [string, string], rows: [string, string][], color: string, italic = false): Table {
  const headCell = (t: string) => new TableCell({ shading: { type: ShadingType.CLEAR, color: 'auto', fill: color }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF', size: 19, font: FONT })] })] });
  const bodyCell = (t: string, bold: boolean, fill: string, col?: string) =>
    new TableCell({ shading: { type: ShadingType.CLEAR, color: 'auto', fill }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: runs(t, { size: 19, bold, italics: italic, color: col }) })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { ...NO_BORDERS, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' } },
    rows: [
      new TableRow({ tableHeader: true, children: [headCell(head[0]), headCell(head[1])] }),
      ...rows.map(([a, b], i) => new TableRow({ children: [bodyCell(a, !italic, i % 2 ? 'FFFFFF' : 'F7F8FA', italic ? '9B2C2C' : undefined), bodyCell(b, false, i % 2 ? 'FFFFFF' : 'F7F8FA', italic ? '276749' : undefined)] })),
    ],
  });
}

function blockToDocx(b: Block, accent: string): (Paragraph | Table)[] {
  switch (b.t) {
    case 'p':
      return [para(b.text)];
    case 'lead':
      return [shadedBox([para(b.text, { size: 23, color: '1E3A5F', font: SERIF, after: 0 })], hex(tint(`#${accent}`, 0.9)), accent), new Paragraph({ spacing: { after: 120 } })];
    case 'h3':
      return [new Paragraph({ keepNext: true, spacing: { before: 240, after: 100 }, children: [...(b.num ? [new TextRun({ text: `${b.num}   `, bold: true, color: accent, size: 22, font: FONT })] : []), new TextRun({ text: b.text, bold: true, color: '111827', size: 22, font: FONT })] })];
    case 'bullets':
      return b.items.map((x) => new Paragraph({ bullet: { level: 0 }, children: runs(x), spacing: { after: 60, line: 290 } }));
    case 'callout':
      return [shadedBox([...(b.title ? [para(b.title, { bold: true, color: accent, size: 19, after: 60 })] : []), para(b.text, { size: 20, after: 0 })], hex(tint(`#${accent}`, 0.9)), accent), new Paragraph({ spacing: { after: 120 } })];
    case 'priority':
      return [shadedBox([para(b.title, { bold: true, color: 'FFFFFF', size: 17, after: 60 }), para(b.text, { color: 'FFFFFF', size: 21, after: 0 })], accent), new Paragraph({ spacing: { after: 120 } })];
    case 'twoCol':
      return [twoColTable(b.left, b.right, b.tone === 'doDont'), new Paragraph({ spacing: { after: 120 } })];
    case 'testResult': {
      const out: (Paragraph | Table)[] = [];
      const c = hex(b.color);
      out.push(new Paragraph({ keepNext: true, spacing: { before: 200, after: 40 }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: c, space: 8 } }, children: [new TextRun({ text: b.name, bold: true, size: 25, color: c, font: FONT })] }));
      out.push(new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: b.description, italics: true, size: 18, color: MUTED, font: FONT })] }));
      if (b.headline) out.push(para(b.headline, { bold: true, size: 20 }));
      for (const l of b.levels) {
        out.push(
          new Paragraph({
            keepNext: true,
            spacing: { after: 40 },
            tabStops: [{ type: 'left', position: 5200 }, { type: 'left', position: 7000 }],
            children: [
              new TextRun({ text: l.label, size: 19, color: INK, font: FONT }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: '■'.repeat(l.level), color: c, size: 22, font: 'Segoe UI Symbol' }),
              new TextRun({ text: '■'.repeat(5 - l.level), color: 'E5E7EB', size: 22, font: 'Segoe UI Symbol' }),
              new TextRun({ text: `\t${LEVEL_TXT[l.level]}`, size: 17, color: MUTED, font: FONT }),
            ],
          }),
        );
      }
      if (b.chart) {
        const p = chart(renderChartSvg(b.chart));
        if (p) out.push(p);
      }
      b.paragraphs.forEach((p) => out.push(para(p)));
      if (b.note) out.push(para(b.note, { italics: true, size: 17, color: MUTED }));
      return out;
    }
    case 'dialog':
      return [twoColumnTable([b.leftTitle, b.rightTitle], b.pairs.map((p) => [`“${p.instead}”`, `“${p.tryThis}”`] as [string, string]), accent, true), new Paragraph({ spacing: { after: 120 } })];
    case 'plan':
      return [twoColumnTable(['Dönem', 'Yapılacaklar'], b.rows.map((r) => [`${r.period}: ${r.title}`, r.text] as [string, string]), accent), new Paragraph({ spacing: { after: 120 } })];
    case 'table':
      return [twoColumnTable(b.head, b.rows, accent), new Paragraph({ spacing: { after: 120 } })];
    case 'chart': {
      const p = chart(renderChartSvg(b.chart));
      return [...(p ? [p] : []), ...(b.caption ? [para(b.caption, { italics: true, size: 17, color: MUTED })] : [])];
    }
    default:
      return [];
  }
}

function sectionToDocx(s: Section, accentHex: string, first: boolean): (Paragraph | Table)[] {
  const color = s.audience === 'general' ? accentHex : AUD[s.audience];
  const out: (Paragraph | Table)[] = [];
  if (s.newPage !== false && !first) out.push(new Paragraph({ children: [new PageBreak()] }));
  if (AUD_LABEL[s.audience]) out.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: AUD_LABEL[s.audience], bold: true, size: 16, color, font: FONT })] }));
  out.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: s.kicker, bold: true, size: 16, color, font: FONT, characterSpacing: 20 })] }));
  out.push(new Paragraph({ spacing: { after: 220 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color, space: 4 } }, children: [new TextRun({ text: s.title, bold: true, size: 36, color: '111827', font: SERIF })] }));
  for (const b of s.blocks) out.push(...blockToDocx(b, color));
  return out;
}

export async function generateReportV2Docx(r: ReportV2): Promise<Buffer> {
  const accent = hex(r.accent);
  const s = r.student;
  const coverInfo: [string, string][] = [['Öğrenci', s.fullName]];
  const gl = [s.grade ? `${s.grade}. sınıf` : '', s.age ? `${s.age} yaş` : ''].filter(Boolean).join(' · ');
  if (gl) coverInfo.push(['Sınıf / Yaş', gl]);
  if (s.school) coverInfo.push(['Okul', s.school]);
  if (s.target) coverInfo.push(['Hedef', s.target]);
  coverInfo.push(['Değerlendirme tarihi', r.dateLabel]);
  coverInfo.push(['Uygulanan değerlendirmeler', r.tests.map((t) => t.name).join('\n')]);

  const cover: (Paragraph | Table)[] = [
    shadedBox(
      [
        new Paragraph({ children: [new TextRun({ text: 'EĞİTİM CHECK-UP', bold: true, size: 16, color: 'FFFFFF', font: FONT })], spacing: { after: 600 } }),
        new Paragraph({ children: [new TextRun({ text: r.title, bold: true, size: 48, color: 'FFFFFF', font: SERIF })], spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: r.subtitle, size: 22, color: 'FFFFFF', font: FONT })], spacing: { after: 300 } }),
      ],
      accent,
    ),
    new Paragraph({ spacing: { after: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { ...NO_BORDERS, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' } },
      rows: coverInfo.map(
        ([k, v]) =>
          new TableRow({
            children: [
              new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80 }, children: [new Paragraph({ children: [new TextRun({ text: k, size: 18, color: MUTED, font: FONT })] })] }),
              new TableCell({ margins: { top: 80, bottom: 80 }, children: v.split('\n').map((line, i) => new Paragraph({ children: [new TextRun({ text: line, bold: k === 'Öğrenci', size: 21, color: INK, font: FONT })], spacing: { after: i ? 0 : 20 } })) }),
            ],
          }),
      ),
    }),
    new Paragraph({ spacing: { before: 400, after: 160 }, children: [new TextRun({ text: 'BU RAPORDA', bold: true, size: 16, color: accent, font: FONT })] }),
    ...r.toc.map((t, i) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `${i + 1}   `, bold: true, color: accent, size: 20, font: FONT }), new TextRun({ text: t, size: 20, font: FONT, color: INK })] })),
    new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: 'Bu rapor kişiye özeldir ve yalnızca öğrenci, ailesi ve öğrenciyle çalışan uzman tarafından kullanılmalıdır.', size: 15, color: MUTED, font: FONT })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const body: (Paragraph | Table)[] = [];
  r.sections.forEach((sec, i) => body.push(...sectionToDocx(sec, accent, i === 0)));
  body.push(para(r.footerNote, { size: 16, color: MUTED }));

  const doc = new Document({
    creator: 'Eğitim Check-Up',
    title: `${s.fullName} — ${r.title}`,
    description: r.subtitle,
    styles: { default: { document: { run: { font: FONT, size: 21, color: INK } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1080, right: 1080 } } },
        headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: `${s.fullName} · ${r.shortTitle}`, size: 15, color: MUTED, font: FONT })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: FONT })] })] }) },
        children: [...cover, ...body],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
