/**
 * Güvenli inline HTML yardımcıları — XSS koruması.
 *
 * AI üretimi rapor içeriği (tablo hücreleri, paragraflar, özetler) tarayıcıya
 * dangerouslySetInnerHTML ile basılıyor. Öğrenci serbest-metin cevabı → AI
 * rapora aynen yazabildiği için, sanitize edilmeden basılan içerik stored-XSS
 * riski taşır (ör. cevaba gizlenmiş <img onerror=...>).
 *
 * Strateji: ÖNCE tüm HTML-özel karakterleri kaçır, SONRA sadece bizim
 * ürettiğimiz **kalın** → <strong> dönüşümünü uygula. Böylece çıktıda yalnızca
 * bizim eklediğimiz <strong>/<br> etiketleri bulunabilir; içerikteki her türlü
 * ham HTML zararsız metne dönüşür (whitelist-by-construction).
 */

/** HTML-özel karakterleri kaçırır. */
export function escapeHtml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface InlineBoldOptions {
  /** <strong> etiketine eklenecek class (dahili/güvenilir değer). */
  strongClass?: string;
  /** <strong> etiketine eklenecek inline style (dahili/güvenilir değer). */
  strongStyle?: string;
  /** true ise satır sonlarını <br/> yapar. */
  nl2br?: boolean;
}

/**
 * ÖNCE escape eder, SONRA `**kalın**` kalıbını <strong> ile sarar.
 * strongClass/strongStyle SADECE kod içinden gelen sabit/tema değerleridir,
 * kullanıcı girdisi değildir — bu yüzden escape edilmez.
 */
export function inlineBold(text: string, opts: InlineBoldOptions = {}): string {
  const cls = opts.strongClass ? ` class="${opts.strongClass}"` : '';
  const style = opts.strongStyle ? ` style="${opts.strongStyle}"` : '';

  let html = escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    `<strong${cls}${style}>$1</strong>`,
  );

  if (opts.nl2br) html = html.replace(/\n/g, '<br/>');
  return html;
}
