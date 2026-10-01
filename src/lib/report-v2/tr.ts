// ============================================================
// Rapor v2 — Türkçe ad çekimi ve şablon doldurma
// ============================================================
// Rapor metinleri öğrencinin ilk adıyla yazılır ("Elif", "Mert"). Ad, cümlede
// farklı hâl ekleri alır: Elif'in, Elif'i, Elif'e, Elif'te, Elif'ten, Elif'le.
// Metin kütüphanesi bu ekleri yer tutucularla yazar; `fill()` doldurur.
//
//   {ad}    → Elif           {adın}  → Elif'in      {adı}   → Elif'i
//   {ada}   → Elif'e         {adda}  → Elif'te      {addan} → Elif'ten
//   {adla}  → Elif'le
//
// Özel adlarda ünsüz yumuşaması yazıda gösterilmez (Zeynep'e, Mehmet'i).

const VOWELS = 'aeıioöuüâîû';
const HARD = 'çfhkpsşt';

function trLower(s: string): string {
  return s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
}

function lastVowel(word: string): string | null {
  for (let i = word.length - 1; i >= 0; i--) if (VOWELS.includes(word[i])) return word[i];
  return null;
}

function four(v: string | null): string {
  if (v === 'a' || v === 'ı' || v === 'â') return 'ı';
  if (v === 'o' || v === 'u' || v === 'û') return 'u';
  if (v === 'ö' || v === 'ü') return 'ü';
  return 'i';
}

function two(v: string | null): string {
  return v === 'a' || v === 'ı' || v === 'o' || v === 'u' || v === 'â' || v === 'û' ? 'a' : 'e';
}

export interface NameForms {
  ad: string;
  adın: string;
  adı: string;
  ada: string;
  adda: string;
  addan: string;
  adla: string;
}

/** Bir ad için tüm hâl eklerini üretir. */
export function nameForms(name: string): NameForms {
  const clean = (name || 'Öğrenci').trim() || 'Öğrenci';
  const w = trLower(clean);
  const last = w[w.length - 1] ?? '';
  const endsVowel = VOWELS.includes(last);
  const hard = HARD.includes(last);
  const v = lastVowel(w);
  const u = four(v);
  const a = two(v);
  return {
    ad: clean,
    adın: `${clean}'${endsVowel ? 'n' : ''}${u}n`,
    adı: `${clean}'${endsVowel ? 'y' : ''}${u}`,
    ada: `${clean}'${endsVowel ? 'y' : ''}${a}`,
    adda: `${clean}'${hard ? 't' : 'd'}${a}`,
    addan: `${clean}'${hard ? 't' : 'd'}${a}n`,
    adla: `${clean}'${endsVowel ? 'y' : ''}l${a}`,
  };
}

/** Tam addan ilk adı alır ("Elif Kaya" → "Elif"). */
export function firstNameOf(fullName: string | null | undefined): string {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Öğrenci';
  return parts[0];
}

/**
 * Şablondaki ad yer tutucularını doldurur.
 * Uzun anahtarlar önce değiştirilir ki "{adın}" "{ad}" ile karışmasın.
 */
export function fill(template: string, forms: NameForms): string {
  return template
    .replace(/\{addan\}/g, forms.addan)
    .replace(/\{adda\}/g, forms.adda)
    .replace(/\{adın\}/g, forms.adın)
    .replace(/\{adla\}/g, forms.adla)
    .replace(/\{adı\}/g, forms.adı)
    .replace(/\{ada\}/g, forms.ada)
    .replace(/\{ad\}/g, forms.ad);
}

/** Cümlenin ilk harfini Türkçe kurala göre büyütür. */
export function capFirst(s: string): string {
  if (!s) return s;
  const c = s[0];
  const up = c === 'i' ? 'İ' : c === 'ı' ? 'I' : c.toUpperCase();
  return up + s.slice(1);
}

/** "a, b ve c" biçiminde birleştirir. */
export function joinTr(items: string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} ve ${xs[xs.length - 1]}`;
}

/** Türkçe tarih: "12 Eylül 2026". */
export function trDate(d: Date): string {
  try {
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Kelimenin son ünlüsüne göre "da/de" bağlacı. */
export function daDe(word: string): string {
  const m = word.toLocaleLowerCase('tr-TR').match(/[aıoueiöü](?=[^aıoueiöü]*$)/);
  return m && 'aıou'.includes(m[0]) ? 'da' : 'de';
}

/** Öğeler kendi içinde "ve" taşıyorsa noktalı virgülle, değilse "ve" ile birleştirir. */
export function joinSafe(items: string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? '';
  if (!xs.some((x) => / ve /.test(x))) return joinTr(xs);
  return `${xs.slice(0, -1).join('; ')}; ayrıca ${xs[xs.length - 1]}`;
}

/** Metindeki çift boşluk, boş parantez ve noktalama hatalarını temizler. */
export function tidy(s: string): string {
  return s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/:\s*\./g, '.')
    .trim();
}

/** Öğeler kendi içinde "ve" taşıyorsa virgülle, değilse "A, B ve C" biçiminde birleştirir. */
export function joinList(items: string[]): string {
  const xs = items.filter(Boolean);
  return xs.some((x) => / ve /.test(x)) ? xs.join(', ') : joinTr(xs);
}
