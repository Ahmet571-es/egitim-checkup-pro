import { describe, it, expect } from 'vitest';
import { gradeToKademe, countWords, calculateSpeedReading, KADEME_MAP } from './engine';

describe('countWords', () => {
  it('kelimeleri doğru sayar', () => {
    expect(countWords('bir iki üç')).toBe(3);
    expect(countWords('tek')).toBe(1);
  });
  it('çoklu boşluk ve baştaki/sondaki boşluğu tolere eder', () => {
    expect(countWords('  merhaba   dünya  ')).toBe(2);
    expect(countWords('a\tb\nc')).toBe(3);
  });
});

describe('gradeToKademe', () => {
  it('haritadaki her sınıf doğru kademeye eşlenir', () => {
    for (const [grade, kademe] of Object.entries(KADEME_MAP)) {
      expect(gradeToKademe(Number(grade))).toBe(kademe);
    }
  });
  it('bilinmeyen sınıf → varsayılan kademe_2', () => {
    expect(gradeToKademe(999)).toBe('kademe_2');
    expect(gradeToKademe(0)).toBe('kademe_2');
  });
});

describe('calculateSpeedReading', () => {
  const passage = {
    id: 'test',
    title: 'Test Metni',
    text: 'bir iki üç dört beş altı yedi sekiz dokuz on', // 10 kelime
    questions: [
      { id: 'q1', text: 'soru 1', answer: 'a', options: ['a', 'b', 'c'] },
      { id: 'q2', text: 'soru 2', answer: 'b', options: ['a', 'b', 'c'] },
    ],
  } as unknown as Parameters<typeof calculateSpeedReading>[1];

  it('wpm = kelime sayısı / dakika (10 kelime, 60 sn → 10 wpm)', () => {
    const r = calculateSpeedReading({ q1: 'a', q2: 'b' }, passage, 60, 'kademe_2');
    expect(r.wordCount).toBe(10);
    expect(r.wpm).toBe(10);
  });

  it('anlama yüzdesi doğru hesaplanır (1/2 doğru → %50)', () => {
    const r = calculateSpeedReading({ q1: 'a', q2: 'x' }, passage, 60, 'kademe_2');
    expect(r.correct).toBe(1);
    expect(r.total).toBe(2);
    expect(r.comprehensionPct).toBe(50);
  });

  it('tüm doğru → %100 anlama', () => {
    const r = calculateSpeedReading({ q1: 'a', q2: 'b' }, passage, 30, 'kademe_2');
    expect(r.comprehensionPct).toBe(100);
  });

  it('sıfıra bölme koruması (0 sn okuma çökmez)', () => {
    const r = calculateSpeedReading({ q1: 'a' }, passage, 0, 'kademe_2');
    expect(Number.isFinite(r.wpm)).toBe(true);
  });
});
