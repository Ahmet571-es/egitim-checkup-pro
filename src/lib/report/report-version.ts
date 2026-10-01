/**
 * Saklı rapor sürüm tespiti.
 *
 * Raporlar üretildikleri anda `test_results.ai_report` / `holistic_reports.report_text`
 * içine METİN olarak yazılır. Motor sonradan geliştirildiğinde ESKİ kayıtlar
 * kendiliğinden güncellenmez — kullanıcı "Görüntüle"de veya PDF'te hâlâ eski,
 * ince raporu görür. Bu, aynı üründe test bazında farklı kalite algısına yol açar
 * ("meslek testi şık ama çoklu zekâ değil").
 *
 * Burada, yeni derin rapor omurgasının bıraktığı imzalara bakarak bir raporun
 * güncel motorla mı üretildiğini anlarız.
 */

/** Derin rapor omurgasının ayırt edici imzaları. */
const DEEP_MARKERS = [
  'Neyi Ölçer, Neyi Ölçmez',   // kapsam kartı — tüm derin raporlarda var
  '[!chain',                    // neden → etki → sonuç zinciri
  '[!timeline',                 // yol haritası
  '[!quadrant',                 // konumlandırma
  '[!heatmap',                  // uyum haritası
  '[!compare',                  // referansla karşılaştırma
];

/** Yeni omurga için beklenen asgari işaret sayısı. */
const MIN_MARKERS = 2;

export interface ReportFreshness {
  /** Güncel (derin) motorla üretilmiş mi. */
  fresh: boolean;
  /** Bulunan imza sayısı. */
  markers: number;
  /** Kullanıcıya gösterilecek kısa gerekçe. */
  reason: string;
}

/** Yeni format (v2) "Bütünsel Değerlendirme Raporu" imzası. */
const V2_MARKER = '<!--ECR2:';

export function checkReportFreshness(reportText: string | null | undefined): ReportFreshness {
  const t = (reportText || '').trim();
  if (!t) return { fresh: false, markers: 0, reason: 'Rapor henüz üretilmemiş.' };

  // Yeni format raporlar her zaman günceldir.
  if (t.includes(V2_MARKER)) return { fresh: true, markers: DEEP_MARKERS.length, reason: 'Yeni rapor formatıyla üretilmiş.' };

  // Yeni format devreye girdikten sonra eski biçimli tüm raporlar "eski sürüm"
  // sayılır; öğretmen "Yenile" ile yeni formata geçirebilir.
  const markers = DEEP_MARKERS.reduce((n, m) => (t.includes(m) ? n + 1 : n), 0);
  void MIN_MARKERS;
  return {
    fresh: false,
    markers,
    reason: 'Bu rapor eski formatla üretilmiş; yenilendiğinde yeni rapor formatına (renkli grafikler, öğrenci/aile/uzman bölümleri) geçer.',
  };
}
