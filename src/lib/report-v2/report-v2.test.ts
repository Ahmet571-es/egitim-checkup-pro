import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildReportV2 } from './build';
import { SAMPLE_INPUTS } from './__fixtures__/samples';
import { decodeReportV2, encodeReportV2, isReportV2Text, reportV2ToMarkdown } from './serialize';
import { renderChartSvg } from './charts';
import { nameForms } from './tr';
import type { ReportV2 } from './types';

/** Rapordaki bütün metinleri tek dizide toplar. */
function allText(r: ReportV2): string {
  return JSON.stringify(r);
}

describe('rapor v2 — Türkçe ad çekimi', () => {
  test('ünlü uyumu ve ünsüz sertleşmesi', () => {
    expect(nameForms('Elif')).toMatchObject({ adın: "Elif'in", adı: "Elif'i", ada: "Elif'e", adda: "Elif'te", addan: "Elif'ten", adla: "Elif'le" });
    expect(nameForms('Can')).toMatchObject({ adın: "Can'ın", adı: "Can'ı", ada: "Can'a", adda: "Can'da", adla: "Can'la" });
    expect(nameForms('Ayşe')).toMatchObject({ adın: "Ayşe'nin", adı: "Ayşe'yi", ada: "Ayşe'ye", adla: "Ayşe'yle" });
    expect(nameForms('Mert')).toMatchObject({ adda: "Mert'te", addan: "Mert'ten" });
    expect(nameForms('Deniz')).toMatchObject({ adın: "Deniz'in", adda: "Deniz'de" });
  });
});

describe('rapor v2 — paket raporları', () => {
  for (const [key, input] of Object.entries(SAMPLE_INPUTS)) {
    test(`${key}: 8 bölümlü iskelet ve temiz metin`, () => {
      const r = buildReportV2(input);
      const ids = r.sections.map((s) => s.id);
      expect(ids).toEqual(['about', 'summary', 'results', 'holistic', 'student', 'family', 'expert', 'closing']);
      expect(r.tests.length).toBe(input.tests.length);
      const txt = allText(r);
      expect(txt).not.toMatch(/\{ad[ıinlda]*\}/); // doldurulmamış yer tutucu
      expect(txt).not.toMatch(/undefined|NaN|\[object Object\]/);
      // Her test sonucunun kendi rengi
      const colors = new Set(r.tests.map((t) => t.color));
      expect(colors.size).toBe(r.tests.length);
      // Bütünsel bölüm en az 5 alt başlık
      const holistic = r.sections.find((s) => s.id === 'holistic')!;
      expect(holistic.blocks.filter((b) => b.t === 'h3').length).toBeGreaterThanOrEqual(5);
    });
  }

  test('DMIT / genetik ifadesi raporda geçmez', () => {
    for (const input of Object.values(SAMPLE_INPUTS)) {
      const txt = allText(buildReportV2(input)).toLocaleLowerCase('tr-TR');
      expect(txt).not.toMatch(/dmit|dermatoglif|genetik (test|analiz|rapor|yatkın)/);
    }
  });
});

describe('rapor v2 — tek test raporları', () => {
  const tests = Object.values(SAMPLE_INPUTS).flatMap((i) => i.tests);
  const seen = new Set<string>();
  for (const t of tests) {
    if (seen.has(t.test_type)) continue;
    seen.add(t.test_type);
    test(`${t.test_type}: tek test raporu kurulur`, () => {
      const r = buildReportV2({ kind: 'single', tests: [t], student: { fullName: 'Ali Veli', grade: 8 } });
      expect(r.kind).toBe('single');
      expect(r.sections.find((s) => s.id === 'results')).toBeTruthy();
      const txt = allText(r);
      expect(txt).not.toMatch(/\{ad[ıinlda]*\}/);
      expect(txt).not.toMatch(/undefined|NaN/);
    });
  }

  test('eksik veride çökmez', () => {
    const r = buildReportV2({ kind: 'single', tests: [{ test_type: 'coklu-zeka', scores: { 'Sözel-Dilsel Zekâ': 70 } }], student: { fullName: '' } });
    expect(r.sections.length).toBeGreaterThan(3);
  });
});

describe('rapor v2 — saklama', () => {
  test('kodla / çöz', () => {
    const r = buildReportV2(SAMPLE_INPUTS.elif);
    const text = encodeReportV2(r);
    expect(isReportV2Text(text)).toBe(true);
    expect(text.startsWith('# ')).toBe(true);
    const back = decodeReportV2(text);
    expect(back?.student.fullName).toBe('Elif Kaya');
    expect(back?.sections.length).toBe(r.sections.length);
    expect(decodeReportV2('# eski rapor')).toBeNull();
    expect(reportV2ToMarkdown(r)).toContain('Bütünsel Değerlendirme');
  });

  test('grafikler SVG üretir', () => {
    const r = buildReportV2(SAMPLE_INPUTS.deniz);
    const charts = r.sections.flatMap((s) => s.blocks).flatMap((b) => (b.t === 'testResult' && b.chart ? [b.chart] : b.t === 'chart' ? [b.chart] : []));
    expect(charts.length).toBeGreaterThanOrEqual(8);
    for (const c of charts) expect(renderChartSvg(c)).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });
});

// Önizleme: REPORT_V2_OUT ayarlıysa örnek PDF'leri bu klasöre yazar.
const OUT = process.env.REPORT_V2_OUT;
describe.skipIf(!OUT)('rapor v2 — PDF önizleme', () => {
  test('örnek PDF\'leri yaz', async () => {
    const { generateReportV2Pdf } = await import('@/lib/export/v2/pdf');
    fs.mkdirSync(OUT!, { recursive: true });
    for (const [key, input] of Object.entries(SAMPLE_INPUTS)) {
      const r = buildReportV2(input);
      const buf = await generateReportV2Pdf(r);
      fs.writeFileSync(path.join(OUT!, `${key}.pdf`), buf);
      fs.writeFileSync(path.join(OUT!, `${key}.json`), JSON.stringify(r, null, 2));
    }
    const { generateReportV2Docx } = await import('@/lib/export/v2/docx');
    for (const key of ['elif', 'deniz']) {
      const buf = await generateReportV2Docx(buildReportV2(SAMPLE_INPUTS[key]));
      fs.writeFileSync(path.join(OUT!, `${key}.docx`), buf);
    }
  }, 120000);
});
