import { describe, it, expect } from 'vitest';
import { calculateHolland } from './engine';
import { HOLLAND_QUESTIONS } from './data';

/**
 * Holland RIASEC puanlama motoru — sessiz regresyon = yanlış kariyer profili.
 * Testler gerçek HOLLAND_QUESTIONS verisinden türetilir (belirli soru değişse
 * bile geçerli kalır).
 */
describe('calculateHolland', () => {
  // Belirli bir tipe 5, diğerlerine 1 veren cevap seti üretir.
  function answersFavoring(type: string): Record<number, number> {
    const a: Record<number, number> = {};
    for (const q of HOLLAND_QUESTIONS) a[q.id] = q.type === type ? 5 : 1;
    return a;
  }

  it('baskın tip cevaplara göre doğru belirlenir (hollandCode ilk harfi)', () => {
    const r = calculateHolland(answersFavoring('R'));
    expect(r.hollandCode[0]).toBe('R');
    expect(r.R).toBeGreaterThan(r.I);
    expect(r.R).toBeGreaterThan(r.C);
  });

  it('tip puanı = o tipin soru sayısı × Likert değeri', () => {
    const r = calculateHolland(answersFavoring('A'));
    const aCount = HOLLAND_QUESTIONS.filter((q) => q.type === 'A').length;
    expect(r.A).toBe(aCount * 5);
  });

  it('hollandCode tam 3 harften oluşur ve top3 ile tutarlıdır', () => {
    const r = calculateHolland(answersFavoring('S'));
    expect(r.hollandCode).toHaveLength(3);
    expect(r.top3).toHaveLength(3);
    expect(r.hollandCode).toBe(r.top3.map((t) => t[0]).join(''));
  });

  it('sortedTypes azalan puana göre sıralı', () => {
    const r = calculateHolland(answersFavoring('E'));
    for (let i = 1; i < r.sortedTypes.length; i++) {
      expect(r.sortedTypes[i - 1][1]).toBeGreaterThanOrEqual(r.sortedTypes[i][1]);
    }
  });

  it('boş cevap → tüm tipler 0, çökmez', () => {
    const r = calculateHolland({});
    expect(r.R + r.I + r.A + r.S + r.E + r.C).toBe(0);
    expect(r.top3).toHaveLength(3);
  });

  it('string ve number anahtarlar aynı sonucu verir', () => {
    const numKeys: Record<number, number> = {};
    const strKeys: Record<string, number> = {};
    for (const q of HOLLAND_QUESTIONS) {
      numKeys[q.id] = 3;
      strKeys[String(q.id)] = 3;
    }
    expect(calculateHolland(numKeys).I).toBe(calculateHolland(strKeys).I);
  });
});
