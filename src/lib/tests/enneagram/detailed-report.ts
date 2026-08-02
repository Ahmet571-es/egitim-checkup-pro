/**
 * Enneagram — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 * Kimlik temelli: "iyi/kötü" değil, hangi tip. normalized 0-100 yüzdedir.
 *
 * Rapor omurgası: Künye → Tek Bakışta → Ne ölçer/ölçmez → Yönetici özeti
 *   → Profil haritası → NEDEN → Netlik analizi → NİÇİN (zincirler)
 *   → Okul durumları haritası → Ana tip derin yorum → Stres/gelişim okları
 *   → SONUÇ (plan) → Öğretmen → Aile → Kariyer → Sınırlılıklar
 */
import { ENNEAGRAM_DATA } from './data';
import type { EnneagramScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { belirtme, tamlayan, yonelme, ucuncuSahis } from '@/lib/utils/turkish';

/** Dokuz tip eşit dağılsa her biri ~%11 olurdu. Sapma referansı. */
const EVEN_SHARE = 11;

function shortTitle(t: number): string {
  const title = ENNEAGRAM_DATA[t]?.title || `Tip ${t}`;
  const role = title.split(':')[1]?.trim() || title;
  return `${t}-${role}`;
}
function roleOf(t: number): string {
  return ENNEAGRAM_DATA[t]?.title.split(':')[1]?.trim() || `Tip ${t}`;
}

/** Okul durumlarının tip merkezlerine yakınlığı (0–1). Ölçüm değil; model tanımından. */
const SITUATION_FIT: Record<string, Record<number, number>> = {
  'Kurallı, net görev':      { 1: 1.0, 2: 0.5, 3: 0.8, 4: 0.3, 5: 0.7, 6: 0.9, 7: 0.3, 8: 0.6, 9: 0.6 },
  'Grup çalışması':          { 1: 0.5, 2: 1.0, 3: 0.7, 4: 0.4, 5: 0.3, 6: 0.7, 7: 0.8, 8: 0.7, 9: 0.9 },
  'Rekabetli sınav':         { 1: 0.7, 2: 0.4, 3: 1.0, 4: 0.4, 5: 0.6, 6: 0.6, 7: 0.5, 8: 0.9, 9: 0.3 },
  'Yaratıcı / serbest ödev': { 1: 0.4, 2: 0.6, 3: 0.6, 4: 1.0, 5: 0.7, 6: 0.4, 7: 0.9, 8: 0.6, 9: 0.6 },
  'Bireysel derin çalışma':  { 1: 0.8, 2: 0.3, 3: 0.5, 4: 0.7, 5: 1.0, 6: 0.6, 7: 0.3, 8: 0.5, 9: 0.7 },
  'Sunum / liderlik':        { 1: 0.6, 2: 0.7, 3: 0.9, 4: 0.5, 5: 0.3, 6: 0.4, 7: 0.8, 8: 1.0, 9: 0.4 },
};

export function buildEnneagramDetailedReport(scores: EnneagramScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;
  const norm = scores.normalized || {};
  const sorted = Object.entries(norm)
    .map(([t, p]) => [Number(t), clampPct(p)] as [number, number])
    .sort((a, b) => b[1] - a[1]);

  const mainType = scores.mainType ?? sorted[0][0];
  const main = ENNEAGRAM_DATA[mainType];
  const mainPct = clampPct(scores.mainScore ?? norm[mainType] ?? sorted[0][1]);
  const wingType = scores.wingType;
  const wing = wingType ? ENNEAGRAM_DATA[wingType] : null;
  const typeStr = scores.fullTypeStr || `${mainType}${wingType ? 'w' + wingType : ''}`;

  const secondPct = clampPct(sorted[1]?.[1] ?? 0);
  const netlik = clampPct((mainPct - secondPct) * 4);   // ana tip ne kadar net ayrışıyor
  const top3 = sorted.slice(0, 3);
  const lowest = sorted[sorted.length - 1];

  const stressType = main.stress;
  const growthType = main.growth;

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('🔮 ENNEAGRAM KİŞİLİK — DERİNLEMESİNE ANALİZ RAPORU', 'Enneagram — Kişilik Tipi Analizi', student));
  P.push(statGrid([
    { label: 'Ana Tip', value: `${mainType}. ${roleOf(mainType)}`, theme: 'success', icon: 'star' },
    { label: 'Kanat', value: wing ? typeStr : `Tip ${mainType}`, theme: 'primary', icon: 'compass' },
    { label: 'Rezonans', value: mainPct, unit: '%', theme: 'info', icon: 'heart' },
    { label: 'Netlik', value: netlik, unit: '%', theme: netlik >= 50 ? 'success' : 'warning', icon: 'target' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Enneagram, dokuz kişilik örüntüsünü temel **korku**, **arzu** ve motivasyonlar üzerinden inceleyen bir modeldir. ` +
    `Bu rapor **"${belirtme(name)} ne motive ediyor, hangi örüntülerle hareket ediyor?"** sorusuna yanıt arar.\n`,
  );
  P.push(insight('note', 'Kapsam ve Çerçeve',
    `**Ölçer:** Davranışların ardındaki baskın motivasyon örüntüsü.\n\n` +
    `**Ölçmez:** Zekâ, yetenek, akademik başarı veya ruh sağlığı. "İyi tip / kötü tip" yoktur.\n\n` +
    `Enneagram bir **öz-farkındalık çerçevesidir**, klinik tanı aracı değildir. Sonuç, ` +
    `${tamlayan(name)} kendi beyanına dayanır ve yaşla birlikte değişebilir.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** ana kişilik tipi **${main.title} (${main.role})** olarak beliriyor (rezonans %${mainPct}). ` +
    `${wing ? `Kanat tipi ${roleOf(wingType!)} yönünde; bu, ana tipe ek bir renk katar. ` : ''}` +
    `Temel motivasyon: ${main.desire.toLocaleLowerCase('tr')} Temel kaygı: ${main.fear.toLocaleLowerCase('tr')} ` +
    `${netlik >= 50
      ? `Ana tip diğerlerinden net ayrışıyor (netlik %${netlik}); örüntü belirgin.`
      : `Ana tip ile ikinci tip birbirine yakın (netlik %${netlik}); iki örüntü birlikte okunmalı.`}\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL HARİTASI ═══
  P.push(`## 📊 2. Tip Rezonans Profili\n`);
  P.push(radarBlock('Dokuz Tipin Rezonansı (%)', sorted.map(([t, p]) => [shortTitle(t), p])));
  P.push(donutBlock('En Güçlü Üç Örüntü', top3.map(([t, p]) => [roleOf(t), p]), `Tip ${mainType}`));
  P.push(ring(`Tip ${mainType}`, mainPct, 100, `Ana tip: ${main.role}`));
  P.push(`| Tip | Rezonans | Grafik |\n|---|---|---|`);
  P.push(sorted.map(([t, p]) => `| ${ENNEAGRAM_DATA[t].icon} ${ENNEAGRAM_DATA[t].title} | %${p} | ${bar(p)} |`).join('\n') + '\n');
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Bu Tip Öne Çıktı?\n`);
  P.push(
    `Testteki maddeler dokuz örüntünün her birine ait ifadeler içerir. ` +
    `${tamlayan(name)} katılım düzeyi **${main.role.toLocaleLowerCase('tr')}** ifadelerinde yoğunlaştığı için bu tip öne çıktı. ` +
    `Dokuz tip eşit dağılsaydı her biri ~%${EVEN_SHARE} olurdu; aşağıdaki grafik sapmayı gösterir.\n`,
  );
  P.push(compareBlock(
    'En Güçlü Üç Tip — Eşit Dağılımla Karşılaştırma',
    top3.map(([t, p]) => [roleOf(t), p, EVEN_SHARE] as [string, number, number]),
    { selfLabel: first, refLabel: 'Eşit dağılım' },
  ));
  P.push(
    `En düşük rezonans **${roleOf(lowest[0])} (%${lowest[1]})** tipinde. ` +
    `Bu, o örüntünün ${tamlayan(name)} davranışlarında daha az yer tuttuğu anlamına gelir — bir eksiklik değildir.\n`,
  );
  P.push('---\n');

  // ═══ 4. NETLİK ANALİZİ ═══
  P.push(`## ⚖️ 4. Netlik Analizi — Örüntü Ne Kadar Belirgin?\n`);
  P.push(quadrantBlock(
    'Rezonans Gücü × Ayrışma Netliği',
    clampPct(mainPct * 1.4), netlik,
    'Rezonans gücü', 'Ayrışma netliği',
    ['Örüntü belirsiz', 'Güçlü ama karışık', 'Zayıf ama ayrışmış', 'Net ve belirgin'],
    'Sağ üst çeyrekte sonuç en güvenilir okunur. Sol taraf, birden fazla örüntünün birlikte çalıştığına işaret eder.',
  ));
  P.push(gauge('Ayrışma Netliği', netlik, { zones: 'Karışık:0-35,Orta:35-60,Net:60-100', caption: `Ana tip ile ikinci tip arasındaki fark: ${clampPct(mainPct - secondPct)} puan` }));
  P.push(
    netlik >= 60
      ? `Örüntü net (%${netlik}). Ana tip yorumu doğrudan kullanılabilir.\n`
      : netlik >= 35
        ? `Örüntü orta netlikte (%${netlik}). Ana tipin yanında ikinci tipi (${roleOf(sorted[1][0])}) de okumak faydalı olur.\n`
        : `Örüntü karışık (%${netlik}). ${name} birden fazla tipin özelliklerini birlikte taşıyor olabilir; tek bir etikete indirgenmemeli.\n`,
  );
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Motivasyondan Davranışa\n`);
  P.push(`Aşağıdaki zincirler, kişilik örüntüsünün okul hayatına nasıl yansıyabileceğini gösterir.\n`);
  P.push(chainBlock('Motivasyon → Davranış → Sınıf İçi Sonuç', [
    [`Temel arzu: ${main.desire.replace(/\.$/, '')}`, ucuncuSahis(main.workStyle), 'Bu koşullar sağlandığında verimi yükselebilir'],
    [`Temel korku: ${main.fear.replace(/\.$/, '')}`, main.weaknesses[0], 'Bu noktada yargısız destek fayda sağlayabilir'],
    ['Güçlü yön', main.strengths[0], 'Sınıf içi rol dağılımında bundan yararlanılabilir'],
    ['Stres altında', ucuncuSahis(main.stressBehavior), `Erken fark edilirse Tip ${growthType} yönü bilinçli desteklenebilir`],
  ]));
  P.push('---\n');

  // ═══ 6. OKUL DURUMLARI HARİTASI ═══
  P.push(`## 🗺️ 6. Okul Durumlarına Uyum Haritası\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} en güçlü üç örüntüsü ile tipik okul durumlarını birleştirir. ` +
    `Yüksek değer, o durumun mevcut örüntüyle **daha kolay eşleşebileceğini** gösterir. ` +
    `Düşük değer başarısızlık değil, **ek destek gerekebileceği** anlamına gelir.\n`,
  );
  {
    const cols = top3.map(([t]) => roleOf(t));
    const rows: [string, number[]][] = Object.keys(SITUATION_FIT).map((sit) => [
      sit,
      top3.map(([t, p]) => clampPct(p * (SITUATION_FIT[sit][t] ?? 0.5) * 2.2)),
    ]);
    P.push(heatmapBlock('Okul Durumu × Kişilik Örüntüsü', cols, rows,
      'Bu tablo bir başarı tahmini değil, örüntü profilinden türetilmiş bir uyum göstergesidir.'));
    const best = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => b[1] - a[1])[0];
    const low = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => a[1] - b[1])[0];
    P.push(`En yüksek uyum **${best[0].toLocaleLowerCase('tr')}** durumunda. En çok destek gerekebilecek durum: **${low[0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ═══ 7. ANA TİP DERİN YORUM ═══
  P.push(`## 🧠 7. Ana Tipin Derinlemesine Yorumu — ${main.title}\n`);
  P.push(gauge(`Tip ${mainType}`, mainPct, { zones: 'Hafif:0-40,Belirgin:40-65,Baskın:65-100', caption: 'Ana tip rezonansı' }));
  // ENNEAGRAM_DATA metinleri öğrenciye 2. tekil şahısla yazılmıştır
  // ("Sen dünyaya ... bakıyorsun", "güçlüsün"). Öğretmen raporunun 3. şahıs
  // anlatımına ham karışınca ton çakışıyordu. Açıkça etiketli alıntı olarak
  // veriliyor — böylece öğretmen bu cümleleri öğrenciyle doğrudan kullanabilir.
  P.push(`> **Öğrenciye anlatım:** "${main.desc}"\n`);
  P.push(insight('note', 'Temel Motivasyon ve Kaygı',
    `**Arzu:** ${main.desire}\n**Korku:** ${main.fear}\n\n` +
    `*Öğrenciye anlatım dilinde:*\n**Çalışma stili:** "${main.workStyle}"\n**İlişki stili:** "${main.relationshipStyle}"`));
  P.push(`### 💪 Güçlü Yönler\n${main.strengths.map((s: string) => `- ${s}`).join('\n')}\n`);
  P.push(`### 🌱 Gelişim Alanları\n${main.weaknesses.map((w: string) => `- ${w}`).join('\n')}\n`);
  if (wing && wingType) {
    P.push(`### 🔗 Kanat: ${wing.title}\n` +
      `${wing.role} yönü ana tipe ek nüanslar katar. Kanat, aynı örüntünün farklı bir tonda ifadesidir. ` +
      `Pratikte şu anlama gelebilir: ${wing.strengths[0].toLocaleLowerCase('tr')}\n`);
  }
  P.push('---\n');

  // ═══ 8. STRES VE GELİŞİM OKLARI ═══
  P.push(`## ↕️ 8. Stres ve Gelişim Yönelimleri\n`);
  P.push(
    `Enneagram'da her tipin iki yönü vardır: baskı altında kaydığı tip ve geliştikçe yöneldiği tip. ` +
    `${tamlayan(name)} okları: **stres → Tip ${stressType} (${roleOf(stressType)})**, ` +
    `**gelişim → Tip ${growthType} (${roleOf(growthType)})**.\n`,
  );
  P.push(chainBlock('İki Yön', [
    ['Baskı, yorgunluk veya çatışma', ucuncuSahis(main.stressBehavior), `Tip ${stressType} örüntüsünün gölge tarafı belirginleşebilir`],
    ['Güven, destek ve alan', ucuncuSahis(main.growthBehavior), `Tip ${growthType} örüntüsünün güçlü tarafı devreye girebilir`],
  ]));
  P.push(insight('risk', 'Stres Altında', ucuncuSahis(main.stressBehavior)));
  P.push(insight('strength', 'Gelişim Yolunda', ucuncuSahis(main.growthBehavior)));
  if (main.dangerSignals?.length) {
    P.push(insight('note', 'Dikkat Edilebilecek İşaretler', main.dangerSignals.map((x: string) => `• ${ucuncuSahis(x)}`).join('\n')));
  }
  P.push('---\n');

  // ═══ 9. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 9. SONUÇ — Gelişim Yol Haritası\n`);
  {
    const rx = main.prescription || [];
    P.push(timelineBlock(`${roleOf(mainType)} Örüntüsü İçin 8 Haftalık Plan`, [
      ['Örüntüyü birlikte adlandırın', `${belirtme(name)} sonucu anlatın; kendini ne kadar tanıdığını sorun.`, '1. hafta'],
      ['Güçlü yönü görünür kıl', `${main.strengths[0]} — bunu kullanabileceği bir görev verin.`, '1–2. hafta'],
      [rx[0] ? 'İlk gelişim adımı' : 'Gelişim adımı', ucuncuSahis(rx[0] || main.growthBehavior), '2–3. hafta'],
      ['Stres işaretlerini tanı', ucuncuSahis((main.dangerSignals?.[0]) || main.stressBehavior), '3–4. hafta'],
      [rx[1] ? 'İkinci gelişim adımı' : 'Alışkanlığı pekiştir', rx[1] || 'Küçük ama düzenli bir rutin kurun.', '4–5. hafta'],
      [`Tip ${growthType} yönünü besle`, ucuncuSahis(main.growthBehavior), '5–6. hafta'],
      ['Zor durumda prova', 'Uyumun düşük olduğu okul durumunda küçük bir deneme yapın.', '6–7. hafta'],
      ['Değerlendir ve sabitle', 'Ne değişti, ne işe yaradı — birlikte konuşun.', '8. hafta'],
    ]));
    if (rx.length) P.push(`**Ek öneriler:**\n${rx.map((x: string) => `- ${ucuncuSahis(x)}`).join('\n')}\n`);
  }
  P.push('---\n');

  // ═══ 10. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 10. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- ${tamlayan(name)} temel motivasyonu: ${main.desire.toLocaleLowerCase('tr')} Bunu bilerek görev vermek işbirliğini kolaylaştırır.\n` +
    `- Verimli olduğu ortam: ${ucuncuSahis(main.workStyle).toLocaleLowerCase('tr')}\n` +
    `- Güçlü yön: ${main.strengths[0].toLocaleLowerCase('tr')} — sınıfta bu role alan açılabilir.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- Temel kaygı: ${main.fear.toLocaleLowerCase('tr')} Bu kaygıyı tetikleyen geri bildirim savunmaya itebilir.\n` +
    `- Stres tepkisi: ${ucuncuSahis(main.stressBehavior).toLocaleLowerCase('tr')}\n` +
    `- Enneagram bir etiket değildir; ${name} bu tanımın dışına çıkabilir ve çıkması normaldir.`));
  P.push('---\n');

  // ═══ 11. AİLE ═══
  P.push(`## 👨‍👩‍👦 11. Aile İçin Rehber\n`);
  P.push(
    `- ${tamlayan(name)} temel motivasyonunu anlamak iletişimi kolaylaştırabilir.\n` +
    `- İlişki stili: ${ucuncuSahis(main.relationshipStyle)}\n` +
    `- Stres işaretleri göründüğünde yargılamadan alan tanımak faydalı olabilir.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    `Bu hafta ${yonelme(name)} şunu sorun: "Bir şeyi yaparken seni en çok ne motive ediyor?" ` +
    `Cevabını rapordaki arzu tanımıyla birlikte konuşun. Kendini tanıması, gelişimin ilk adımıdır.`));
  P.push('---\n');

  // ═══ 12. KARİYER ═══
  P.push(`## 🧭 12. Çalışma Ortamı ve Kariyer Penceresi\n`);
  P.push(`**Verimli olduğu ortam:** ${ucuncuSahis(main.workStyle)}\n`);
  if (main.careers?.length) P.push(insight('note', 'İlişkili Alanlar', main.careers.join(' · ')));
  P.push(
    `Bu alanlar bir yönlendirme değil, sohbet başlatıcıdır. Kişilik tipi meslek seçmez; ` +
    `hangi ortamda daha rahat çalışılacağına dair ipucu verir. Holland (RIASEC) sonuçlarıyla birlikte okunması daha sağlıklı olur.\n`,
  );
  P.push('---\n');

  // ═══ 13. SINIRLILIKLAR ═══
  P.push(`## 📌 13. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuç ${tamlayan(name)} kendi beyanına dayanır; ruh hâli cevapları etkileyebilir.\n` +
    `- Enneagram klinik bir ölçek değildir; tanı veya yönlendirme için kullanılamaz.\n` +
    `- Ergenlik döneminde kişilik örüntüsü henüz oturmamış olabilir; sonuç zamanla değişebilir.\n` +
    `- Netlik düşükse (%${netlik}) tek tipe indirgemek yanıltıcı olur.\n` +
    `- Tip bir sınır değil, bir başlangıç noktasıdır.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} Enneagram profili, davranışların ardındaki motivasyonu anlamak için bir ayna sunuyor. ` +
    `${main.famousExamples ? `Aynı örüntüden bilinen örnekler: ${main.famousExamples}. ` : ''}` +
    `Enneagram bir etiket değil, öz-farkındalık ve gelişim aracıdır. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
