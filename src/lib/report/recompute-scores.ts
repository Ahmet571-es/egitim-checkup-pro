/**
 * Ham cevaplardan ZENGİN skor yeniden hesaplama.
 *
 * SORUN:
 * `14bddc5` öncesinde TestPlayer, motorun calculate() çıktısını DEĞİL, ekranda
 * gösterilen düzleştirilmiş değerleri kaydediyordu. Canlıda doğrulandı:
 *
 *   holland     → { A, C, E, I, R, S }              (tesadüfen builder'a uyuyor)
 *   coklu-zeka  → { sozel, gorsel, sosyal }         (8 zekâdan yalnızca 3)
 *   enneagram   → { "Tip 1", "Tip 2", ... }         (9 tipten 5'i, üstelik metin)
 *
 * Bu kayıtlarda `_full` yok. Detaylı rapor üreticileri gerekli alanları
 * bulamadığı için JENERİK yedeğe düşüyor ve 650-700 karakterlik özet çıkıyor.
 * Raporu "Yenile" ile yeniden üretmek İŞE YARAMIYOR — kaynak veri eksik.
 *
 * ÇÖZÜM:
 * `test_results.raw_answers` bozulmadan duruyor. Rapor üretmeden önce skoru
 * ham cevaplardan yeniden hesaplayıp zengin nesneyi elde ediyoruz. Böylece
 * eski kayıtlar da tam derinlikte rapor üretebiliyor — veritabanına dokunmadan.
 */

type Raw = Record<string | number, string | number | string[]>;
type Scores = Record<string, unknown>;

/** Ham cevap nesnesi kullanılabilir mi (boş değil mi). */
function usable(raw: unknown): raw is Raw {
  return !!raw && typeof raw === 'object' && Object.keys(raw as object).length > 0;
}

/**
 * Ham cevaplardan zengin skoru üretir. Üretemezse `null` döner ve
 * çağıran taraf saklı skorla devam eder.
 */
export async function recomputeRichScores(
  testType: string,
  rawAnswers: unknown,
): Promise<Scores | null> {
  if (!usable(rawAnswers)) return null;
  const raw = rawAnswers;

  try {
    switch (testType) {
      case 'sag-sol-beyin': {
        const { calculateSagSolBeyin } = await import('@/lib/tests/sag-sol-beyin/engine');
        return calculateSagSolBeyin(raw as Record<string, string>) as unknown as Scores;
      }
      case 'vark': {
        const { calculateVark } = await import('@/lib/tests/vark/engine');
        return calculateVark(raw as Record<string, string>) as unknown as Scores;
      }
      case 'holland': {
        const { calculateHolland } = await import('@/lib/tests/holland/engine');
        return calculateHolland(raw as Record<string, number>) as unknown as Scores;
      }
      case 'enneagram': {
        const { calculateEnneagram } = await import('@/lib/tests/enneagram/engine');
        return calculateEnneagram(raw as Record<string, number>) as unknown as Scores;
      }
      case 'coklu-zeka': {
        const { calculateCokluZekaLise } = await import('@/lib/tests/coklu-zeka/engine');
        return calculateCokluZekaLise(raw as Record<string, number>) as unknown as Scores;
      }
      case 'sinav-kaygisi': {
        const { calculateSinavKaygisi } = await import('@/lib/tests/sinav-kaygisi/engine');
        return calculateSinavKaygisi(raw as Record<string, string>) as unknown as Scores;
      }
      case 'calisma-davranisi': {
        const { calculateCalismaDavranisi } = await import('@/lib/tests/calisma-davranisi/engine');
        return calculateCalismaDavranisi(raw as Record<string, string>) as unknown as Scores;
      }
      case 'akademik-analiz': {
        const { calculateAkademik } = await import('@/lib/tests/akademik-analiz/engine');
        return calculateAkademik(raw as Record<string, string>) as unknown as Scores;
      }
      // d2-dikkat / burdon-dikkat / hizli-okuma: calculate() ham cevap değil,
      // oturum nesnesi (satır/bölüm yanıtları, süre) ister. Bunlar raw_answers'tan
      // güvenilir şekilde geri kurulamaz; saklı skorla devam edilir.
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Rapor üretimi için en iyi skor kaynağını seçer.
 *
 * Saklı skorda `_full` varsa (yeni format) doğrudan kullanılır.
 * Yoksa ham cevaplardan yeniden hesaplanmaya çalışılır.
 * O da olmazsa saklı skorla devam edilir.
 */
export async function bestScoresForReport(
  testType: string,
  storedScores: unknown,
  rawAnswers: unknown,
): Promise<{ scores: Scores; source: 'stored_full' | 'recomputed' | 'stored_flat' }> {
  const stored = (storedScores && typeof storedScores === 'object' ? storedScores : {}) as Scores;

  if (stored._full && typeof stored._full === 'object') {
    return { scores: stored, source: 'stored_full' };
  }

  const rich = await recomputeRichScores(testType, rawAnswers);
  if (rich) {
    // Detaylı üreticiler `_full` altında zengin nesneyi bekliyor.
    return { scores: { ...stored, _full: rich }, source: 'recomputed' };
  }

  return { scores: stored, source: 'stored_flat' };
}
