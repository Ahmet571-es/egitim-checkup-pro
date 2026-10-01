// ============================================================
// Test Renkleri — TEK KAYNAK
// ============================================================
// Her testin kendine ait, birbirinden açıkça ayrışan bir rengi vardır.
// Raporlar, grafikler, zaman çizelgeleri ve rozetler bu tablodan beslenir.
// Renkler renk çemberinde yaklaşık eşit aralıklarla seçildi; böylece iki test
// yan yana geldiğinde karışmaz. Yeni bir test eklenirken buraya da eklenir.
//
// Eski kayıtlarda test_type alt çizgili yazılabildiği için (coklu_zeka gibi)
// her iki yazım da desteklenir.

export const TEST_COLOR_BASE: Record<string, string> = {
  'sinav-kaygisi': '#DC2626', // kırmızı
  'hizli-okuma': '#EA580C', // turuncu
  holland: '#CA8A04', // altın sarısı
  'calisma-davranisi': '#65A30D', // limon yeşili
  'akademik-analiz': '#15803D', // zümrüt yeşili
  vark: '#0F766E', // deniz yeşili (teal)
  'burdon-dikkat': '#0284C7', // gök mavisi
  'd2-dikkat': '#1D4ED8', // koyu mavi
  'coklu-zeka': '#4338CA', // çivit
  enneagram: '#7E22CE', // mor
  'sag-sol-beyin': '#C026D3', // fuşya
  'buyuk-besli': '#DB2777', // gül pembesi (Büyük Beşli için ayrıldı)
};

/** Bilinmeyen test için nötr renk. */
export const TEST_COLOR_FALLBACK = '#64748B';

/** test_type yazımını normalize eder: "coklu_zeka" → "coklu-zeka", "b2-dikkat" → "d2-dikkat". */
export function normalizeTestType(testType: string): string {
  const t = String(testType || '').trim().toLowerCase().replace(/_/g, '-');
  if (t === 'b2-dikkat' || t === 'p2-dikkat') return 'd2-dikkat';
  return t;
}

/** Hem tireli hem alt çizgili anahtarları içeren düz tablo (eski bileşenler için). */
export const TEST_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(TEST_COLOR_BASE).flatMap(([k, v]) => [
    [k, v],
    [k.replace(/-/g, '_'), v],
  ]),
);

/** Testin rengi (yazım farklarına dayanıklı). */
export function testColor(testType: string): string {
  return TEST_COLOR_BASE[normalizeTestType(testType)] ?? TEST_COLOR_FALLBACK;
}

// ── Renk yardımcıları (grafik gölgeleri ve açık zeminler için) ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** Rengi beyazla karıştırır (amount 0 → aynı, 1 → beyaz). */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/** Rengi siyahla karıştırır (amount 0 → aynı, 1 → siyah). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
