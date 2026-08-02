/**
 * Türkçe özel ad çekimi — ünlü uyumu + kaynaştırma harfi.
 *
 * Raporlarda öğrenci adına ek getirilirken kullanılır. Önceden ekler sabit
 * yazılıyordu (`${name}'in`), bu da "Ayşe Yılmaz'in", "Buğra'in" gibi
 * yanlış çıktılar üretiyordu. Doğrusu "Yılmaz'ın", "Buğra'nın".
 *
 * Kurallar:
 * - Ek, adın SON SÖZCÜĞÜNÜN son ünlüsüne göre uyum sağlar.
 * - Ad ünlüyle bitiyorsa kaynaştırma harfi girer (tamlayanda "n", ötekilerde "y").
 * - Özel adlarda ünsüz yumuşaması YAZIDA gösterilmez (Mehmet'i, Zeynep'e) —
 *   bu yüzden yumuşatma uygulanmaz.
 */

const VOWELS = 'aeıioöuüâîû';

/** Türkçe'ye duyarlı küçültme (I → ı, İ → i). */
function trLower(s: string): string {
  return s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
}

/** Ekin uyacağı sözcük: adın son sözcüğü (ör. "Ayşe Yılmaz" → "Yılmaz"). */
function lastWord(name: string): string {
  const parts = trLower(name.trim()).split(/[\s\u00A0]+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

/** Sözcüğün son ünlüsü; yoksa null. */
function lastVowel(word: string): string | null {
  for (let i = word.length - 1; i >= 0; i--) {
    if (VOWELS.includes(word[i])) return word[i];
  }
  return null;
}

/** Son harf ünlü mü (kaynaştırma harfi gerekir mi). */
function endsWithVowel(word: string): boolean {
  const last = word[word.length - 1];
  return !!last && VOWELS.includes(last);
}

/** Büyük ünlü uyumu — 4'lü (ı/i/u/ü). */
function dortlu(v: string | null): string {
  if (v === 'a' || v === 'ı' || v === 'â') return 'ı';
  if (v === 'o' || v === 'u' || v === 'û') return 'u';
  if (v === 'ö' || v === 'ü') return 'ü';
  return 'i'; // e, i, î ve bilinmeyen → varsayılan
}

/** Büyük ünlü uyumu — 2'li (a/e). */
function ikili(v: string | null): string {
  if (v === 'a' || v === 'ı' || v === 'o' || v === 'u' || v === 'â' || v === 'û') return 'a';
  return 'e';
}

/**
 * Tamlayan (ilgi) hâli: "Ayşe Yılmaz" → "Ayşe Yılmaz'ın", "Buğra" → "Buğra'nın".
 * Cümlede: `${tamlayan(name)} öğrenme profili`
 */
export function tamlayan(name: string): string {
  const w = lastWord(name);
  if (!w) return name;
  const u = dortlu(lastVowel(w));
  return `${name}'${endsWithVowel(w) ? 'n' : ''}${u}n`;
}

/**
 * Belirtme (yükleme) hâli: "Ayşe" → "Ayşe'yi", "Yılmaz" → "Yılmaz'ı".
 * Cümlede: `${belirtme(name)} desteklemek`
 */
export function belirtme(name: string): string {
  const w = lastWord(name);
  if (!w) return name;
  const u = dortlu(lastVowel(w));
  return `${name}'${endsWithVowel(w) ? 'y' : ''}${u}`;
}

/**
 * Yönelme hâli: "Ayşe" → "Ayşe'ye", "Yılmaz" → "Yılmaz'a".
 * Cümlede: `${yonelme(name)} önerilir`
 */
export function yonelme(name: string): string {
  const w = lastWord(name);
  if (!w) return name;
  const a = ikili(lastVowel(w));
  return `${name}'${endsWithVowel(w) ? 'y' : ''}${a}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. tekil şahıs → 3. şahıs dönüşümü
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Test veri dosyalarındaki açıklamalar öğrenciye 2. tekil şahısla yazılmıştır
 * ("güçlüsün", "kayarsın", "bakıyorsun"). Bu metinler öğretmen raporunun
 * 3. şahıs anlatımına ham karıştığında ton çakışıyordu.
 *
 * Bu dönüştürücü BİLEREK dar kapsamlıdır: yalnızca kesin tanınan ekleri
 * çevirir, tanımadığını olduğu gibi bırakır. Yanlış çevirmektense
 * dokunmamak yeğdir.
 *
 *   -ebilirsin / -abilirsin  → -ebilir / -abilir     (olabilirsin → olabilir)
 *   -yorsun                  → -yor                   (bakıyorsun → bakıyor)
 *   -rsın/-rsin/-rsun/-rsün  → -r                     (kayarsın → kayar)
 *   sıfat + -sın/-sin/...    → sıfat + " olabilir"    (güçlüsün → güçlü olabilir)
 */
export function ucuncuSahis(text: string): string {
  if (!text) return text;
  let t = text;

  // 1) yeterlilik kipi: -ebilirsin / -abilirsin → -ebilir / -abilir
  t = t.replace(/([a-zçğıöşü])(ebilir|abilir)s[ıiuü]n\b/gi, '$1$2');

  // 2) şimdiki zaman: -yorsun → -yor
  t = t.replace(/([a-zçğıöşü])yors[uü]n\b/gi, '$1yor');

  // 3) geniş zaman: -rsın/-rsin/-rsun/-rsün → -r
  t = t.replace(/([a-zçğıöşü])rs[ıiuü]n\b/gi, '$1r');

  // 4) ad/sıfat + kişi eki: "güçlüsün" → "güçlü olabilir"
  //    Yalnızca ünlüyle biten gövdelerde uygulanır; fiil çekimleriyle
  //    karışmaması için yukarıdaki kurallardan SONRA gelir.
  t = t.replace(/\b([a-zçğıöşü]*[aeıioöuü])s[ıiuü]n\b/gi, (m, stem) => {
    // "sensin", "bunun" gibi kısa zamir/edatlara dokunma
    if (stem.length < 3) return m;
    return `${stem} olabilir`;
  });

  // 5) doğrudan hitap zamiri
  t = t.replace(/\bSen\b\s+/g, '').replace(/\bsen\b\s+/g, '');

  return t;
}
