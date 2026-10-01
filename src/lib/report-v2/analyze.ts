// ============================================================
// Rapor v2 — Test sonuçlarını seviyelere ve özelliklere çevirme
// ============================================================
// Her test motorunun zengin (`_full`) çıktısını ortak bir biçime çevirir:
//   • levels  — raporda 5 kademeli çubuk olarak gösterilen boyutlar
//   • chart   — teste özel grafik tanımı
//   • traits  — metin kütüphanesinin hangi paragrafları seçeceğini belirleyen
//               özellik etiketleri (ör. "anx_high", "st_start_low", "enn1")
//   • facts   — metinde kullanılacak sayısal/sözel ayrıntılar
//
// Seviyeler akranlarla karşılaştırma DEĞİLDİR (sitede norm verisi yok); puanın
// testin kendi ölçeği içindeki yerini gösterir. Bu yüzden metinlerde
// "ortalamanın üstünde" yerine "orta üstü" denir.

import type { ChartSpec, Level, LevelRow } from './types';
import { normalizeTestType, testColor } from '@/lib/tests/colors';

export const LEVEL_LABEL: Record<Level, string> = {
  5: 'Yüksek',
  4: 'Orta üstü',
  3: 'Orta',
  2: 'Orta altı',
  1: 'Düşük',
};

