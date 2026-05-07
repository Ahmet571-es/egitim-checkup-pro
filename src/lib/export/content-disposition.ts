/**
 * HTTP Content-Disposition header için dosya adını güvenli hâle getirir.
 *
 * Sorun: HTTP header'ları sadece ASCII (Latin-1) karakterlerini kabul eder.
 * Türkçe karakterler (ğ, ş, ı, ç, ö, ü) NextResponse'a verildiğinde
 * "Cannot convert argument to a ByteString" hatası fırlatır.
 *
 * Çözüm (RFC 5987): İki ayrı parametre ver:
 *   - `filename="..."`        — ASCII fallback (eski tarayıcılar için)
 *   - `filename*=UTF-8''...`  — UTF-8 percent-encoded (modern tarayıcılar
 *                               buradaki Türkçe karakterleri korur)
 *
 * Tüm modern tarayıcılar `filename*` parametresini tercih eder, böylece
 * indirilen dosyada `Mustafa_Akdoğan_rapor.pdf` gibi orijinal Türkçe ad korunur.
 *
 * @param filename - Türkçe karakter içerebilir, ör. "Hüseyin Çetinkaya_rapor.pdf"
 * @param disposition - 'attachment' (indir) veya 'inline' (tarayıcıda göster)
 */
export function buildContentDisposition(
  filename: string,
  disposition: 'attachment' | 'inline' = 'attachment',
): string {
  // 1. ASCII fallback: Türkçe karakterleri Latin karşılıklarına çevir,
  //    kalan ASCII-dışı karakterleri sil
  const turkishMap: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ş': 's', 'Ş': 'S',
    'ç': 'c', 'Ç': 'C',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U',
  };
  const asciiName = filename
    .replace(/[ğĞıİşŞçÇöÖüÜ]/g, (ch) => turkishMap[ch] ?? ch)
    .replace(/[^\x20-\x7E]/g, '_')      // kalan non-ASCII → _
    .replace(/"/g, '')                  // çift tırnak çıkar (header bozar)
    .replace(/[\\/]/g, '_');             // path separator karakterleri kaçır

  // 2. UTF-8 percent-encoded — RFC 5987'ye göre
  //    encodeURIComponent zaten UTF-8 + %XX formatına çeviriyor
  const utf8Encoded = encodeURIComponent(filename)
    .replace(/['()*]/g, escape);         // RFC 5987'nin extra reserved chars

  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${utf8Encoded}`;
}
