// ============================================================
// Rapor v2 — Örnek öğrenci verileri (test ve önizleme için)
// ============================================================
// Kullanıcının gönderdiği beş örnek rapordaki öğrencilere benzeyen, test
// motorlarının `_full` çıktısı biçiminde hazırlanmış örnek sonuçlar.
// Gerçek öğrenci verisi değildir.

import type { BuildInput } from '../build';

const full = (o: Record<string, unknown>) => ({ _full: o });

const enneagram = (main: number, wing: number, values: number[]) =>
  full({ normalized: Object.fromEntries(values.map((v, i) => [i + 1, v])), mainType: main, wingType: wing });

const coklu = (p: Record<string, number>) =>
  full({ version: 'lise', scores: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { raw: v, max: 100, pct: v }])) });

const vark = (V: number, A: number, R: number, K: number) => {
  const t = V + A + R + K;
  return full({ counts: { V, A, R, K }, percentages: { V: (V / t) * 100, A: (A / t) * 100, R: (R / t) * 100, K: (K / t) * 100 } });
};

const holland = (o: Record<string, number>, code: string) => full({ ...o, hollandCode: code });

const kaygi = (c: Record<string, number>, dominantType: string, typeScores: Record<string, number>) => {
  const max: Record<string, number> = { genel_kaygi: 6, hazirlik_endisesi: 6, gelecek_endisesi: 6, baskalari_gorusu: 7, kendi_gorusu: 7, bedensel_tepkiler: 7, zihinsel_tepkiler: 10 };
  const total = Object.values(c).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(max).reduce((a, b) => a + b, 0);
  return full({ categories: c, total, maxTotal, totalPct: (total / maxTotal) * 100, dominantType, typeScores });
};

const calisma = (pos: Record<string, number>) => {
  const max: Record<string, number> = { A: 16, B: 9, C: 10, D: 12, E: 7, F: 8, G: 11 };
  const tp = Object.values(pos).reduce((a, b) => a + b, 0);
  const mt = Object.values(max).reduce((a, b) => a + b, 0);
  return full({ categoriesPositive: pos, positivePct: (tp / mt) * 100 });
};

const akademik = (read: number, math: number, logic: number, self: number, kademLabel: string, weak: Record<string, number> = {}) =>
  full({
    kademLabel,
    sections: {
      '📖 Okuma Anlama': { pct: read, skillBreakdown: { ana_fikir: { correct: 3, total: 4, pct: Math.min(100, read + 10) }, cikarim: { correct: 2, total: 4, pct: weak.cikarim ?? read - 5 } } },
      '🔢 Matematiksel Muhakeme': { pct: math, skillBreakdown: { problem_cozme: { correct: 2, total: 5, pct: weak.problem_cozme ?? math - 8 }, cebir: { correct: 2, total: 4, pct: weak.cebir ?? math }, hesaplama: { correct: 4, total: 4, pct: Math.min(100, math + 20) } } },
      '🧩 Mantıksal Düşünme': { pct: logic, skillBreakdown: { analoji: { correct: 3, total: 4, pct: logic + 5 }, seri: { correct: 3, total: 4, pct: logic } } },
      '📝 Akademik Öz-Değerlendirme': { pct: self },
    },
    performanceAvg: (read + math + logic) / 3,
  });

const d2 = (cpPct: number, errorPct: number, FR: number, balance: string, rows: number[]) => full({ cpPct, hitRate: cpPct, errorPct, FR, balance, rowPerformances: rows });