/** Eşik dizisine göre seviye: [5'in alt sınırı, 4'ün, 3'ün, 2'nin]. */
export function levelFrom(value: number, cuts: [number, number, number, number]): Level {
  if (!Number.isFinite(value)) return 3;
  if (value >= cuts[0]) return 5;
  if (value >= cuts[1]) return 4;
  if (value >= cuts[2]) return 3;
  if (value >= cuts[3]) return 2;
  return 1;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export type TraitMap = Record<string, number>;

export interface TestAnalysis {
  testId: string;
  /** Rapor içinde gösterilen test adı. */
  name: string;
  color: string;
  /** "… anlamaya çalışır." biçiminde kısa açıklama. */
  description: string;
  headline?: string;
  levels: LevelRow[];
  chart?: ChartSpec;
  traits: TraitMap;
  facts: Record<string, unknown>;
  /** Veri eksikse true (rapor bunu nazikçe belirtir). */
  partial?: boolean;
}

// ── Test adları ve açıklamaları (örnek rapor diliyle) ─────────

export const TEST_INFO: Record<string, { name: string; description: string }> = {
  enneagram: {
    name: 'Enneagram',
    description: 'Kişinin iç dünyasını harekete geçiren temel ihtiyaçları ve bu ihtiyaçlardan doğan davranış eğilimlerini anlamaya çalışır.',
  },
  'coklu-zeka': {
    name: 'Çoklu Zekâ Testi',
    description: 'Öğrencinin hangi alanlarla uğraşmaktan daha çok hoşlandığını ve öğrenirken hangi yolları daha çok tercih ettiğini anlamaya çalışır.',
  },
  vark: {
    name: 'Öğrenme Stilleri Testi',
    description: 'Kişinin yeni bilgiyi hangi yollarla almayı daha çok tercih ettiğini anlamaya çalışır.',
  },
  holland: {
    name: 'Holland Mesleki Yatkınlık Testi',
    description: 'Kişinin hangi tür iş ve çalışma ortamlarına daha çok ilgi duyduğunu anlamaya çalışır.',
  },
  'sinav-kaygisi': {
    name: 'Sınav Kaygısı Ölçme Ölçeği',
    description: 'Kişinin sınav öncesinde ve sırasında yaşadığı endişenin düzeyini ve bu endişenin nasıl ortaya çıktığını anlamaya çalışır.',
  },
  'calisma-davranisi': {
    name: 'Çalışma Davranışı Ölçme Ölçeği',
    description: 'Kişinin ders çalışırken nasıl plan yaptığını, planını ne kadar sürdürdüğünü ve çalışma ortamını nasıl düzenlediğini anlamaya çalışır.',
  },
  'akademik-analiz': {
    name: 'Akademik Analiz (Okuma / Matematik / Mantık)',
    description: 'Okuduğunu anlama, matematiksel muhakeme ve mantık yürütme becerilerinin bugünkü düzeyini anlamaya çalışır.',
  },
  'd2-dikkat': {
    name: 'D2 Dikkat Testi',
    description: 'Kişinin belirli bir süre boyunca dikkatini ne kadar hızlı ve doğru biçimde sürdürebildiğini anlamaya çalışır.',
  },
  'burdon-dikkat': {
    name: 'Burdon Dikkat Testi',
    description: 'Kişinin uzun bir tarama görevinde dikkatini ne kadar doğru sürdürdüğünü ve dikkatinin görevin hangi bölümünde dağıldığını anlamaya çalışır.',
  },
  'hizli-okuma': {
    name: 'Hızlı Okuma / Anlama Oranı Ölçümü',
    description: 'Kişinin bir metni ne kadar hızlı okuduğunu ve okuduğunu ne kadar anladığını birlikte anlamaya çalışır.',
  },
  'sag-sol-beyin': {
    name: 'Sağ-Sol Beyin Tercihi',
    description: 'Kişinin düşünürken daha çok adım adım ve çözümleyici mi, yoksa bütüncül ve sezgisel mi ilerlemeyi tercih ettiğini anlamaya çalışır.',
  },
};

export function testName(testType: string): string {
  return TEST_INFO[normalizeTestType(testType)]?.name ?? testType;
}

// ── Enneagram ────────────────────────────────────────────────

export const ENNEAGRAM_LABEL: Record<number, string> = {
  1: 'İlkeli / Mükemmeliyetçi',
  2: 'Yardımsever / Şefkatli',
  3: 'Başarı Odaklı / Hedefçi',
  4: 'Bireyci / Duyarlı',
  5: 'Araştırmacı / Gözlemci',
  6: 'Sadık / Sorgulayıcı',
  7: 'Hevesli / Maceracı',
  8: 'Güçlü / Kararlı',
  9: 'Uzlaşmacı / Barışçıl',
};

/** Kanat için kısa ek açıklama: "2 kanadı (yardımsever yönü)". */
export const ENNEAGRAM_WING_NOTE: Record<number, string> = {
  1: 'ilkeli yönü',
  2: 'yardımsever yönü',
  3: 'hedefçi yönü',
  4: 'duyarlı yönü',
  5: 'gözlemci yönü',
  6: 'sorumlu yönü',
  7: 'hevesli yönü',
  8: 'kararlı yönü',
  9: 'uzlaşmacı yönü',
};

function analyzeEnneagram(s: Record<string, unknown>): TestAnalysis {
  const normalized = obj(s.normalized);
  const raw = obj(s.scores);
  const values: number[] = [];
  for (let t = 1; t <= 9; t++) {
    let v = num(normalized[t] ?? normalized[String(t)], NaN);
    if (!Number.isFinite(v)) v = num(raw[t] ?? raw[String(t)], 0); // ham puan 20-100 aralığında
    values.push(clamp(v));
  }
  let main = Math.round(num(s.mainType, 0));
  if (main < 1 || main > 9) main = values.indexOf(Math.max(...values)) + 1;
  let wing = Math.round(num(s.wingType, 0));
  if (wing < 1 || wing > 9) {
    const ws = main === 1 ? [9, 2] : main === 9 ? [8, 1] : [main - 1, main + 1];
    wing = values[ws[0] - 1] >= values[ws[1] - 1] ? ws[0] : ws[1];
  }
  // Likert 1-5 → normalize %20-100. Seviye için bu aralık 0-100'e yayılır.
  const spread = (v: number) => clamp(((v - 20) / 80) * 100);
  const order = values.map((v, i) => ({ t: i + 1, v })).sort((a, b) => b.v - a.v);
  const levels: LevelRow[] = order.slice(0, 3).map(({ t, v }) => ({
    label: `Tip ${t} — ${ENNEAGRAM_LABEL[t]}`,
    level: levelFrom(spread(v), [75, 60, 45, 30]),
    pct: v,
  }));
  const traits: TraitMap = { [`enn${main}`]: 3, [`ennw${wing}`]: 1 };
  // Belirgin ikinci tip (ana tipe çok yakın) — metinde "ikinci güçlü eğilim" olarak geçer.
  const second = order[1];
  const closeSecond = second && second.t !== wing && values[main - 1] - second.v <= 4 ? second.t : undefined;
  return {
    testId: 'enneagram',
    name: TEST_INFO.enneagram.name,
    color: testColor('enneagram'),
    description: TEST_INFO.enneagram.description,
    headline: `Tip ${main} — ${ENNEAGRAM_LABEL[main]}, ${wing} kanadı (${ENNEAGRAM_WING_NOTE[wing]})`,
    levels,
    chart: { kind: 'enneagram', color: testColor('enneagram'), values, main, wing, title: 'Dokuz tipin dağılımı' },
    traits,
    facts: { main, wing, values, closeSecond },
  };
}

// ── Çoklu Zekâ ───────────────────────────────────────────────

export const MI_LABEL: Record<string, string> = {
  sozel: 'Sözel-dilsel',
  mantiksal: 'Mantıksal-matematiksel',
  gorsel: 'Görsel-uzamsal',
  muziksel: 'Müziksel',
  dogaci: 'Doğacı',
  sosyal: 'Kişilerarası',
  bedensel: 'Bedensel-kinestetik',
  icsel: 'İçsel',
};

function analyzeCokluZeka(s: Record<string, unknown>): TestAnalysis {
  const scores = obj(s.scores);
  const named = obj(s.scoresNamed);
  const rows: { key: string; pct: number }[] = [];
  for (const key of Object.keys(MI_LABEL)) {
    const sc = obj(scores[key]);
    let pct = num(sc.pct, NaN);
    if (!Number.isFinite(pct)) {
      const nameHit = Object.entries(named).find(([n]) => n.toLowerCase().startsWith(MI_LABEL[key].slice(0, 4).toLowerCase()));
      pct = nameHit ? num(nameHit[1], NaN) : NaN;
    }
    if (Number.isFinite(pct)) rows.push({ key, pct: clamp(pct) });
  }
  const partial = rows.length < 8;
  rows.sort((a, b) => b.pct - a.pct);
  const levels: LevelRow[] = rows.map((r) => ({ label: MI_LABEL[r.key], level: levelFrom(r.pct, [75, 60, 45, 30]), pct: r.pct }));
  const traits: TraitMap = {};
  rows.forEach((r, i) => {
    const lv = levelFrom(r.pct, [75, 60, 45, 30]);
    if (i < 2 || lv >= 4) traits[`mi_${r.key}`] = i === 0 ? 3 : i === 1 ? 2 : 1;
    if (i >= rows.length - 2 && lv <= 2) traits[`mi_low_${r.key}`] = 1;
  });
  const spread = rows.length ? rows[0].pct - rows[rows.length - 1].pct : 0;
  if (rows.length >= 6 && spread < 15) traits.mi_balanced = 1;
  // Grafik: sabit sırada (örümcek ağı eksenleri hep aynı yerde dursun)
  const fixed = Object.keys(MI_LABEL)
    .map((k) => rows.find((r) => r.key === k))
    .filter((r): r is { key: string; pct: number } => !!r)
    .map((r) => ({ label: MI_LABEL[r.key], value: r.pct }));
  return {
    testId: 'coklu-zeka',
    name: TEST_INFO['coklu-zeka'].name,
    color: testColor('coklu-zeka'),
    description: TEST_INFO['coklu-zeka'].description,
    levels,
    chart: fixed.length >= 3 ? { kind: 'radar', color: testColor('coklu-zeka'), points: fixed, title: 'Sekiz zekâ alanı' } : undefined,
    traits,
    facts: {
      order: rows.map((r) => r.key),
      top: rows.slice(0, 3).map((r) => r.key),
      // "Daha az tercih edilen" yalnızca gerçekten düşük (orta altı/düşük) alanlar
      bottom: rows.slice(-2).filter((r) => levelFrom(r.pct, [75, 60, 45, 30]) <= 2).map((r) => r.key),
    },
    partial,
  };
}

// ── VARK ─────────────────────────────────────────────────────

export const VARK_LABEL: Record<string, string> = { V: 'Görsel', A: 'İşitsel', R: 'Okuma-yazma', K: 'Kinestetik (yaparak)' };

function analyzeVark(s: Record<string, unknown>): TestAnalysis {
  const pctObj = obj(s.percentages);
  const counts = obj(s.counts);
  const total = Object.values(counts).reduce<number>((a, v) => a + num(v), 0);
  const rows = (['V', 'A', 'R', 'K'] as const).map((k) => {
    let pct = num(pctObj[k], NaN);
    if (!Number.isFinite(pct)) pct = total > 0 ? (num(counts[k]) / total) * 100 : 25;
    return { key: k, pct: clamp(pct) };
  });
  rows.sort((a, b) => b.pct - a.pct);
  // Dört seçenek: eşit dağılım %25. Seviye bu noktaya göre yorumlanır.
  const levels: LevelRow[] = rows.map((r) => ({ label: VARK_LABEL[r.key], level: levelFrom(r.pct, [38, 30, 21, 13]), pct: r.pct }));
  const traits: TraitMap = {};
  const multimodal = rows[0].pct - rows[1].pct < 6 || s.isMultimodal === true;
  traits[`vark_${rows[0].key}`] = 3;
  if (multimodal) {
    traits[`vark_${rows[1].key}`] = 2;
    traits.vark_multi = 1;
  }
  return {
    testId: 'vark',
    name: TEST_INFO.vark.name,
    color: testColor('vark'),
    description: TEST_INFO.vark.description,
    levels,
    chart: {
      kind: 'ring',
      color: testColor('vark'),
      points: (['V', 'A', 'R', 'K'] as const).map((k) => ({ label: VARK_LABEL[k].replace(' (yaparak)', ''), value: rows.find((r) => r.key === k)?.pct ?? 0 })),
      title: 'Öğrenme tercihlerinin dağılımı',
      centerLabel: multimodal ? 'Çok yönlü' : 'Baskın',
      centerValue: multimodal ? `${VARK_LABEL[rows[0].key].split(' ')[0]} + ${VARK_LABEL[rows[1].key].split(' ')[0]}` : VARK_LABEL[rows[0].key].split(' ')[0],
    },
    traits,
    facts: { dominant: rows[0].key, second: rows[1].key, multimodal, order: rows.map((r) => r.key) },
  };
}

// ── Holland ──────────────────────────────────────────────────

export const HOLLAND_LABEL: Record<string, string> = {
  R: 'Gerçekçi',
  I: 'Araştırmacı',
  A: 'Sanatsal',
  S: 'Sosyal',
  E: 'Girişimci',
  C: 'Geleneksel',
};

function analyzeHolland(s: Record<string, unknown>): TestAnalysis {
  const rows = (['R', 'I', 'A', 'S', 'E', 'C'] as const).map((k) => {
    const raw = num(s[k], 0);
    // 14 madde × Likert 1-5 → 14-70. Yüzdeye yayılır.
    const pct = raw > 0 ? clamp(((raw - 14) / 56) * 100) : 0;
    return { key: k, raw, pct };
  });
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  const levels: LevelRow[] = rows.map((r) => ({ label: HOLLAND_LABEL[r.key], level: levelFrom(r.pct, [75, 58, 42, 26]), pct: r.pct }));
  const code = typeof s.hollandCode === 'string' && /^[RIASEC]{2,3}$/.test(s.hollandCode) ? s.hollandCode : sorted.slice(0, 3).map((r) => r.key).join('');
  const traits: TraitMap = {};
  code.split('').forEach((k, i) => (traits[`hol_${k}`] = 3 - i));
  if (sorted[0].pct - sorted[5].pct < 15) traits.hol_flat = 1;
  if (sorted[0].pct < 45) traits.hol_low_interest = 1;
  return {
    testId: 'holland',
    name: TEST_INFO.holland.name,
    color: testColor('holland'),
    description: TEST_INFO.holland.description,
    headline: `Holland kodu: ${code} (${code.split('').map((k) => HOLLAND_LABEL[k]).join(' – ')})`,
    levels,
    chart: { kind: 'hexagon', color: testColor('holland'), values: rows.map((r) => ({ key: r.key, label: HOLLAND_LABEL[r.key], value: r.pct })), title: 'Altı ilgi alanı (RIASEC)' },
    traits,
    facts: { code, order: sorted.map((r) => r.key) },
  };
}

// ── Sınav Kaygısı ────────────────────────────────────────────

export const ANX_CATS: { key: string; label: string; max: number; trait: string }[] = [
  { key: 'genel_kaygi', label: 'Genel sınav kaygısı', max: 6, trait: 'anx_general' },
  { key: 'hazirlik_endisesi', label: 'Hazırlıksızlık endişesi', max: 6, trait: 'anx_prep' },
  { key: 'gelecek_endisesi', label: 'Gelecek endişesi', max: 6, trait: 'anx_future' },
  { key: 'baskalari_gorusu', label: 'Başkalarının ne düşüneceği', max: 7, trait: 'anx_others' },
  { key: 'kendi_gorusu', label: 'Kendine yönelik endişe', max: 7, trait: 'anx_self' },
  { key: 'bedensel_tepkiler', label: 'Bedensel belirtiler', max: 7, trait: 'anx_body' },
  { key: 'zihinsel_tepkiler', label: 'Sınav sırasında zihnin boşalması', max: 10, trait: 'anx_blank' },
];

function analyzeSinavKaygisi(s: Record<string, unknown>): TestAnalysis {
  const cats = obj(s.categories);
  const rows = ANX_CATS.map((c) => {
    const v = num(cats[c.key], NaN);
    const pct = Number.isFinite(v) ? clamp((v / c.max) * 100) : NaN;
    return { ...c, pct };
  }).filter((r) => Number.isFinite(r.pct));
  const totalPct = Number.isFinite(num(s.totalPct, NaN))
    ? clamp(num(s.totalPct))
    : rows.length
      ? rows.reduce((a, r) => a + r.pct, 0) / rows.length
      : 0;
  const totalLevel = levelFrom(totalPct, [75, 55, 35, 15]);
  const levels: LevelRow[] = rows.map((r) => ({ label: r.label, level: levelFrom(r.pct, [75, 55, 35, 15]), pct: r.pct }));
  const traits: TraitMap = {};
  traits[totalLevel >= 4 ? 'anx_high' : totalLevel === 3 ? 'anx_mid' : 'anx_low'] = 3;
  for (const r of rows) {
    const lv = levelFrom(r.pct, [75, 55, 35, 15]);
    if (lv >= 4) traits[r.trait] = lv === 5 ? 3 : 2;
  }
  const types = obj(s.typeScores);
  const dominantType = typeof s.dominantType === 'string' ? s.dominantType : undefined;
  if (dominantType && totalLevel >= 3) traits[`anx_type_${dominantType}`] = 1;
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  return {
    testId: 'sinav-kaygisi',
    name: TEST_INFO['sinav-kaygisi'].name,
    color: testColor('sinav-kaygisi'),
    description: TEST_INFO['sinav-kaygisi'].description,
    headline: `Genel kaygı düzeyi: ${LEVEL_LABEL[totalLevel]}`,
    levels,
    chart: {
      kind: 'gauge',
      color: testColor('sinav-kaygisi'),
      value: totalPct,
      label: LEVEL_LABEL[totalLevel],
      title: 'Genel sınav kaygısı',
      invert: true,
      zones: [
        { from: 0, to: 35, label: 'Düşük' },
        { from: 35, to: 55, label: 'Orta' },
        { from: 55, to: 75, label: 'Orta üstü' },
        { from: 75, to: 100, label: 'Yüksek' },
      ],
    },
    traits,
    facts: {
      totalPct,
      totalLevel,
      dominantType,
      typeScores: { bedensel: num(types.bedensel), bilissel: num(types.bilissel), sosyal: num(types.sosyal) },
      top: sorted.slice(0, 2).map((r) => r.key),
      low: sorted.slice(-2).map((r) => r.key),
    },
  };
}

// ── Çalışma Davranışı ────────────────────────────────────────

export const STUDY_CATS: { key: string; label: string; max: number; trait: string }[] = [
  { key: 'A', label: 'Çalışmaya başlama ve sürdürme', max: 16, trait: 'st_start' },
  { key: 'B', label: 'Bilinçli çalışma ve öğrendiğini kullanma', max: 9, trait: 'st_conscious' },
  { key: 'C', label: 'Not tutma ve dersi dinleme', max: 10, trait: 'st_notes' },
  { key: 'D', label: 'Okuma alışkanlıkları', max: 12, trait: 'st_reading' },
  { key: 'E', label: 'Ödev hazırlama', max: 7, trait: 'st_homework' },
  { key: 'F', label: 'Okula karşı tutum', max: 8, trait: 'st_attitude' },
  { key: 'G', label: 'Sınava hazırlanma ve sınava girme', max: 11, trait: 'st_exam' },
];

function analyzeCalisma(s: Record<string, unknown>): TestAnalysis {
  const pos = obj(s.categoriesPositive);
  const wrong = obj(s.categories);
  const rows = STUDY_CATS.map((c) => {
    let v = num(pos[c.key], NaN);
    if (!Number.isFinite(v) && Number.isFinite(num(wrong[c.key], NaN))) v = c.max - num(wrong[c.key]);
    const pct = Number.isFinite(v) ? clamp((v / c.max) * 100) : NaN;
    return { ...c, pct };
  }).filter((r) => Number.isFinite(r.pct));
  const overall = Number.isFinite(num(s.positivePct, NaN)) ? clamp(num(s.positivePct)) : rows.reduce((a, r) => a + r.pct, 0) / Math.max(1, rows.length);
  const cuts: [number, number, number, number] = [80, 65, 45, 25];
  const levels: LevelRow[] = rows.map((r) => ({ label: r.label, level: levelFrom(r.pct, cuts), pct: r.pct }));
  const traits: TraitMap = {};
  const ol = levelFrom(overall, cuts);
  traits[ol >= 4 ? 'st_good' : ol === 3 ? 'st_mid' : 'st_weak'] = 2;
  for (const r of rows) {
    const lv = levelFrom(r.pct, cuts);
    if (lv <= 2) traits[`${r.trait}_low`] = lv === 1 ? 3 : 2;
    if (lv >= 5) traits[`${r.trait}_high`] = 1;
  }
  const sorted = [...rows].sort((a, b) => a.pct - b.pct);
  return {
    testId: 'calisma-davranisi',
    name: TEST_INFO['calisma-davranisi'].name,
    color: testColor('calisma-davranisi'),
    description: TEST_INFO['calisma-davranisi'].description,
    headline: `Genel çalışma düzeni: ${LEVEL_LABEL[ol]}`,
    levels,
    chart: { kind: 'hbars3d', color: testColor('calisma-davranisi'), points: rows.map((r) => ({ label: r.label, value: r.pct })), title: 'Yedi alt boyutta doğru çalışma davranışı' },
    traits,
    facts: { overall, overallLevel: ol, weakest: sorted.slice(0, 2).map((r) => r.key), strongest: sorted.slice(-2).map((r) => r.key) },
  };
}

// ── Akademik Analiz ──────────────────────────────────────────

function analyzeAkademik(s: Record<string, unknown>): TestAnalysis {
  const sections = obj(s.sections);
  const find = (needle: string) => {
    const k = Object.keys(sections).find((x) => x.toLocaleLowerCase('tr-TR').includes(needle));
    return k ? obj(sections[k]) : null;
  };
  const read = find('okuma');
  const math = find('matematik');
  const logic = find('mantık') ?? find('mantik');
  const self = find('öz-değerlendirme') ?? find('öz');
  const cuts: [number, number, number, number] = [80, 65, 50, 35];
  const levels: LevelRow[] = [];
  const traits: TraitMap = {};
  const push = (label: string, sec: Record<string, unknown> | null, trait: string) => {
    if (!sec) return;
    const pct = clamp(num(sec.pct));
    const lv = levelFrom(pct, cuts);
    levels.push({ label, level: lv, pct });
    if (lv >= 4) traits[`${trait}_high`] = lv === 5 ? 2 : 1;
    if (lv <= 2) traits[`${trait}_low`] = lv === 1 ? 3 : 2;
    return pct;
  };
  push('Okuduğunu anlama', read, 'ac_read');
  push('Matematiksel muhakeme', math, 'ac_math');
  push('Mantık yürütme', logic, 'ac_logic');

  // Beceri kırılımı: en zayıf iki beceri (metinde örnek olarak geçer)
  const skillLabels: Record<string, string> = {
    detay_bulma: 'detay bulma', ana_fikir: 'ana fikir', cikarim: 'çıkarım yapma', soz_varligi: 'söz varlığı',
    yazar_tutumu: 'yazarın tutumunu anlama', karsilastirma: 'karşılaştırma', hesaplama: 'temel hesaplama',
    problem_cozme: 'problem çözme', geometri: 'geometri', veri_yorumlama: 'veri yorumlama', cebir: 'cebirsel düşünme',
    olasilik: 'olasılık', oran_orant: 'oran-orantı ve yüzde', analoji: 'analoji', seri: 'seri tamamlama',
    kiyas: 'kıyas', siralama: 'sıralama', mantiksal_cikarim: 'mantıksal çıkarım',
  };
  const skills: { key: string; label: string; pct: number; total: number }[] = [];
  for (const sec of [read, math, logic]) {
    const sb = obj(sec?.skillBreakdown);
    for (const [k, v] of Object.entries(sb)) {
      const o = obj(v);
      if (num(o.total) >= 2) skills.push({ key: k, label: skillLabels[k] ?? k.replace(/_/g, ' '), pct: clamp(num(o.pct)), total: num(o.total) });
    }
  }
  skills.sort((a, b) => a.pct - b.pct);
  const perf = num(s.performanceAvg, NaN);
  const perfAvg = Number.isFinite(perf) ? perf : levels.length ? levels.reduce((a, r) => a + (r.pct ?? 0), 0) / levels.length : 0;
  const pl = levelFrom(perfAvg, cuts);
  traits[pl === 5 ? 'ac_high' : pl === 4 ? 'ac_good' : pl === 3 ? 'ac_mid' : 'ac_low'] = 2;
  const selfPct = self ? clamp(num(self.pct)) : NaN;
  const gap = Number.isFinite(selfPct) ? selfPct - perfAvg : 0;
  if (gap > 15) traits.ac_overconf = 2;
  if (gap < -15) traits.ac_underconf = 2;
  // Okuma ile matematik arasında belirgin fark
  const r = levels.find((l) => l.label.startsWith('Okuduğunu'))?.pct ?? NaN;
  const m = levels.find((l) => l.label.startsWith('Matematik'))?.pct ?? NaN;
  if (Number.isFinite(r) && Number.isFinite(m) && m - r >= 20) traits.ac_read_behind = 1;
  if (Number.isFinite(r) && Number.isFinite(m) && r - m >= 20) traits.ac_math_behind = 1;
  return {
    testId: 'akademik-analiz',
    name: TEST_INFO['akademik-analiz'].name,
    color: testColor('akademik-analiz'),
    description: TEST_INFO['akademik-analiz'].description,
    headline: typeof s.kademLabel === 'string' ? `Uygulanan form: ${s.kademLabel.replace(/\s*\(.*?\)\s*/g, '').replace('Sınıf', 'sınıf')} düzeyi` : undefined,
    levels,
    chart: {
      kind: 'columns3d',
      color: testColor('akademik-analiz'),
      points: [
        ...levels.map((l) => ({ label: l.label.replace('Okuduğunu anlama', 'Okuma').replace('Matematiksel muhakeme', 'Matematik').replace('Mantık yürütme', 'Mantık'), value: l.pct ?? 0 })),
        ...(Number.isFinite(selfPct) ? [{ label: 'Öz-değerlendirme', value: selfPct }] : []),
      ],
      title: 'Alanlara göre başarı yüzdesi',
    },
    traits,
    facts: {
      perfAvg,
      perfLevel: pl,
      selfPct: Number.isFinite(selfPct) ? selfPct : null,
      gap,
      weakSkills: skills.slice(0, 2).map((x) => x.label),
      strongSkills: skills.slice(-2).reverse().map((x) => x.label),
      kademe: s.kademLabel,
    },
  };
}

// ── D2 Dikkat ────────────────────────────────────────────────

function analyzeD2(s: Record<string, unknown>): TestAnalysis {
  const cp = clamp(num(s.cpPct, num(s.hitRate)));
  const err = clamp(num(s.errorPct));
  const fr = Math.max(0, num(s.FR, 0));
  const rowsPerf = Array.isArray(s.rowPerformances) ? (s.rowPerformances as unknown[]).map((x) => num(x)) : [];
  const levels: LevelRow[] = [
    { label: 'Dikkat ve konsantrasyon', level: levelFrom(cp, [90, 75, 55, 35]), pct: cp },
    { label: 'Doğruluk (az hata)', level: levelFrom(100 - err, [95, 90, 80, 70]), pct: 100 - err },
    { label: 'Dikkati sürdürme', level: fr <= 3 ? 5 : fr <= 6 ? 4 : fr <= 10 ? 3 : fr <= 15 ? 2 : 1, pct: clamp(100 - fr * 5) },
  ];
  const traits = attentionTraits(levels[0].level, err, fr, typeof s.balance === 'string' ? s.balance : '');
  // Satırlar boyunca eğilim: ilk üçte bir ile son üçte bir karşılaştırılır
  let trend: 'down' | 'up' | 'flat' = 'flat';
  if (rowsPerf.length >= 6) {
    const k = Math.max(2, Math.floor(rowsPerf.length / 3));
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const a0 = avg(rowsPerf.slice(0, k));
    const a1 = avg(rowsPerf.slice(-k));
    if (a0 > 0 && (a0 - a1) / a0 > 0.12) trend = 'down';
    else if (a0 > 0 && (a1 - a0) / a0 > 0.12) trend = 'up';
  }
  if (trend === 'down') traits.att_late_drop = Math.max(traits.att_late_drop ?? 0, 1);
  // Satır performansını 0-100'e ölçekle (satır başına en yüksek değere göre)
  const maxRow = rowsPerf.length ? Math.max(...rowsPerf, 1) : 1;
  return {
    testId: 'd2-dikkat',
    name: TEST_INFO['d2-dikkat'].name,
    color: testColor('d2-dikkat'),
    description: TEST_INFO['d2-dikkat'].description,
    headline: typeof s.balance === 'string' && s.balance ? `Hız-doğruluk dengesi: ${s.balance} — ${typeof s.balanceDesc === 'string' && s.balanceDesc ? s.balanceDesc : D2_BALANCE_DESC(s.balance)}` : undefined,
    levels,
    chart: rowsPerf.length >= 4
      ? { kind: 'line', color: testColor('d2-dikkat'), points: rowsPerf.map((v, i) => ({ label: String(i + 1), value: clamp((v / maxRow) * 100) })), title: 'Satır satır dikkat performansı', yLabel: 'Satır' }
      : { kind: 'hbars3d', color: testColor('d2-dikkat'), points: levels.map((l) => ({ label: l.label, value: l.pct ?? 0 })), title: 'Dikkat göstergeleri' },
    traits,
    facts: { cp, err, fr, balance: s.balance, consistency: s.consistency, trend },
  };
}

function D2_BALANCE_DESC(balance: string): string {
  if (/^Dengeli/i.test(balance)) return 'Hem hızlı hem doğru çalışıyor.';
  if (/^Temkinli/i.test(balance)) return 'Doğruluk yüksek ama hız düşük.';
  if (/^Dürtüsel/i.test(balance)) return 'Hızlı ama hata oranı yüksek.';
  return 'Hız ve doğruluk arasında denge kuruluyor.';
}

function attentionTraits(main: Level, errPct: number, fr: number, balance: string): TraitMap {
  const t: TraitMap = {};
  t[main >= 4 ? 'att_good' : main === 3 ? 'att_mid' : 'att_low'] = 2;
  if (/Dürtüsel/i.test(balance) || errPct > 20) t.att_impulsive = 2;
  if (/Temkinli/i.test(balance)) t.att_slow = 2;
  if (fr > 10) t.att_fluct = 2;
  return t;
}

// ── Burdon Dikkat ────────────────────────────────────────────

function analyzeBurdon(s: Record<string, unknown>): TestAnalysis {
  const acc = clamp(num(s.overallAccuracy, num(s.overallScore)));
  const sections = Array.isArray(s.sections) ? (s.sections as unknown[]).map(obj) : [];
  const levels: LevelRow[] = [{ label: 'Genel dikkat doğruluğu', level: levelFrom(acc, [90, 78, 62, 45]), pct: acc }];
  sections.slice(0, 3).forEach((sec, i) => {
    const a = clamp(num(sec.accuracy, num(sec.normalizedScore)));
    levels.push({ label: `${['Başlangıç', 'Orta', 'Son'][i] ?? `${i + 1}.`} bölüm`, level: levelFrom(a, [90, 78, 62, 45]), pct: a });
  });
  const pattern = typeof s.attentionPattern === 'string' ? s.attentionPattern : '';
  const comm = num(s.totalCommission);
  const tgt = Math.max(1, num(s.totalTargets, 1));
  const traits = attentionTraits(levels[0].level, (comm / tgt) * 100, 0, '');
  if (pattern === 'sonda-dagilan') traits.att_late_drop = 2;
  if (pattern === 'basta-dagilan') traits.att_early_drop = 2;
  if (pattern === 'ortada-dagilan') traits.att_fluct = 1;
  return {
    testId: 'burdon-dikkat',
    name: TEST_INFO['burdon-dikkat'].name,
    color: testColor('burdon-dikkat'),
    description: TEST_INFO['burdon-dikkat'].description,
    headline: typeof s.patternTitle === 'string' ? `Dikkat örüntüsü: ${s.patternTitle}` : undefined,
    levels,
    chart: sections.length >= 2
      ? { kind: 'columns3d', color: testColor('burdon-dikkat'), points: levels.slice(1).map((l) => ({ label: l.label.replace(' bölüm', ''), value: l.pct ?? 0 })), title: 'Bölümlere göre dikkat doğruluğu' }
      : undefined,
    traits,
    facts: { acc, pattern },
  };
}

// ── Hızlı Okuma ──────────────────────────────────────────────

function analyzeHizliOkuma(s: Record<string, unknown>): TestAnalysis {
  const wpm = Math.max(0, num(s.wpm));
  const comp = clamp(num(s.comprehensionPct));
  const eff = Math.max(0, num(s.effectiveScore));
  const speedMap: Record<string, Level> = { cok_hizli: 5, hizli: 4, ortalama: 3, yavas: 2, cok_yavas: 1 };
  const speedLevel: Level = speedMap[String(s.speedKey)] ?? 3;
  const compLevel = levelFrom(comp, [80, 65, 50, 35]);
  const levels: LevelRow[] = [
    { label: 'Okuma hızı', level: speedLevel, pct: speedLevel * 20 },
    { label: 'Anlama oranı', level: compLevel, pct: comp },
  ];
  const traits: TraitMap = {};
  traits[speedLevel >= 4 ? 'rd_fast' : speedLevel <= 2 ? 'rd_slow' : 'rd_mid'] = 2;
  if (compLevel <= 2) traits.rd_comp_low = 2;
  if (compLevel >= 4) traits.rd_comp_high = 1;
  if (speedLevel >= 4 && compLevel <= 2) traits.rd_rushing = 2;
  // Hız göstergesi: düzeyin "çok hızlı" sınırının biraz üstünü üst sınır kabul et
  const max = Math.max(200, Math.round((wpm * 1.4) / 50) * 50);
  return {
    testId: 'hizli-okuma',
    name: TEST_INFO['hizli-okuma'].name,
    color: testColor('hizli-okuma'),
    description: TEST_INFO['hizli-okuma'].description,
    headline: `Dakikada ${Math.round(wpm)} kelime · anlama %${Math.round(comp)}`,
    levels,
    chart: {
      kind: 'speedo',
      color: testColor('hizli-okuma'),
      value: wpm,
      max,
      unit: 'kelime/dk',
      marks: [],
      title: 'Okuma hızı ve anlama',
      secondary: { label: 'Anlama', value: comp },
    },
    traits,
    facts: { wpm, comp, eff, speedLabel: s.speedLabel, kademe: s.kademLabel },
  };
}

// ── Sağ-Sol Beyin ────────────────────────────────────────────

function analyzeSagSol(s: Record<string, unknown>): TestAnalysis {
  const right = clamp(num(s.sagYuzde, 50));
  const left = clamp(num(s.solYuzde, 100 - right));
  // Seviye satırı gösterilmez: iki tarz birbirinin eksiği değildir, yalnızca tercih farkıdır.
  const levels: LevelRow[] = [];
  const diff = right - left;
  const traits: TraitMap = { [diff > 10 ? 'br_right' : diff < -10 ? 'br_left' : 'br_bal']: 2 };
  return {
    testId: 'sag-sol-beyin',
    name: TEST_INFO['sag-sol-beyin'].name,
    color: testColor('sag-sol-beyin'),
    description: TEST_INFO['sag-sol-beyin'].description,
    headline: diff > 10 ? 'Daha çok bütüncül ve sezgisel düşünmeyi tercih ediyor' : diff < -10 ? 'Daha çok adım adım ve çözümleyici düşünmeyi tercih ediyor' : 'İki düşünme tarzını dengeli biçimde kullanıyor',
    levels,
    chart: { kind: 'balance', color: testColor('sag-sol-beyin'), left: { label: 'Adım adım', value: left }, right: { label: 'Bütüncül', value: right }, title: 'Düşünme tercihi dengesi' },
    traits,
    facts: { right, left },
  };
}

// ── Giriş noktası ────────────────────────────────────────────

/**
 * Bir test sonucunu analiz eder. `scores` olarak test_results.scores verilir;
 * zengin veri `_full` altındaysa o kullanılır.
 */
export function analyzeTest(testType: string, scores: unknown): TestAnalysis | null {
  const id = normalizeTestType(testType);
  const o = obj(scores);
  const rich = o._full && typeof o._full === 'object' ? obj(o._full) : o;
  try {
    switch (id) {
      case 'enneagram':
        return analyzeEnneagram(rich);
      case 'coklu-zeka':
        return analyzeCokluZeka(rich);
      case 'vark':
        return analyzeVark(rich);
      case 'holland':
        return analyzeHolland(rich);
      case 'sinav-kaygisi':
        return analyzeSinavKaygisi(rich);
      case 'calisma-davranisi':
        return analyzeCalisma(rich);
      case 'akademik-analiz':
        return analyzeAkademik(rich);
      case 'd2-dikkat':
        return analyzeD2(rich);
      case 'burdon-dikkat':
        return analyzeBurdon(rich);
      case 'hizli-okuma':
        return analyzeHizliOkuma(rich);
      case 'sag-sol-beyin':
        return analyzeSagSol(rich);
      default:
        return null;
    }
  } catch (e) {
    console.error(`[report-v2/analyze] ${id} çözümlenemedi:`, (e as Error).message);
    return null;
  }
}

/** Birden fazla testin özelliklerini birleştirir (en güçlü değer kalır). */
export function mergeTraits(list: TestAnalysis[]): TraitMap {
  const out: TraitMap = {};
  for (const a of list) for (const [k, v] of Object.entries(a.traits)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}
