/**
 * Çalışma Davranışı — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * DİKKAT: Kategori puanı yüksek = o alanda daha çok GÜÇLÜK.
 * positivePct = genel olumlu davranış (yüksek = iyi).
 *
 * Yapısal ayrım: alanlar iki gruba okunur —
 *   TEKNİK (A,B,C,D): çalışmaya başlama, not tutma, okuma, ödev — öğrenilebilir beceriler
 *   TUTUM  (E)      : okula karşı tutum — motivasyon tarafı
 * Teknik eksikse yöntem çalışılır; tutum düşükse önce anlam ve motivasyon çalışılır.
 * İkisi karıştırılırsa doğru öneri yanlış soruna uygulanmış olur.
 */
import { CALISMA_DAVRANISI_CATEGORIES } from './data';
import type { CalismaDavranisiScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, barsBlock, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, emojisiz, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

interface Interp { level: 'high' | 'mid' | 'low'; text: string; tips: string[]; }
function pickInterp(score: number, interp: { high: { range: number[]; text: string; tips: string[] }; mid: { range: number[]; text: string; tips: string[] }; low: { range: number[]; text: string; tips: string[] } }): Interp {
  for (const lv of ['high', 'mid', 'low'] as const) {
    const it = interp[lv];
    if (score >= it.range[0] && score <= it.range[1]) return { level: lv, text: it.text, tips: it.tips };
  }
  return { level: 'mid', text: interp.mid.text, tips: interp.mid.tips };
}
// Güçlük: yüksek = kırmızı, düşük = yeşil (iyi)
const diffColor = (lv: string) => (lv === 'high' ? '🔴' : lv === 'mid' ? '🟡' : '🟢');
const diffLabel = (lv: string) => (lv === 'high' ? 'Belirgin Güçlük' : lv === 'mid' ? 'Bir Miktar Güçlük' : 'Güçlük Yok');

/**
 * Teknik beceri alanları ve tutum alanı.
 *
 * DİKKAT: Ölçekte YEDİ kategori var (A–G), beş değil:
 *   A Çalışmaya başlamak ve sürdürmek        → teknik
 *   B Bilinçli çalışmak, öğrendiğini kullanmak → teknik
 *   C Not tutmak ve dersi dinlemek            → teknik
 *   D Okuma alışkanlıkları ve teknikleri      → teknik
 *   E Ödev hazırlamak                         → teknik
 *   F OKULA KARŞI TUTUM                       → tutum
 *   G Sınavlara hazırlanmak ve sınava girmek  → teknik
 * Önceki eşleme TUTUM'u E (ödev hazırlamak) sanıyor, F ve G'yi hiç hesaba
 * katmıyordu; raporun merkezindeki teknik/tutum ayrımı yanlış alanlardan
 * hesaplanıyordu.
 */
const TEKNIK_KEYS = ['A', 'B', 'C', 'D', 'E', 'G'];
const TUTUM_KEYS = ['F'];

/** Alanların çalışma döngüsündeki yeri (0–1). Ölçüm değil; alan tanımından. */
const CYCLE_LOAD: Record<string, { derste: number; evde: number; oncesi: number }> = {
  A: { derste: 0.3, evde: 1.0, oncesi: 0.8 },   // çalışmaya başlama
  B: { derste: 0.5, evde: 1.0, oncesi: 0.7 },   // bilinçli çalışma
  C: { derste: 1.0, evde: 0.4, oncesi: 0.5 },   // not tutma / dersi dinleme
  D: { derste: 0.4, evde: 1.0, oncesi: 0.9 },   // okuma alışkanlıkları
  E: { derste: 0.3, evde: 1.0, oncesi: 0.4 },   // ödev hazırlama
  F: { derste: 0.9, evde: 0.7, oncesi: 0.6 },   // okula karşı tutum
  G: { derste: 0.4, evde: 0.7, oncesi: 1.0 },   // sınava hazırlanma
};

export function buildCalismaDavranisiDetailedReport(scores: CalismaDavranisiScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const posPct = clampPct(scores.positivePct ?? 0);

  const catList = Object.entries(scores.categories || {}).map(([k, v]) => {
    const c = CALISMA_DAVRANISI_CATEGORIES[k];
    const pct = c?.maxScore ? clampPct((v / c.maxScore) * 100) : 0; // güçlük yüzdesi
    return { key: k, info: c, score: v, pct };
  }).filter((x) => x.info).sort((a, b) => b.pct - a.pct);

  const avgDiff = (keys: string[]) => {
    const xs = catList.filter((c) => keys.includes(c.key));
    return xs.length ? clampPct(xs.reduce((a, b) => a + b.pct, 0) / xs.length) : 0;
  };
  const teknikGuclugu = avgDiff(TEKNIK_KEYS);
  const tutumGuclugu = avgDiff(TUTUM_KEYS);
  const teknikYeterlilik = clampPct(100 - teknikGuclugu);   // yüksek = iyi
  const tutum = clampPct(100 - tutumGuclugu);               // yüksek = iyi
  const catAvg = catList.length ? clampPct(catList.reduce((a, b) => a + b.pct, 0) / catList.length) : 0;

  const tabloTipi = teknikYeterlilik >= 50 && tutum >= 50 ? 'Güçlü ve istekli'
    : teknikYeterlilik >= 50 && tutum < 50 ? 'Yapabiliyor ama isteksiz'
    : teknikYeterlilik < 50 && tutum >= 50 ? 'İstekli ama yöntem eksik'
    : 'Önce motivasyon';

  const combos = scores.combinations || [];
  const worst = catList[0];
  const best = catList[catList.length - 1];
  const highCount = catList.filter((c) => pickInterp(c.score, c.info.interpretations).level === 'high').length;

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('📚 ÇALIŞMA DAVRANIŞI — DERİNLEMESİNE ANALİZ RAPORU', 'Çalışma Davranışı ve Alışkanlıkları Analizi', student));
  P.push(statGrid([
    { label: 'Genel Düzey', value: scores.level || '—', theme: posPct >= 70 ? 'success' : posPct >= 40 ? 'warning' : 'danger', icon: 'award' },
    { label: 'Olumlu Davranış', value: posPct, unit: '%', theme: 'primary', icon: 'trending' },
    { label: 'Güçlük Alanı', value: highCount, theme: highCount === 0 ? 'success' : 'info', icon: 'target' },
    { label: 'Tablo', value: tabloTipi, theme: tutum >= 50 ? 'success' : 'warning', icon: 'compass' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Bu değerlendirme, ${tamlayan(name)} **ders çalışma alışkanlıklarını** farklı alanlarda inceler: ` +
    `çalışmaya başlama, not tutma, okuma, ödev hazırlama ve okula karşı tutum. ` +
    `Bir alandaki yüksek puan, o konuda **daha çok desteğe ihtiyaç** olabileceğini gösterir.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** Çalışma alışkanlıkları ve okula karşı tutum.\n\n` +
    `**Ölçmez:** Zekâ, yetenek, çalışkanlık veya karakter. Güçlük yaşamak tembellik değildir.\n\n` +
    `Çalışma alışkanlıkları **öğrenilebilir becerilerdir**. Bu rapor bir yargı değil, ` +
    `hangi beceriyi önce çalışacağını gösteren bir yol haritasıdır.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** genel çalışma davranışı düzeyi **${scores.level} (%${posPct} olumlu)** olarak görünüyor. ` +
    `${worst ? `En çok gelişime açık alan **${worst.info.name.toLocaleLowerCase('tr')}** (%${worst.pct} güçlük). ` : ''}` +
    `${best && best.key !== worst?.key ? `En sağlam alan **${best.info.name.toLocaleLowerCase('tr')}** (%${best.pct} güçlük). ` : ''}` +
    `Tablo iki açıdan okunuyor: **teknik yeterlilik %${teknikYeterlilik}**, **okula tutum %${tutum}** — genel görünüm: **${tabloTipi.toLocaleLowerCase('tr')}**.\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL ═══
  P.push(`## 📊 2. Çalışma Davranışı Profili\n`);
  P.push(gauge('Olumlu Çalışma Davranışı', posPct, { zones: 'Zayıf:0-40,Orta:40-70,Güçlü:70-100', caption: 'Yüksek bölge daha sağlam alışkanlıkları gösterir' }));
  if (catList.length >= 3 && catList.length <= 8) {
    P.push(radarBlock('Alanlara Göre Güçlük Düzeyi (%)', catList.map((c) => [c.info.name.slice(0, 26), c.pct])));
  }
  P.push(barsBlock('Alanlara Göre Güçlük Düzeyi (%)', catList.map((c) => [c.info.name.slice(0, 28), c.pct])));
  if (catList.length >= 3) {
    P.push(donutBlock('Güçlüğün Yoğunlaştığı Alanlar', catList.slice(0, 3).map((c) => [c.info.name.slice(0, 22), c.pct]), `%${posPct}`));
  }
  P.push(`| Alan | Güçlük | Grafik | Durum |\n|---|---|---|---|`);
  P.push(catList.map((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    return `| ${c.info.name} | %${c.pct} | ${bar(c.pct)} | ${diffColor(it.level)} ${diffLabel(it.level)} |`;
  }).join('\n') + '\n');
  P.push(`> Not: Bu tabloda **yüksek yüzde = daha çok güçlük** anlamına gelir. Düşük olması iyidir.\n`);
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Bu Tablo Çıktı?\n`);
  P.push(
    `Her alan için ayrı bir madde grubu sorulur; güçlük bildirilen maddeler puanlanır. ` +
    `Asıl bilgi, hangi alanın kendi ortalamasının **üstünde** kaldığındadır — çünkü çalışma oradan başlar. ` +
    `Aşağıdaki grafik her alanı ${tamlayan(name)} kendi ortalama güçlüğüyle (%${catAvg}) karşılaştırır.\n`,
  );
  P.push(compareBlock(
    'Alanlar — Kendi Ortalama Güçlüğüyle Karşılaştırma',
    catList.map((c) => [c.info.name.slice(0, 24), c.pct, catAvg] as [string, number, number]),
    { selfLabel: first, refLabel: 'Kendi ortalaması' },
  ));
  P.push(worst
    ? `Pozitif fark, o alanda **daha çok güçlük** yaşandığını gösterir. En yüksek alan **${worst.info.name}** — çalışma buradan başlarsa genel düzelme en hızlı gelebilir.\n`
    : '');
  P.push('---\n');

  // ═══ 4. TEKNİK × TUTUM — asıl ayrım ═══
  P.push(`## 🪞 4. Teknik mi, Tutum mu? — Sorunun Kaynağı\n`);
  P.push(
    `Çalışma sorunları iki farklı kaynaktan gelir ve **ikisi farklı çözüm gerektirir**:\n\n` +
    `- **Teknik:** Nasıl çalışılacağını bilmemek. Yöntem öğretilince düzelir.\n` +
    `- **Tutum:** Çalışmayı anlamlı bulmamak. Yöntem öğretmek işe yaramaz; önce anlam ve motivasyon gerekir.\n\n` +
    `Bu ikisi karıştırıldığında, doğru öneri yanlış soruna uygulanmış olur — en sık yapılan hata budur.\n`,
  );
  P.push(quadrantBlock(
    'Teknik Yeterlilik × Okula Tutum',
    teknikYeterlilik, tutum,
    'Teknik yeterlilik', 'Okula tutum',
    ['Önce motivasyon', 'Yapabiliyor ama isteksiz', 'İstekli ama yöntem eksik', 'Güçlü ve istekli'],
    'Sağ üst çeyrek en verimli bölgedir. Sol taraf yöntem, alt taraf motivasyon çalışmasını işaret eder.',
  ));
  P.push(compareBlock(
    'İki Boyutun Karşılaştırması',
    [['Teknik yeterlilik', teknikYeterlilik, tutum]],
    { selfLabel: 'Teknik', refLabel: 'Tutum' },
  ));
  P.push(insight(
    tabloTipi === 'Güçlü ve istekli' ? 'strength' : tabloTipi === 'Önce motivasyon' ? 'risk' : 'action',
    `Tablo Okuması — ${tabloTipi}`,
    tabloTipi === 'Güçlü ve istekli'
      ? `Hem yöntem hem istek yerinde (teknik %${teknikYeterlilik} · tutum %${tutum}). ` +
        `Bu tabloda yapılacak şey mevcut düzeni korumak ve ince ayar yapmaktır. Yeni teknikler denemek pekiştirici olur.`
      : tabloTipi === 'İstekli ama yöntem eksik'
        ? `İstek var ama yöntem eksik (teknik %${teknikYeterlilik} · tutum %${tutum}). ` +
          `Bu en kolay düzelen tablodur: somut çalışma teknikleri öğretildiğinde hızlı sonuç alınabilir. ` +
          `Motivasyon konuşmasına gerek yok — doğrudan yönteme geçilebilir.`
        : tabloTipi === 'Yapabiliyor ama isteksiz'
          ? `Yöntemi biliyor ama istek düşük (teknik %${teknikYeterlilik} · tutum %${tutum}). ` +
            `Bu tabloda teknik öneri işe yaramaz; ${name} zaten nasıl çalışacağını biliyor. ` +
            `Önce "neden" sorusuna eğilmek gerekir: okulun onun için ne anlam taşıdığı, neyi hedeflediği konuşulmalı.`
          : `Hem yöntem hem istek desteğe ihtiyaç duyuyor (teknik %${teknikYeterlilik} · tutum %${tutum}). ` +
            `Bu tabloda önce **tutum** tarafından başlanması yerinde olur; istek oluşmadan yöntem yerleşmez. ` +
            `Küçük ve ulaşılabilir bir başarı deneyimi, döngüyü tersine çevirebilir.`));
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Çalışma Davranışının Yansımaları', [
    [
      worst ? `${worst.info.name} güçlüğü (%${worst.pct})` : `Genel güçlük %${catAvg}`,
      worst ? pickInterp(worst.score, worst.info.interpretations).text.slice(0, 120) : 'Çalışma verimi düşebilir',
      'Aynı süre çalışsa bile kazanım daha az olabilir',
    ],
    [
      tabloTipi === 'Yapabiliyor ama isteksiz' || tabloTipi === 'Önce motivasyon' ? 'Okula tutum düşük' : 'Okula tutum yerinde',
      tabloTipi === 'Yapabiliyor ama isteksiz' || tabloTipi === 'Önce motivasyon'
        ? 'Teknik öneriler uygulanmadan kalabilir'
        : 'Öğretilen yöntemler uygulanma şansı bulur',
      tabloTipi === 'Yapabiliyor ama isteksiz' || tabloTipi === 'Önce motivasyon'
        ? 'Önce anlam ve motivasyon çalışılmalı'
        : 'Doğrudan yöntem çalışmasına geçilebilir',
    ],
    [
      'Düzensiz çalışma',
      'Sınav öncesi yoğunlaşma ve yetişememe hissi oluşur',
      'Kaygı artar, kaygı da çalışmayı zorlaştırır (kısır döngü)',
    ],
    [
      best ? `${best.info.name} sağlam (%${best.pct} güçlük)` : 'Güçlü bir alan var',
      'Bu alan bir giriş kapısı olarak kullanılabilir',
      'Diğer alanlara buradan köprü kurmak direnci azaltır',
    ],
  ]));
  P.push('---\n');

  // ═══ 6. ÇALIŞMA DÖNGÜSÜ HARİTASI ═══
  P.push(`## 🗺️ 6. Güçlük Döngünün Neresinde?\n`);
  P.push(
    `Çalışma üç aşamada gerçekleşir: derste, evde ve sınav öncesinde. Aşağıdaki tablo, ` +
    `${tamlayan(name)} güçlüklerinin hangi aşamada yoğunlaştığını gösterir. ` +
    `Destek en çok yoğun aşamada işe yarar.\n`,
  );
  {
    const rows: [string, number[]][] = catList.map((c) => {
      const t = CYCLE_LOAD[c.key] ?? { derste: 0.6, evde: 0.8, oncesi: 0.6 };
      return [c.info.name.slice(0, 24), [clampPct(c.pct * t.derste), clampPct(c.pct * t.evde), clampPct(c.pct * t.oncesi)]];
    });
    P.push(heatmapBlock('Alan × Çalışma Aşaması (güçlük)', ['Derste', 'Evde', 'Sınav öncesi'], rows,
      'Yüksek değer daha çok güçlük demektir. Bu tablo bir ölçüm değil, alan tanımlarından türetilmiş bir göstergedir.'));
    const totals = [0, 1, 2].map((i) => rows.reduce((a, r) => a + r[1][i], 0));
    const phases = ['derste', 'evde çalışırken', 'sınav öncesinde'];
    const peak = totals.indexOf(Math.max(...totals));
    P.push(`Güçlüğün en çok yoğunlaştığı aşama **${phases[peak]}** görünüyor.\n`);
  }
  P.push('---\n');

  // ═══ 7. ALAN YORUMLARI ═══
  P.push(`## 🧠 7. Alanların Yorumu ve Öneriler\n`);
  catList.forEach((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    P.push(
      `### ${c.info.name} — %${c.pct} ${diffColor(it.level)} ${diffLabel(it.level)}\n\n${it.text}\n` +
      (it.tips.length ? `\n**Öneriler:**\n${it.tips.map((t) => `- ${emojisiz(t)}`).join('\n')}\n` : ''),
    );
  });
  P.push('---\n');

  // ═══ 8. DAVRANIŞ BİRLEŞİMLERİ ═══
  if (combos.length) {
    P.push(`## 🔗 8. Davranış Birleşimleri\n`);
    P.push(`Tek tek alanların ötesinde, birlikte görülen davranış örüntüleri.\n`);
    for (const cb of combos.slice(0, 4)) {
      // combinations metinleri öğrenciye 2. tekil şahısla yazılmıştır
      // ("alışkanlığın", "tutumun"); öğretmen raporunda etiketli alıntı olarak verilir.
      P.push(insight('note', emojisiz(cb.title),
        `> **Öğrenciye anlatım:** "${cb.detail}"${cb.tip ? `\n\n**Öneri:** ${emojisiz(cb.tip)}` : ''}`));
    }
    P.push('---\n');
  }

  // ═══ 9. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 9. SONUÇ — Çalışma Yol Haritası\n`);
  {
    const focus = catList.filter((c) => pickInterp(c.score, c.info.interpretations).level !== 'low').slice(0, 3);
    const f0 = focus[0];
    const f1 = focus[1];
    P.push(timelineBlock('8 Haftalık Alışkanlık Planı', [
      ['Sonucu birlikte okuyun', `${belirtme(name)} tabloyu gösterin; hangi alanda zorlandığını kendisi söylesin.`, '1. hafta'],
      [tutum < 50 ? 'Önce "neden" konuşun' : 'Çalışma saatini sabitleyin',
        tutum < 50 ? 'Okulun onun için ne anlam taşıdığını konuşun; hedefini kendisi tanımlasın.' : 'Her gün aynı saatte başlamak, en güçlü tek alışkanlıktır.', '1–2. hafta'],
      [f0 ? `Öncelikli alan: ${f0.info.name}` : 'Mevcut düzeni koruyun',
        f0 ? emojisiz(pickInterp(f0.score, f0.info.interpretations).tips[0]) || ( 'Bu alanda küçük düzenli adımlar denenebilir.') : 'Yeni teknikler denemek pekiştirici olabilir.', '2–3. hafta'],
      ['Küçük bir başarı yaratın', 'Kesin bitirilebilecek küçük bir hedef verin; bitirme deneyimi motivasyonu besler.', '3–4. hafta'],
      [f1 ? `İkinci alan: ${f1.info.name}` : 'İkinci alışkanlığı ekleyin',
        f1 ? emojisiz(pickInterp(f1.score, f1.info.interpretations).tips[0]) || ( 'Aynı yöntemi ikinci alana uygulayın.') : 'Bir teknik daha ekleyin.', '4–5. hafta'],
      [best ? `Güçlü alanı köprü yapın — ${best.info.name}` : 'Güçlü alanı kullanın',
        'Sağlam olan alandan zorlanılan alana bağlantı kurun.', '5–6. hafta'],
      ['Haftalık plan yazın', 'Öğrenci kendi planını yazsın; sahiplenme kalıcılığı artırır.', '6–7. hafta'],
      ['Gözden geçirin', 'Ne değişti, hangi alışkanlık yerleşti — birlikte konuşun.', '8. hafta'],
    ]));
    focus.forEach((c, i) => {
      const it = pickInterp(c.score, c.info.interpretations);
      P.push(`**📌 Adım ${i + 1}: ${c.info.name}**\n${(it.tips.length ? it.tips : ['Bu alanda küçük, düzenli adımlar denemek faydalı olabilir.']).map((t) => `- ${emojisiz(t)}`).join('\n')}\n`);
    });
    if (!focus.length) P.push(`Genel çalışma alışkanlıkları güçlü görünüyor; mevcut düzeni korumak yeterli olabilir.\n`);
  }
  P.push('---\n');

  // ═══ 10. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 10. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Tablo: **${tabloTipi}**. ${tabloTipi === 'İstekli ama yöntem eksik' ? 'Doğrudan somut teknik öğretimine geçilebilir; motivasyon konuşmasına gerek yok.' : tabloTipi === 'Yapabiliyor ama isteksiz' ? 'Teknik öneri işe yaramaz; önce anlam ve hedef konuşulmalı.' : tabloTipi === 'Önce motivasyon' ? 'Küçük ve kesin bitirilebilecek bir görevle başarı deneyimi yaratmak öncelikli olabilir.' : 'Mevcut düzen korunabilir; ince ayar yeterli.'}\n` +
    (best ? `- Giriş kapısı: **${best.info.name}** (%${best.pct} güçlük) — en sağlam alan, buradan köprü kurulabilir.\n` : '') +
    `- Çabayı ve süreci takdir etmek, alışkanlıkların yerleşmesine yardımcı olur.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    (worst ? `- Öncelikli alan: **${worst.info.name}** (%${worst.pct} güçlük).\n` : '') +
    `- Güçlük yaşamak tembellik değildir; "çalışmıyorsun" etiketi direnci artırabilir.\n` +
    `- Aynı anda birden çok alışkanlık değiştirmek zordur; tek alandan başlamak daha kalıcıdır.\n` +
    (tutum < 50 ? `- Okula tutum düşük görünüyor. Teknik öneriler bu tabloda uygulanmadan kalabilir.` : `- Alışkanlıklar 6–8 haftada yerleşir; erken vazgeçmemek gerekir.`)));
  P.push('---\n');

  // ═══ 11. AİLE ═══
  P.push(`## 👨‍👩‍👦 11. Aile İçin Rehber\n`);
  P.push(
    `- ${name} ile birlikte gerçekçi bir çalışma planı oluşturmak, düzeni destekleyebilir.\n` +
    `- Çabayı ve süreci takdir etmek, alışkanlıkların yerleşmesine yardımcı olur.\n` +
    `- Güçlük alanlarında küçük hedefler koymak motivasyonu artırır.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    tutum < 50
      ? `Bu hafta ders konuşmadan ${yonelme(name)} şunu sorun: "Okulda seni en çok ne sıkıyor?" ` +
        `Savunmaya geçmeden dinleyin. Tutum çoğu zaman duyulduğunda değişmeye başlar.`
      : `Bu hafta tek bir alışkanlık seçin: her gün aynı saatte 25 dakika çalışma. ` +
        `Sadece bunu takip edin. Tek ve küçük bir hedef, birden çok hedeften daha kalıcıdır.`));
  P.push('---\n');

  // ═══ 12. SINIRLILIKLAR ═══
  P.push(`## 📌 12. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç ${tamlayan(name)} kendi beyanına dayanır; o dönemki yoğunluk cevapları etkileyebilir.\n` +
    `- Çalışma alışkanlıkları **öğrenilebilir**; sonuç sabit bir özellik değildir.\n` +
    `- Yüksek güçlük puanı tembellik veya isteksizlik anlamına gelmez.\n` +
    `- Teknik/tutum ayrımı bir yön göstergesidir; öğretmen gözlemiyle birlikte okunmalıdır.\n` +
    `- Bu rapor tanı aracı değildir; dikkat veya öğrenme güçlüğü şüphesinde uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Çalışma alışkanlıkları öğrenilebilir ve geliştirilebilir. ${name} için küçük ve tutarlı adımlar, ` +
    `zamanla belirgin fark yaratabilir. Tek seferde her şeyi değiştirmeye çalışmamak en önemli kuraldır. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