export const SAMPLE_INPUTS: Record<string, BuildInput> = {
  elif: {
    kind: 'package',
    packageId: 'potansiyel-mizac',
    student: { fullName: 'Elif Kaya', grade: 9, birthDate: '2011-03-02', school: 'Anadolu Lisesi' },
    generatedAt: new Date('2026-09-12T10:00:00Z'),
    tests: [
      { test_type: 'enneagram', scores: enneagram(1, 2, [86, 74, 52, 61, 48, 58, 40, 36, 55]), date: '2026-09-12' },
      { test_type: 'coklu-zeka', scores: coklu({ sozel: 84, mantiksal: 52, gorsel: 50, muziksel: 28, dogaci: 44, sosyal: 66, bedensel: 31, icsel: 81 }), date: '2026-09-12' },
    ],
  },
  mert: {
    kind: 'package',
    packageId: 'akademik-performans',
    student: { fullName: 'Mert Aydın', grade: 7, birthDate: '2013-05-10', school: 'Devlet Ortaokulu' },
    generatedAt: new Date('2026-09-12T10:00:00Z'),
    tests: [
      { test_type: 'akademik-analiz', scores: akademik(48, 41, 71, 62, '7-8. Sınıf (Orta)', { cikarim: 35, problem_cozme: 30 }), date: '2026-09-12' },
      { test_type: 'vark', scores: vark(3, 2, 2, 7), date: '2026-09-12' },
      { test_type: 'calisma-davranisi', scores: calisma({ A: 6, B: 5, C: 6, D: 5, E: 5, F: 6, G: 5 }), date: '2026-09-12' },
      { test_type: 'coklu-zeka', scores: coklu({ sozel: 45, mantiksal: 70, gorsel: 72, muziksel: 40, dogaci: 55, sosyal: 60, bedensel: 78, icsel: 42 }), date: '2026-09-12' },
      { test_type: 'd2-dikkat', scores: d2(66, 13, 9, 'Gelişen', [72, 70, 68, 64, 70, 60, 58, 62, 55, 57, 52, 54, 50, 48]), date: '2026-09-12' },
    ],
  },
  zeynep: {
    kind: 'package',
    packageId: 'sinav-strateji',
    student: { fullName: 'Zeynep Demir', grade: 12, birthDate: '2009-01-20', school: 'Anadolu Lisesi', target: 'YKS 2027 (Sayısal)' },
    generatedAt: new Date('2026-09-12T10:00:00Z'),
    tests: [
      { test_type: 'sinav-kaygisi', scores: kaygi({ genel_kaygi: 4, hazirlik_endisesi: 5, gelecek_endisesi: 5, baskalari_gorusu: 4, kendi_gorusu: 5, bedensel_tepkiler: 4, zihinsel_tepkiler: 7 }, 'bilissel', { bilissel: 75, bedensel: 57, sosyal: 64 }), date: '2026-09-12' },
      { test_type: 'calisma-davranisi', scores: calisma({ A: 12, B: 7, C: 8, D: 8, E: 6, F: 7, G: 6 }), date: '2026-09-12' },
      { test_type: 'd2-dikkat', scores: d2(81, 6, 5, 'Dengeli', [80, 82, 79, 83, 81, 78, 80, 77, 79, 76, 74, 72, 70, 71]), date: '2026-09-12' },
      { test_type: 'akademik-analiz', scores: akademik(74, 63, 70, 52, '11-12. Sınıf (Üst)'), date: '2026-09-12' },
    ],
  },
  can: {
    kind: 'package',
    packageId: 'kariyer-gelecek',
    student: { fullName: 'Can Bulut', grade: 11, birthDate: '2009-06-14', school: 'Fen Lisesi', target: 'Sayısal alanda bölüm tercihini netleştirmek' },
    generatedAt: new Date('2026-09-12T10:00:00Z'),
    tests: [
      { test_type: 'holland', scores: holland({ R: 52, I: 63, A: 30, S: 34, E: 40, C: 48 }, 'IRC'), date: '2026-09-12' },
      { test_type: 'enneagram', scores: enneagram(5, 6, [55, 40, 58, 50, 84, 66, 45, 47, 52]), date: '2026-09-12' },
    ],
  },
  deniz: {
    kind: 'package',
    packageId: 'vip',
    student: { fullName: 'Deniz Yılmaz', grade: 11, birthDate: '2009-04-04', school: 'Anadolu Lisesi', target: 'Tıp Fakültesi (YKS 2028)' },
    generatedAt: new Date('2026-09-19T10:00:00Z'),
    tests: [
      { test_type: 'enneagram', scores: enneagram(7, 6, [45, 55, 58, 40, 50, 66, 85, 52, 49]), date: '2026-09-12' },
      { test_type: 'coklu-zeka', scores: coklu({ sozel: 55, mantiksal: 66, gorsel: 54, muziksel: 34, dogaci: 80, sosyal: 84, bedensel: 52, icsel: 50 }), date: '2026-09-12' },
      { test_type: 'akademik-analiz', scores: akademik(73, 52, 69, 78, '11-12. Sınıf (Üst)', { problem_cozme: 30, cebir: 38 }), date: '2026-09-15' },
      { test_type: 'vark', scores: vark(3, 5, 3, 5), date: '2026-09-15' },
      { test_type: 'calisma-davranisi', scores: calisma({ A: 6, B: 6, C: 7, D: 6, E: 5, F: 6, G: 5 }), date: '2026-09-15' },
      { test_type: 'd2-dikkat', scores: d2(76, 8, 6, 'Dengeli', [76, 78, 75, 77, 74, 76, 73, 75, 72, 74, 71, 73, 72, 70]), date: '2026-09-19' },
      { test_type: 'sinav-kaygisi', scores: kaygi({ genel_kaygi: 2, hazirlik_endisesi: 4, gelecek_endisesi: 3, baskalari_gorusu: 2, kendi_gorusu: 3, bedensel_tepkiler: 1, zihinsel_tepkiler: 2 }, 'bilissel', { bilissel: 44, bedensel: 14, sosyal: 36 }), date: '2026-09-19' },
      { test_type: 'holland', scores: holland({ R: 30, I: 58, A: 31, S: 64, E: 44, C: 22 }, 'SIE'), date: '2026-09-19' },
      { test_type: 'hizli-okuma', scores: full({ wpm: 238, comprehensionPct: 80, effectiveScore: 190, speedKey: 'ortalama', speedLabel: 'Ortalama', kademLabel: '11-12. Sınıf (Üst)' }), date: '2026-09-19' },
      { test_type: 'sag-sol-beyin', scores: full({ sagYuzde: 58, solYuzde: 42, dominant: 'sag' }), date: '2026-09-19' },
    ],
  },
};
