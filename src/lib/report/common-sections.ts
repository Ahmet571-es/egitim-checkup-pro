/**
 * ORTAK RAPOR BÖLÜMLERİ
 *
 * Her testin kendi analizi farklıdır; ama bir raporu üç kişi okur ve üçünün de
 * ihtiyacı bellidir:
 *   Öğretmen → sınıfta ne yapacağım, neye bakacağım
 *   Veli     → evde ne yapacağım, endişelenmeli miyim
 *   Öğrenci  → bu benim için ne demek
 *
 * Bu modül, test-bağımsız ama İÇERİĞİ TESTE GÖRE PARAMETRELİ bölümler üretir.
 * Dolgu metin değildir: her bölüm okuyucuya yeni ve uygulanabilir bilgi verir.
 *
 * Dil kuralları (tüm bölümlerde geçerli):
 *   - Yalın Türkçe, kısa cümle (≤ 18 kelime)
 *   - Kesin hüküm yok; "olabilir", "gösterebilir"
 *   - Tanı yok, etiket yok
 *   - Sayıya dayanmayan iddia yok
 */
import { insight, timelineBlock, heatmapBlock, clampPct } from './report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

// ─────────────────────────────────────────────────────────────────────────────
// 1. BİLİMSEL TEMEL
// ─────────────────────────────────────────────────────────────────────────────
export interface BilimselTemelOpts {
  modelAdi: string;
  gelistiren: string;
  yil?: string | number;
  nedirTekCumle: string;
  neyeDayanir: string;
  kanitDurumu: string;
  siniri: string;
}

