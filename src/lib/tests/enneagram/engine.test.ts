import { describe, it, expect } from 'vitest';
import { calculateEnneagram, getAllEnneagramQuestions } from './engine';

/**
 * Enneagram kişilik motoru — yanlış ana tip = yanlış kişilik yorumu.
 * Cevaplar gerçek soru listesinden (getAllEnneagramQuestions) türetilir.
 */
describe('calculateEnneagram', () => {
  const questions = getAllEnneagramQuestions();

  // Belirli tipe 5, diğerlerine 1 veren cevap seti.
  function answersFavoring(tip: number): Record<string, number> {
    const a: Record<string, number> = {};
    for (const q of questions) a[q.id] = q.tip === tip ? 5 : 1;
    return a;
  }

  it('ana tip cevaplara göre doğru belirlenir', () => {
    for (const target of [1, 4, 5, 9]) {
      const r = calculateEnneagram(answersFavoring(target));
      expect(r.mainType).toBe(target);
    }
  });

  it('normalized değerler 0-100 aralığında', () => {
    const r = calculateEnneagram(answersFavoring(3));
    for (let t = 1; t <= 9; t++) {
      expect(r.normalized[t]).toBeGreaterThanOrEqual(0);
      expect(r.normalized[t]).toBeLessThanOrEqual(100);
    }
  });

  it('ana tip, en yüksek ham puana sahip tiptir', () => {
    const r = calculateEnneagram(answersFavoring(7));
    const maxScore = Math.max(...Object.values(r.scores));
    expect(r.scores[r.mainType]).toBe(maxScore);
  });

  it('kanat mantığı: tip 1 → komşuları 9/2, tip 9 → 8/1', () => {
    const r1 = calculateEnneagram(answersFavoring(1));
    expect([9, 2]).toContain(r1.wingType);
    const r9 = calculateEnneagram(answersFavoring(9));
    expect([8, 1]).toContain(r9.wingType);
  });

  it('sortedScores azalan sırada', () => {
    const r = calculateEnneagram(answersFavoring(6));
    for (let i = 1; i < r.sortedScores.length; i++) {
      expect(r.sortedScores[i - 1][1]).toBeGreaterThanOrEqual(r.sortedScores[i][1]);
    }
  });

  it('boş cevap → çökmez, 9 tip de 0', () => {
    const r = calculateEnneagram({});
    for (let t = 1; t <= 9; t++) expect(r.scores[t]).toBe(0);
  });
});
