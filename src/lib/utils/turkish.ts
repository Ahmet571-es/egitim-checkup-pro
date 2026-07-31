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