/** "Bu ölçüm nereden geliyor?" — kaynağını ve sınırını yalın dille anlatır. */
export function bilimselTemel(o: BilimselTemelOpts): string {
  const P: string[] = [];
  P.push(`## 🔬 Bu Ölçüm Nereden Geliyor?\n`);
  P.push(
    `**${o.modelAdi}**, ${o.gelistiren}${o.yil ? ` (${o.yil})` : ''} tarafından geliştirilmiştir. ` +
    `${o.nedirTekCumle}\n`,
  );
  P.push(insight('note', 'Dayandığı Temel',
    `**Neyi ölçer:** ${o.neyeDayanir}\n\n` +
    `**Bilimsel durumu:** ${o.kanitDurumu}\n\n` +
    `**Sınırı:** ${o.siniri}`));
  P.push(
    `Bir modeli bilmek, sonucu doğru okumanın ilk şartıdır. Bu bölüm, ` +
    `raporun geri kalanını hangi çerçevede değerlendirmeniz gerektiğini gösterir.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ÜÇ PENCERE — aynı bulgu, üç okuyucu
// ─────────────────────────────────────────────────────────────────────────────
export interface UcPencereOpts {
  ad: string;
  /** Tek cümlelik ana bulgu — üç pencerenin de dayandığı nokta. */
  anaBulgu: string;
  ogretmen: { yarin: string[]; kacin: string[] };
  veli: { buHafta: string[]; kacin: string[] };
  ogrenci: { deneyebilir: string[]; hatirlat: string };
}

/**
 * Raporun en pratik bölümü: aynı bulgunun üç okuyucu için karşılığı.
 * "Yarın ne yapayım?" sorusuna doğrudan cevap verir.
 */
export function ucPencere(o: UcPencereOpts): string {
  const P: string[] = [];
  P.push(`## 👥 Üç Pencereden Aynı Sonuç\n`);
  P.push(
    `Aynı bulgu, okuyan kişiye göre farklı bir eyleme dönüşür. Ana bulgu: ` +
    `**${o.anaBulgu}**\n`,
  );

  P.push(insight('strength', '👩‍🏫 Öğretmen — Yarın Denenebilecekler',
    o.ogretmen.yarin.map((x) => `• ${x}`).join('\n') +
    `\n\n**Kaçınılabilecekler:**\n` + o.ogretmen.kacin.map((x) => `• ${x}`).join('\n')));

  P.push(insight('action', '👨‍👩‍👦 Veli — Bu Hafta Denenebilecekler',
    o.veli.buHafta.map((x) => `• ${x}`).join('\n') +
    `\n\n**Kaçınılabilecekler:**\n` + o.veli.kacin.map((x) => `• ${x}`).join('\n')));

  P.push(insight('note', `🎓 Öğrenci — ${o.ad} İçin`,
    o.ogrenci.deneyebilir.map((x) => `• ${x}`).join('\n') +
    `\n\n*${o.ogrenci.hatirlat}*`));

  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SINIFTA GÖZLENEBİLECEK İŞARETLER
// ─────────────────────────────────────────────────────────────────────────────
export interface GozlemOpts {
  ad: string;
  /** Sonucu DESTEKLEYEN gözlemler — görülürse bulgu güçlenir. */
  destekleyen: string[];
  /** Sonuçla ÇELİŞEN gözlemler — görülürse sonuç yeniden değerlendirilmeli. */
  celisen: string[];
}

/**
 * Test bir kez ölçer; öğretmen her gün gözlemler. Bu bölüm, sonucu sınıf
 * gözlemiyle doğrulamayı (veya çürütmeyi) mümkün kılar — raporu tek başına
 * doğru kabul etmek yerine sınanabilir hâle getirir.
 */
export function gozlemListesi(o: GozlemOpts): string {
  const P: string[] = [];
  P.push(`## 🔍 Sınıfta Neye Bakılmalı?\n`);
  P.push(
    `Test tek bir oturumu ölçer; öğretmen ise ${belirtme(o.ad)} her gün görür. ` +
    `Aşağıdaki işaretler, bu raporun doğru okunup okunmadığını sınamanızı sağlar.\n`,
  );
  P.push(insight('strength', 'Sonucu Destekleyen İşaretler',
    o.destekleyen.map((x) => `• ${x}`).join('\n') +
    `\n\nBunları görüyorsanız bulgu güçleniyor demektir.`));
  P.push(insight('risk', 'Sonuçla Çelişen İşaretler',
    o.celisen.map((x) => `• ${x}`).join('\n') +
    `\n\nBunları sık görüyorsanız test o günkü hâli yansıtmış olabilir. ` +
    `Testi bir süre sonra tekrarlamak yerinde olur.`));
  P.push(
    `**Kural:** Gözlem ile test çelişirse, **gözlem önceliklidir**. ` +
    `Rapor bir başlangıç noktasıdır; son söz sizindir.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AKADEMİK YANSIMA — ders bazında beklenti
// ─────────────────────────────────────────────────────────────────────────────
export interface AkademikYansimaOpts {
  ad: string;
  /** [ders, uyum 0-100, kısa açıklama] */
  dersler: [string, number, string][];
  cerceve?: string;
}

/** Bulgunun ders bazında ne anlama geldiğini gösterir. */
export function akademikYansima(o: AkademikYansimaOpts): string {
  const P: string[] = [];
  P.push(`## 📚 Derslere Yansıma\n`);
  P.push(
    o.cerceve ||
    `Aşağıdaki tablo, bulgunun ders bazında ne anlama gelebileceğini gösterir. ` +
    `Yüksek değer o dersin mevcut profille **daha kolay eşleşebileceğini**; düşük değer ` +
    `**farklı bir giriş yolu gerekebileceğini** anlatır. Başarı tahmini değildir.\n`,
  );
  const sorted = [...o.dersler].sort((a, b) => b[1] - a[1]);
  P.push(heatmapBlock('Ders × Uyum Göstergesi', ['Uyum'],
    sorted.map(([d, v]) => [d, [clampPct(v)]] as [string, number[]]),
    'Bu tablo bir ölçüm değil, profilden türetilmiş bir göstergedir.'));
  P.push(`| Ders | Uyum | Ne anlama gelir |\n|---|---|---|`);
  P.push(sorted.map(([d, v, aciklama]) => `| ${d} | %${clampPct(v)} | ${aciklama} |`).join('\n') + '\n');
  const en = sorted[0], az = sorted[sorted.length - 1];
  P.push(
    `${tamlayan(o.ad)} profiline en kolay eşleşen alan **${en[0].toLocaleLowerCase('tr')}**; ` +
    `en çok strateji desteği gerekebilecek alan **${az[0].toLocaleLowerCase('tr')}**. ` +
    `İkincisi bir zayıflık değil, **farklı bir yöntem gerektiren** alandır.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. İLERLEME TAKİBİ
// ─────────────────────────────────────────────────────────────────────────────
export interface IlerlemeOpts {
  ad: string;
  /** 4. hafta neye bakılacak */
  hafta4: string;
  /** 8. hafta neye bakılacak */
  hafta8: string;
  /** 12. hafta / dönem sonu */
  hafta12: string;
  /** Ölçülebilir tek gösterge — "şu sayı düşerse işe yarıyor" */
  olcut: string;
}

/**
 * Öneri vermek kolaydır; işe yarayıp yaramadığını ölçmek zordur.
 * Bu bölüm somut kontrol noktaları ve tek bir ölçülebilir gösterge verir.
 */
export function ilerlemeTakibi(o: IlerlemeOpts): string {
  const P: string[] = [];
  P.push(`## 📈 İşe Yarıyor mu? — İlerleme Takibi\n`);
  P.push(
    `Bir öneri ancak ölçülürse işe yarar. Aşağıdaki kontrol noktaları, ` +
    `uygulanan planın sonuç verip vermediğini görmenizi sağlar.\n`,
  );
  P.push(timelineBlock('Kontrol Noktaları', [
    ['4. hafta — ilk sinyal', o.hafta4, 'erken'],
    ['8. hafta — alışkanlık', o.hafta8, 'orta'],
    ['12. hafta — kalıcılık', o.hafta12, 'dönem sonu'],
  ]));
  P.push(insight('action', 'Tek Ölçüt',
    `${o.olcut}\n\nBu tek göstergeyi takip etmek, on farklı şeyi aynı anda ölçmeye çalışmaktan daha etkilidir.`));
  P.push(
    `Değişim görülmezse plan yanlış değil, **süre yetersiz** olabilir. ` +
    `Alışkanlıklar genelde 6–8 haftada yerleşir; erken vazgeçmemek gerekir.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SIK SORULAN SORULAR — veli odaklı
// ─────────────────────────────────────────────────────────────────────────────
export interface SSSOpts {
  ad: string;
  /** [soru, cevap] — teste özel 3-4 soru */
  sorular: [string, string][];
}

/**
 * Velinin aklına ilk gelen soruları, sorulmadan cevaplar.
 * Rehberlik görüşmelerinde en çok tekrarlanan sorular buraya konur.
 */
export function sikSorulanlar(o: SSSOpts): string {
  const P: string[] = [];
  P.push(`## ❓ Sık Sorulan Sorular\n`);
  const ortak: [string, string][] = [
    ['Bu sonuç değişir mi?',
     `Evet. Ölçülen özellikler gelişime açıktır ve desteklendikçe değişir. ` +
     `Sonucu sabit bir etiket değil, bugünkü fotoğraf olarak okumak doğrudur.`],
    ['Çocuğuma bu sonucu söylemeli miyim?',
     `Söylenebilir — ama etiket olarak değil, güçlü yönünü fark ettirmek için. ` +
     `Etiket cümlesi ("şusun" demek) yerine gözlem cümlesi ("şu konuda rahat görünüyorsun, deneyelim mi?") daha yararlıdır.`],
    ['Sonuç beklediğimden farklı çıktı, ne yapmalıyım?',
     `Testin o günkü hâli yansıttığını unutmayın. Uyku, kaygı ve motivasyon sonucu etkiler. ` +
     `Gözleminiz raporla çelişiyorsa gözleminize güvenin ve öğretmenle paylaşın.`],
  ];
  const hepsi = [...o.sorular, ...ortak];
  for (const [s, c] of hepsi) {
    P.push(`**${s}**\n\n${c}\n`);
  }
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GELECEK PENCERESİ
// ─────────────────────────────────────────────────────────────────────────────
export interface GelecekOpts {
  ad: string;
  /** Bu profilin uzun vadede işine yarayabileceği durumlar */
  guclu: string[];
  /** Geliştirilmesi uzun vadede fayda sağlayacak yönler */
  gelistirilecek: string[];
  /** İlişkili alan/meslek ipuçları — yönlendirme değil, sohbet başlatıcı */
  alanlar?: string[];
}

/**
 * Okul dönemi biter, özellikler kalır. Bu bölüm bulgunun okul dışına —
 * üniversite, iş hayatı, günlük yaşam — nasıl uzandığını gösterir.
 */
export function gelecekPenceresi(o: GelecekOpts): string {
  const P: string[] = [];
  P.push(`## 🔭 Okuldan Sonrası — Uzun Vadeli Bakış\n`);
  P.push(
    `Okul dönemi geçicidir; ölçülen özellikler ise ${yonelme(o.ad)} yıllarca eşlik eder. ` +
    `Bu bölüm, bugünkü bulgunun ileride nerelerde işe yarayabileceğini gösterir.\n`,
  );
  P.push(insight('strength', 'Uzun Vadede Avantaja Dönüşebilecek Yönler',
    o.guclu.map((x) => `• ${x}`).join('\n')));
  P.push(insight('action', 'Şimdiden Geliştirilirse Fark Yaratacak Yönler',
    o.gelistirilecek.map((x) => `• ${x}`).join('\n')));
  if (o.alanlar?.length) {
    P.push(insight('note', 'İlişkili Alanlar', o.alanlar.join(' · ')));
    P.push(
      `Bu alanlar bir yönlendirme değil, **sohbet başlatıcıdır**. Meslek seçimi; ilgi, ` +
      `yetenek, değerler ve koşullar birlikte değerlendirilerek yapılır.\n`,
    );
  }
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. REHBERLİK GÖRÜŞMESİ İÇİN HAZIR SORULAR
// ─────────────────────────────────────────────────────────────────────────────
export interface GorusmeOpts {
  ad: string;
  /** Öğrenciyle konuşurken açılış soruları */
  acilis: string[];
  /** Bulguyu derinleştiren sorular */
  derinlestiren: string[];
  /** Eyleme geçiren kapanış soruları */
  kapanis: string[];
}

/**
 * Rapor okunur, sonra "peki şimdi ne konuşacağım?" sorusu gelir.
 * Bu bölüm, öğretmen veya rehber öğretmenin doğrudan kullanabileceği,
 * bulguya bağlı somut sorular verir.
 */
export function gorusmeSorulari(o: GorusmeOpts): string {
  const P: string[] = [];
  P.push(`## 💬 Görüşme İçin Hazır Sorular\n`);
  P.push(
    `Raporu okumak bir adım; ${belirtme(o.ad)} anlamak ayrı bir adımdır. ` +
    `Aşağıdaki sorular bu bulguya göre hazırlanmıştır ve doğrudan sorulabilir.\n`,
  );
  P.push(insight('note', '1️⃣ Açılış — kapıyı aralayan sorular',
    o.acilis.map((x) => `• "${x}"`).join('\n') +
    `\n\n*Cevabı düzeltmeden, çözüm önermeden dinleyin. İlk amaç anlamak.*`));
  P.push(insight('action', '2️⃣ Derinleştirme — bulguyu sınayan sorular',
    o.derinlestiren.map((x) => `• "${x}"`).join('\n') +
    `\n\n*Bu sorular raporun doğru olup olmadığını da sınar.*`));
  P.push(insight('strength', '3️⃣ Kapanış — eyleme geçiren sorular',
    o.kapanis.map((x) => `• "${x}"`).join('\n') +
    `\n\n*Kararı öğrenci verirse uygulama şansı artar.*`));
  P.push(
    `**Not:** Bu sorular bir sınav değildir. Amaç, ${tamlayan(o.ad)} kendi ` +
    `deneyimini kendi cümleleriyle anlatmasına alan açmaktır.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RAPORU DOĞRU OKUMA KILAVUZU
// ─────────────────────────────────────────────────────────────────────────────
export interface OkumaKilavuzuOpts {
  ad: string;
  /** Bu rapordaki en önemli tek bulgu */
  anaMesaj: string;
  /** Sık yapılan yanlış okuma biçimleri */
  yanlisOkumalar: [string, string][];
}

/**
 * En iyi rapor bile yanlış okunursa zarar verir. Bu bölüm, bu tip raporlarda
 * en sık yapılan yorum hatalarını önceden kapatır.
 */
export function okumaKilavuzu(o: OkumaKilavuzuOpts): string {
  const P: string[] = [];
  P.push(`## 🧭 Bu Raporu Doğru Okumak\n`);
  P.push(`Bir rapor yanlış okunduğunda faydadan çok zarar verebilir. En sık yapılan yorum hataları:\n`);
  P.push(`| Yanlış okuma | Doğrusu |\n|---|---|`);
  P.push(o.yanlisOkumalar.map(([y, d]) => `| ${y} | ${d} |`).join('\n') + '\n');
  P.push(insight('strength', 'Bu Rapordan Akılda Kalması Gereken Tek Şey', o.anaMesaj));
  P.push(
    `Rapor bir **başlangıç noktasıdır**, bir hüküm değil. ${tamlayan(o.ad)} ` +
    `bugünkü hâlini gösterir; yarınını değil.\n`,
  );
  P.push('---\n');
  return P.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// BÜTÇELİ EKLEME — hedef uzunluğa göre bölüm seçimi
// ─────────────────────────────────────────────────────────────────────────────
/** Hedef rapor uzunluğu (karakter). */
export const HEDEF_UZUNLUK = 18000;

/**
 * Bölümleri öncelik sırasına göre ekler; hedef uzunluğa ulaşınca durur.
 * Böylece kısa raporlar zenginleşir, zaten uzun olanlar şişmez.
 *
 * @param mevcut  Şu ana kadar üretilmiş rapor metni
 * @param adaylar Öncelik sırasına göre bölüm üreticileri (lazy — sadece
 *                gerekirse çalışır)
 * @param hedef   Hedef uzunluk
 */
export function butceliEkle(
  mevcut: string,
  adaylar: Array<() => string>,
  hedef: number = HEDEF_UZUNLUK,
): string[] {
  const eklenen: string[] = [];
  let uzunluk = mevcut.length;
  for (const uret of adaylar) {
    if (uzunluk >= hedef) break;
    const bolum = uret();
    if (!bolum) continue;
    eklenen.push(bolum);
    uzunluk += bolum.length;
  }
  return eklenen;
}
