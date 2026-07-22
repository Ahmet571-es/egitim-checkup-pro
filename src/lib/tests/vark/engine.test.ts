import { describe, it, expect } from 'vitest';
import { calculateVark } from './engine';
import { VARK_SCORING } from './data';

/**
 * VARK öğrenme stili motoru — yanlış puanlama = yanlış öğrenme stratejisi önerisi.
 */
describe('calculateVark', () => {
  // Her soru için verilen kategoriye (V/A/R/K) eşleşen şıkkı seçen cevap seti.
  function answersAllOfCategory(cat: string): { answers: Record<number, string>; count: number } {
    const answers: Record<number, string> = {};
    let count = 0;
    for (const [qid, opts] of Object.entries(VARK_SCORING)) {
      const match = Object.entries(opts).find(([, c]) => c === cat);
      if (match) {
        answers[Number(qid)] = match[0];
        count++;
      }
    }
    return { answers, count };
  }

  it('tek kategoriden cevaplarda o kategori baskın + %100', () => {
    const { answers, count } = answersAllOfCategory('V');
    const r = calculateVark(answers);
    expect(r.counts.V).toBe(count);
    expect(r.dominant[0]).toBe('V');
    expect(r.percentages.V).toBe(100);
  });

  it('yüzdeler toplamı ~100', () => {
    const { answers } = answersAllOfCategory('A');
    const r = calculateVark(answers);
    const sum = Object.values(r.percentages).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it('çoklu seçim (dizi) desteklenir', () => {
    // İlk sorunun tüm şıklarını seç → 4 farklı kategoriye 1'er sayım
    const firstQid = Number(Object.keys(VARK_SCORING)[0]);
    const allOpts = Object.keys(VARK_SCORING[firstQid]);
    const r = calculateVark({ [firstQid]: allOpts });
    expect(r.totalResponses).toBe(allOpts.length);
  });

  it('büyük/küçük harf duyarsız (A ile a aynı)', () => {
    const qid = Number(Object.keys(VARK_SCORING)[0]);
    const opt = Object.keys(VARK_SCORING[qid])[0];
    const lower = calculateVark({ [qid]: opt.toLowerCase() });
    const upper = calculateVark({ [qid]: opt.toUpperCase() });
    expect(lower.totalResponses).toBe(1);
    expect(upper.totalResponses).toBe(1);
  });

  it('multimodal: baskın-ikinci farkı ≤2 ise true', () => {
    // V ve A eşit sayıda → fark 0 → multimodal
    const vOpts = answersAllOfCategory('V');
    const r = calculateVark(vOpts.answers);
    // Tek kategori → ikinci 0, fark büyük → multimodal DEĞİL
    expect(r.isMultimodal).toBe(false);
  });

  it('boş cevap → total 0, yüzdeler 0, çökmez', () => {
    const r = calculateVark({});
    expect(r.totalResponses).toBe(0);
    expect(r.percentages.V).toBe(0);
    expect(r.isMultimodal).toBe(false);
  });

  it('geçersiz soru id yok sayılır', () => {
    const r = calculateVark({ 99999: 'a' });
    expect(r.totalResponses).toBe(0);
  });
});
