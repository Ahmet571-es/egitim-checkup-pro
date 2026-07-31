/**
 * Sınav Kaygısı — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * RİSK temelli: yüksek puan = daha çok kaygı. Ton DESTEKLEYİCİ, alarma sokmayan;
 * kaygıyı normalleştirir ve başa çıkma stratejilerine odaklanır.
 *
 * Yapısal ayrım (Liebert & Morris çizgisinde): sınav kaygısı iki bileşende okunur —
 *   ENDİŞE  : düşünce tarafı (başkalarının görüşü, kendi görüşü, gelecek, hazırlık)
 *   TEPKİ   : beden ve zihin tarafı (bedensel tepkiler, zihinsel tepkiler)
 * İkisi farklı müdahale gerektirdiği için rapor bunları ayrı gösterir.
 */
import { SINAV_KAYGISI_CATEGORIES } from './data';
import type { SinavKaygisiScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, barsBlock, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
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
// Kaygıda renk TERS: yüksek = kırmızı (dikkat), düşük = yeşil (iyi)
const riskColor = (lv: string) => (lv === 'high' ? '🔴' : lv === 'mid' ? '🟡' : '🟢');
const riskLabel = (lv: string) => (lv === 'high' ? 'Yüksek' : lv === 'mid' ? 'Orta' : 'Düşük');

/** Hangi kategori hangi bileşende sayılır. */
const WORRY_KEYS = ['baskalari_gorusu', 'kendi_gorusu', 'gelecek_endisesi', 'hazirlik_endisesi'];
const REACTION_KEYS = ['bedensel_tepkiler', 'zihinsel_tepkiler'];

/** Kaygı alanının sınav zaman çizgisindeki yoğunluğu (0–1). Ölçüm değil; tanımdan. */
const TIMELINE_LOAD: Record<string, { once: number; sirasinda: number; sonrasinda: number }> = {
  baskalari_gorusu:  { once: 0.7, sirasinda: 0.4, sonrasinda: 1.0 },
  kendi_gorusu:      { once: 0.8, sirasinda: 0.6, sonrasinda: 0.9 },
  gelecek_endisesi:  { once: 1.0, sirasinda: 0.3, sonrasinda: 0.8 },
  hazirlik_endisesi: { once: 1.0, sirasinda: 0.5, sonrasinda: 0.4 },
  bedensel_tepkiler: { once: 0.7, sirasinda: 1.0, sonrasinda: 0.3 },
  zihinsel_tepkiler: { once: 0.4, sirasinda: 1.0, sonrasinda: 0.3 },
  genel_kaygi:       { once: 0.8, sirasinda: 0.8, sonrasinda: 0.6 },
};

function shortCat(name: string): string {
  return name.replace(/ ile İlgili.*| Endişeler/g, '').trim();
}

export function buildSinavKaygisiDetailedReport(scores: SinavKaygisiScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const totalPct = clampPct(scores.totalPct ?? 0);
  const dom = scores.dominantInfo;

  const catList = Object.entries(scores.categories || {}).map(([k, v]) => {
    const c = SINAV_KAYGISI_CATEGORIES[k];
    const pct = c?.maxScore ? clampPct((v / c.maxScore) * 100) : 0;
    return { key: k, info: c, score: v, pct };
  }).filter((x) => x.info).sort((a, b) => b.pct - a.pct);

  const avgOf = (keys: string[]) => {
    const xs = catList.filter((c) => keys.includes(c.key));
    return xs.length ? clampPct(xs.reduce((a, b) => a + b.pct, 0) / xs.length) : 0;
  };
  const endise = avgOf(WORRY_KEYS);
  const tepki = avgOf(REACTION_KEYS);
  const catAvg = catList.length ? clampPct(catList.reduce((a, b) => a + b.pct, 0) / catList.length) : 0;

  const bilesenLabel = Math.abs(endise - tepki) <= 12 ? 'Dengeli'
    : endise > tepki ? 'Düşünce ağırlıklı' : 'Beden ağırlıklı';

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('🧘 SINAV KAYGISI — DERİNLEMESİNE ANALİZ RAPORU', 'Sınav Kaygısı — Düzey ve Başa Çıkma Analizi', student));
  P.push(statGrid([
    { label: 'Genel Düzey', value: scores.overallLevel || '—', theme: totalPct >= 70 ? 'danger' : totalPct >= 40 ? 'warning' : 'success', icon: 'activity' },
    { label: 'Kaygı Oranı', value: totalPct, unit: '%', theme: 'info', icon: 'target' },
    { label: 'Baskın Tür', value: dom?.name ? shortCat(dom.name) : '—', theme: 'primary', icon: 'compass' },
    { label: 'Bileşen', value: bilesenLabel, theme: 'info', icon: 'heart' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Sınav kaygısı, sınav öncesi ve sırasında yaşanan gerginliktir ve **çok yaygındır**. ` +
    `Belirli bir düzeyi normaldir, hatta odaklanmayı destekleyebilir. Bu rapor ` +
    `**"${tamlayan(name)} kaygısı hangi düzeyde ve nasıl kendini gösteriyor?"** sorusuna yanıt arar.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** Sınavla ilişkili gerginliğin düzeyi ve hangi biçimde ortaya çıktığı.\n\n` +
    `**Ölçmez:** Herhangi bir ruhsal tanı, kişilik özelliği veya başarı tahmini.\n\n` +
    `Bu bir **tarama değil, bir farkındalık aracıdır**. Amaç kaygıyı yargılamak değil, ` +
    `onunla başa çıkmayı kolaylaştıracak yolları görünür kılmaktır.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** genel sınav kaygısı düzeyi **${scores.overallLevel} (%${totalPct})** olarak görünüyor. ` +
    `${dom ? `Kaygı ağırlıklı olarak **${shortCat(dom.name).toLocaleLowerCase('tr')}** biçiminde kendini gösteriyor. ` : ''}` +
    `Kaygı iki bileşende okunuyor: **düşünce tarafı %${endise}**, **beden tarafı %${tepki}** — profil ${bilesenLabel.toLocaleLowerCase('tr')}. ` +
    `${totalPct >= 70
      ? 'Bu düzeyde, düzenli başa çıkma teknikleri ve okul rehberlik servisiyle bir görüşme faydalı olabilir. '
      : totalPct >= 40
        ? 'Bu düzey yönetilebilir görünüyor; birkaç teknikle daha da rahatlaması beklenebilir. '
        : 'Bu düzey oldukça iyi; mevcut dengeyi korumak yeterli olabilir. '}\n`,
  );
  P.push('---\n');

  // ═══ 2. KAYGI PROFİLİ ═══
  P.push(`## 📊 2. Kaygı Profili\n`);
  P.push(gauge('Genel Kaygı', totalPct, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: 'Düşük bölge daha rahat bir tabloyu gösterir' }));
  if (catList.length >= 3 && catList.length <= 8) {
    P.push(radarBlock('Kaygı Alanlarına Göre Dağılım (%)', catList.map((c) => [shortCat(c.info.name).slice(0, 26), c.pct])));
  }
  P.push(barsBlock('Kaygı Alanları (%)', catList.map((c) => [shortCat(c.info.name).slice(0, 28), c.pct])));
  P.push(donutBlock('Kaygının Yoğunlaştığı Üç Alan', catList.slice(0, 3).map((c) => [shortCat(c.info.name).slice(0, 22), c.pct]), `%${totalPct}`));
  P.push(`| Kaygı Alanı | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(catList.map((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    return `| ${c.info.icon} ${shortCat(c.info.name)} | %${c.pct} | ${bar(c.pct)} | ${riskColor(it.level)} ${riskLabel(it.level)} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Bu Tablo Çıktı?\n`);
  P.push(
    `Genel kaygı oranı, alanların ortalamasıdır. Asıl bilgi, hangi alanın ortalamanın **üstünde** ` +
    `kaldığındadır — çünkü müdahale oraya yapılır. Aşağıdaki grafik her alanı ${tamlayan(name)} ` +
    `kendi ortalamasıyla (%${catAvg}) karşılaştırır.\n`,
  );
  P.push(compareBlock(
    'Kaygı Alanları — Kendi Ortalamasıyla Karşılaştırma',
    catList.map((c) => [shortCat(c.info.name).slice(0, 24), c.pct, catAvg] as [string, number, number]),
    { selfLabel: first, refLabel: 'Kendi ortalaması' },
  ));
  P.push(
    catList[0]
      ? `En yüksek alan **${shortCat(catList[0].info.name)} (%${catList[0].pct})**. Başa çıkma çalışması burada başlarsa, genel rahatlama en hızlı gelebilir.\n`
      : '',
  );
  P.push('---\n');

  // ═══ 4. BİLEŞEN ANALİZİ — asıl ayrım ═══
  P.push(`## 🪞 4. Kaygı Nerede Yaşanıyor? — Düşünce mi, Beden mi?\n`);
  P.push(
    `Sınav kaygısı iki ayrı bileşende ortaya çıkar ve **ikisi farklı yaklaşım gerektirir**:\n\n` +
    `- **Düşünce (endişe):** "Yetişemeyeceğim", "başaramazsam ne olur", "herkes ne der" gibi zihinsel meşguliyet.\n` +
    `- **Beden (tepki):** Kalp çarpıntısı, mide rahatsızlığı, titreme, zihnin boşalması gibi fiziksel belirtiler.\n\n` +
    `Düşünce ağırlıklıysa **planlama ve gerçekçi hedef** çalışması; beden ağırlıklıysa **nefes ve gevşeme** çalışması daha çok işe yarar.\n`,
  );
  P.push(quadrantBlock(
    'Düşünce × Beden Bileşeni',
    endise, tepki,
    'Düşünce (endişe)', 'Beden (tepki)',
    ['Rahat tablo', 'Düşünce ağırlıklı', 'Beden ağırlıklı', 'Her iki bileşen yüksek'],
    'Sol alt köşe en rahat bölgedir. Konum, hangi tekniğin öncelikli olduğunu gösterir.',
  ));
  P.push(compareBlock(
    'İki Bileşenin Karşılaştırması',
    [['Düşünce (endişe)', endise, tepki]],
    { selfLabel: 'Düşünce', refLabel: 'Beden' },
  ));
  P.push(insight(
    Math.max(endise, tepki) >= 70 ? 'risk' : 'note',
    `Bileşen Okuması — ${bilesenLabel}`,
    bilesenLabel === 'Düşünce ağırlıklı'
      ? `Kaygı daha çok **düşünce tarafında** (%${endise} / %${tepki}). ${name} sınavı zihninde çok fazla kez yaşıyor olabilir. ` +
        `Bu tabloda en çok işe yarayan yaklaşım: çalışmayı küçük ve görünür parçalara bölmek, gerçekçi hedef koymak ve ` +
        `"ya olmazsa" düşüncesini somut bir plana çevirmek.`
      : bilesenLabel === 'Beden ağırlıklı'
        ? `Kaygı daha çok **beden tarafında** (%${tepki} / %${endise}). Hazırlık yeterli olsa bile sınav anında beden tepki veriyor olabilir. ` +
          `Bu tabloda en çok işe yarayan yaklaşım: sınav öncesi nefes çalışması, uykuya ve beslenmeye dikkat, ` +
          `sınav ortamının provası (aynı saatte deneme çözmek).`
        : `İki bileşen birbirine yakın (%${endise} / %${tepki}). Hem planlama hem gevşeme çalışmalarını birlikte yürütmek dengeli sonuç verebilir.`));
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(chainBlock('Kaygının Yansımaları', [
    [
      catList[0] ? `${shortCat(catList[0].info.name)} yüksek (%${catList[0].pct})` : `Genel kaygı %${totalPct}`,
      bilesenLabel === 'Beden ağırlıklı' ? 'Sınav anında bedensel belirtiler dikkati bölebilir' : 'Zihin sınava odaklanmak yerine sonuçla meşgul olabilir',
      'Bildiği soruları da yapamama hissi oluşabilir',
    ],
    [
      'Kaygı çalışma düzenine yansıdığında',
      'Başlamayı erteleme veya aşırı uzun ama verimsiz çalışma görülebilir',
      'Hazırlık eksikliği kaygıyı daha da artırabilir (kısır döngü)',
    ],
    [
      bilesenLabel === 'Düşünce ağırlıklı' ? 'Planlama ve gerçekçi hedef çalışması' : 'Nefes ve gevşeme çalışması',
      bilesenLabel === 'Düşünce ağırlıklı' ? 'Belirsizlik azalır, kontrol duygusu artar' : 'Bedensel uyarılma düşer, zihin açılır',
      'Sınav performansı gerçek bilgi düzeyine yaklaşabilir',
    ],
    [
      'Güvenilen bir yetişkinle paylaşım',
      'Kaygı adlandırıldığında şiddeti azalabilir',
      'Yalnız hissetme azalır, destek almak kolaylaşır',
    ],
  ]));
  P.push('---\n');

  // ═══ 6. ZAMAN HARİTASI ═══
  P.push(`## 🗺️ 6. Kaygı Ne Zaman Yoğunlaşıyor?\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} kaygı alanlarının sınav sürecinin hangi aşamasında ` +
    `daha çok hissedilebileceğini gösterir. Bu, desteğin **ne zaman** verileceğini belirlemeye yardımcı olur.\n`,
  );
  {
    const rows: [string, number[]][] = catList.map((c) => {
      const t = TIMELINE_LOAD[c.key] ?? { once: 0.7, sirasinda: 0.7, sonrasinda: 0.6 };
      return [shortCat(c.info.name).slice(0, 24), [clampPct(c.pct * t.once), clampPct(c.pct * t.sirasinda), clampPct(c.pct * t.sonrasinda)]];
    });
    P.push(heatmapBlock('Kaygı Alanı × Sınav Aşaması', ['Sınav öncesi', 'Sınav sırasında', 'Sınav sonrası'], rows,
      'Bu tablo bir ölçüm değil, alanların bilinen zamanlamasından türetilmiş bir göstergedir.'));
    const totals = [0, 1, 2].map((i) => rows.reduce((a, r) => a + r[1][i], 0));
    const phases = ['sınav öncesinde', 'sınav sırasında', 'sınav sonrasında'];
    const peak = totals.indexOf(Math.max(...totals));
    P.push(`Kaygının en çok yoğunlaştığı aşama **${phases[peak]}** görünüyor. Destek en çok bu aşamada işe yarayabilir.\n`);
  }
  P.push('---\n');

  // ═══ 7. ALAN YORUMLARI ═══
  P.push(`## 🧠 7. Kaygı Alanlarının Yorumu\n`);
  P.push(`*En belirgin alanlar önce ele alınıyor. Yüksek alanlarda başa çıkma önerileri paylaşılıyor.*\n`);
  catList.forEach((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    P.push(
      `### ${c.info.icon} ${shortCat(c.info.name)} — %${c.pct} ${riskColor(it.level)} ${riskLabel(it.level)}\n\n${it.text}\n` +
      (it.tips.length ? `\n**Başa çıkma önerileri:**\n${it.tips.map((t) => `- ${t}`).join('\n')}\n` : ''),
    );
  });
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Başa Çıkma Yol Haritası\n`);
  if (dom) P.push(insight('action', `Öncelik: ${shortCat(dom.name)}`, `${dom.description} ${dom.strategy}`));
  P.push(timelineBlock('8 Haftalık Başa Çıkma Planı', [
    ['Kaygıyı adlandırın', `${belirtme(name)} sonucu sakin bir dille anlatın; "bu çok yaygın" mesajını verin.`, '1. hafta'],
    [bilesenLabel === 'Beden ağırlıklı' ? 'Nefes çalışmasını öğret' : 'Çalışmayı parçalara böl',
      bilesenLabel === 'Beden ağırlıklı' ? '4 saniye al, 4 saniye ver — günde iki kez, sınavdan bağımsız olarak.' : 'Büyük hedefi küçük ve bitirilebilir parçalara ayırın.', '1–2. hafta'],
    ['Uyku ve düzen', 'Sınav döneminde düzenli uyku, kaygıyı en çok azaltan tek etkendir.', '2–3. hafta'],
    ['Deneme provası', 'Gerçek sınav saatinde deneme çözsün; ortam tanıdık hâle gelsin.', '3–4. hafta'],
    ['Gerçekçi hedef koy', 'Sonuç yerine süreç hedefi: "bugün 20 soru" gibi ölçülebilir bir hedef.', '4–5. hafta'],
    [catList[0] ? `Öncelikli alan: ${shortCat(catList[0].info.name)}` : 'En yüksek alana odaklan',
      catList[0] ? (pickInterp(catList[0].score, catList[0].info.interpretations).tips[0] || 'Bu alandaki önerileri uygulayın.') : 'Bu alandaki önerileri uygulayın.', '5–6. hafta'],
    ['Paylaşım alanı aç', 'Haftada bir, sonuç konuşmadan sadece nasıl hissettiğini sorun.', '6–7. hafta'],
    ['Gözden geçir', 'Ne değişti, hangi teknik işe yaradı — birlikte konuşun.', '8. hafta'],
  ]));
  P.push(
    `**Genel olarak denenebilecek teknikler:**\n` +
    `- Düzenli ve yeterli uyku, sınav döneminde kaygıyı azaltan en güçlü etkendir.\n` +
    `- Nefes egzersizi (4 saniye al, 4 saniye ver) sınav anında rahatlatabilir.\n` +
    `- Küçük ve gerçekçi çalışma hedefleri, kontrol duygusunu artırır.\n` +
    `- Kaygıyı güvenilen biriyle (aile, öğretmen, rehber öğretmen) paylaşmak hafifletir.\n`,
  );
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- Bileşen: **${bilesenLabel}**. ${bilesenLabel === 'Beden ağırlıklı' ? 'Sınav öncesi kısa gevşeme ve nefes çalışması öncelikli olabilir.' : 'Net program, küçük hedefler ve belirsizliği azaltmak öncelikli olabilir.'}\n` +
    `- Sonuçtan çok **çabayı** takdir etmek kaygıyı azaltır.\n` +
    `- Sınav formatını önceden tanıtmak, belirsizlik kaynaklı kaygıyı düşürür.\n` +
    `- ${dom ? dom.strategy : 'Kaygıyı normalleştiren bir dil kullanmak rahatlatıcı olabilir.'}`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- "Başarabilirsin" baskısı, iyi niyetli olsa da kaygıyı artırabilir.\n` +
    `- Sınıf önünde not veya sıralama paylaşımı, kaygılı öğrenci için zorlayıcıdır.\n` +
    `- Kaygının küçümsenmesi ("abartıyorsun") paylaşımı kapatır.\n` +
    (totalPct >= 70 ? `- Kaygı düzeyi yüksek görünüyor (%${totalPct}). Okul rehberlik servisiyle görüşmek yerinde olur.` : `- Kaygı sürekli ve günlük hayatı etkiliyorsa okul rehberlik servisi devreye alınabilir.`)));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(
    `- Kaygıyı küçümsemeden, "başarabilirsin" baskısı kurmadan dinlemek rahatlatıcı olabilir.\n` +
    `- Sonuçtan çok çabayı takdir etmek kaygıyı azaltır.\n` +
    `- Sınav dönemi konuşmalarını yalnızca dersle sınırlamamak, ilişkiyi rahatlatır.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    `Bu hafta bir kez, ders konuşmadan ${yonelme(name)} sadece şunu sorun: "Sınav aklına geldiğinde ne hissediyorsun?" ` +
    `Cevabı düzeltmeden, çözüm önermeden dinleyin. Kaygı çoğu zaman anlatıldığında hafifler.`));
  P.push('---\n');

  // ═══ 11. SINIRLILIKLAR ═══
  P.push(`## 📌 11. Sınırlılıklar ve Ne Zaman Destek Alınmalı\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç ${tamlayan(name)} kendi beyanına dayanır ve **o günkü** hâlini yansıtır.\n` +
    `- Bu bir tanı aracı **değildir**; hiçbir ruhsal duruma işaret etmez.\n` +
    `- Bir miktar sınav kaygısı normaldir ve odaklanmayı destekleyebilir.\n` +
    `- Kaygı sürekliyse, uyku ve iştahı etkiliyorsa ya da okula gitmeyi zorlaştırıyorsa ` +
    `okul rehberlik servisiyle görüşmek en doğru adımdır.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Sınav kaygısı yaşamak bir zayıflık değildir; çok yaygındır ve **yönetilebilir**. ` +
    `${tamlayan(name)} kaygısı doğru tekniklerle zamanla azalabilir. Küçük adımlar kalıcı rahatlama getirir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
