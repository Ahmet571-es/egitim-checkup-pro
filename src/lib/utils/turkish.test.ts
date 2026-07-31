import { describe, it, expect } from 'vitest';
import { tamlayan, belirtme, yonelme } from './turkish';

describe('Türkçe özel ad çekimi', () => {
  it('tamlayan (ilgi) hâli — ünlü uyumu + kaynaştırma', () => {
    const cases: [string, string][] = [
      // ünsüzle biten
      ['Ayşe Yılmaz', "Ayşe Yılmaz'ın"],
      ['Mehmet', "Mehmet'in"],
      ['Zeynep', "Zeynep'in"],
      ['Burak', "Burak'ın"],
      ['Ufuk', "Ufuk'un"],
      ['Gökçe Öztürk', "Gökçe Öztürk'ün"],
      ['Işıl', "Işıl'ın"],
      // ünlüyle biten → kaynaştırma "n"
      ['Ayşe', "Ayşe'nin"],
      ['Ali', "Ali'nin"],
      ['Buğra', "Buğra'nın"],
      ['Elif Su', "Elif Su'nun"],
      ['İnci', "İnci'nin"],
      ['Öğrenci', "Öğrenci'nin"],
    ];
    for (const [input, expected] of cases) {
      expect(`${input} → ${tamlayan(input)}`).toBe(`${input} → ${expected}`);
    }
  });

  it('belirtme (yükleme) hâli', () => {
    expect(belirtme('Ayşe')).toBe("Ayşe'yi");
    expect(belirtme('Ayşe Yılmaz')).toBe("Ayşe Yılmaz'ı");
    expect(belirtme('Ufuk')).toBe("Ufuk'u");
    expect(belirtme('Ömer')).toBe("Ömer'i");
    expect(belirtme('Buğra')).toBe("Buğra'yı");
  });

  it('yönelme hâli', () => {
    expect(yonelme('Ayşe')).toBe("Ayşe'ye");
    expect(yonelme('Yılmaz')).toBe("Yılmaz'a");
    expect(yonelme('Buğra')).toBe("Buğra'ya");
    expect(yonelme('Mehmet')).toBe("Mehmet'e");
  });

  it('boş / bozuk girdide çökmez', () => {
    expect(tamlayan('')).toBe('');
    expect(tamlayan('   ')).toBe('   ');
    expect(belirtme('')).toBe('');
  });
});
