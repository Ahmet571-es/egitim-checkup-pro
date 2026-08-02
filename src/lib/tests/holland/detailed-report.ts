/**
 * Holland (RIASEC) Mesleki İlgi — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 * Ham Likert toplamı, tip başı max (soru×5) ile 0-100'e normalize edilir.
 *
 * Holland kuramının kendi göstergeleri de hesaplanır:
 *   - Farklılaşma (differentiation): en yüksek ile en düşük ilgi arasındaki fark.
 *   - Tutarlılık (consistency): ilk iki tipin altıgen üzerindeki komşuluğu.
 */
import { HOLLAND_TYPES, HOLLAND_QUESTIONS } from './data';
import type { HollandScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

/** Holland altıgeninin sırası — komşuluk tutarlılığı bu sıraya göre hesaplanır. */
const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

/** Orta düzey referansı — sapmayı okumak için. */
const MID = 50;

interface Band { label: string; risk: '🟢' | '🟡' | '⚪'; frame: string; }
function ilgiBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 70) return { label: 'Çok Yüksek İlgi', risk: '🟢', frame: 'çok yüksek bir mesleki ilgi; güçlü bir yönelim işareti olabilir' };
  if (p >= 55) return { label: 'Yüksek İlgi', risk: '🟢', frame: 'yüksek bir ilgi; dikkate değer bir yönelim' };
  if (p >= 40) return { label: 'Orta İlgi', risk: '🟡', frame: 'orta düzeyde ilgi; ikincil bir yönelim olabilir' };
  if (p >= 25) return { label: 'Düşük İlgi', risk: '🟡', frame: 'düşük ilgi; şu an öncelikli görünmüyor' };
  return { label: 'Çok Düşük İlgi', risk: '⚪', frame: 'çok düşük ilgi' };
}

/** Altıgen üzerinde iki tip arasındaki en kısa mesafe (0 = aynı, 3 = karşıt). */
function hexDistance(a: string, b: string): number {
  const ia = RIASEC.indexOf(a as typeof RIASEC[number]);
  const ib = RIASEC.indexOf(b as typeof RIASEC[number]);
  if (ia < 0 || ib < 0) return 2;
  const d = Math.abs(ia - ib);
  return Math.min(d, 6 - d);
}

/** Okul etkinliklerinin RIASEC tiplerine bilinen yakınlığı (0–1). Ölçüm değil. */
const ACTIVITY_FIT: Record<string, Record<string, number>> = {
  'Laboratuvar / atölye':   { R: 1.0, I: 0.9, A: 0.4, S: 0.3, E: 0.3, C: 0.5 },
  'Araştırma ödevi':        { R: 0.4, I: 1.0, A: 0.5, S: 0.4, E: 0.4, C: 0.7 },
  'Sanat / tasarım projesi':{ R: 0.5, I: 0.4, A: 1.0, S: 0.5, E: 0.5, C: 0.2 },
  'Akran destek / mentörlük':{ R: 0.3, I: 0.3, A: 0.5, S: 1.0, E: 0.7, C: 0.4 },
  'Münazara / kulüp liderliği':{ R: 0.3, I: 0.4, A: 0.6, S: 0.7, E: 1.0, C: 0.4 },
  'Planlama / kayıt tutma': { R: 0.5, I: 0.6, A: 0.2, S: 0.4, E: 0.5, C: 1.0 },
};

const TYPE_LENS: Record<string, { classroom: string; risk: string }> = {
  R: { classroom: 'Uygulamalı ve somut görevlerde öne çıkar; uzun teorik anlatımda ilgisi düşebilir.', risk: 'Soyut kavram ağırlıklı derslerde motivasyonu azalabilir.' },
  I: { classroom: 'Neden-sonuç soran, derinleşmeyi seven bir tutum gösterir; yüzeysel tekrar sıkabilir.', risk: 'Ezber ağırlıklı görevlerde isteksizleşebilir.' },
  A: { classroom: 'Özgün ifade alanı bulduğunda parlar; katı format ve kalıplar sınırlayıcı gelebilir.', risk: 'Tek doğrulu, biçimsel görevlerde tıkanabilir.' },
  S: { classroom: 'Grup çalışması ve yardımlaşmada güçlüdür; uzun bireysel çalışmada verimi düşebilir.', risk: 'Yalnız çalışma gerektiren uzun görevlerde zorlanabilir.' },
  E: { classroom: 'Sorumluluk ve liderlik verildiğinde enerjisi artar; pasif dinleyici rolü sıkabilir.', risk: 'İnisiyatif alamadığı ortamlarda ilgisi düşebilir.' },
  C: { classroom: 'Net kural ve düzenli sistemlerde rahat çalışır; belirsiz görevlerde tereddüt edebilir.', risk: 'Serbest formatlı, açık uçlu görevlerde başlangıç yapmakta gecikebilir.' },
};

function topShortName(name: string): string { return name.replace(/\s*\(.*\)/, '').trim(); }

export function buildHollandDetailedReport(scores: HollandScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;

  const maxByType: Record<string, number> = {};
  for (const q of HOLLAND_QUESTIONS as { type: string }[]) maxByType[q.type] = (maxByType[q.type] || 0) + 5;
  const pctOf = (type: string, rawVal: number) => (maxByType[type] ? clampPct((rawVal / maxByType[type]) * 100) : 0);

  const raw: Record<string, number> = { R: scores.R, I: scores.I, A: scores.A, S: scores.S, E: scores.E, C: scores.C };
  const sorted = (scores.sortedTypes && scores.sortedTypes.length
    ? scores.sortedTypes
    : RIASEC.map((k) => [k, raw[k] ?? 0] as [string, number])
  ).slice().sort((a, b) => pctOf(b[0], b[1]) - pctOf(a[0], a[1]));

  const top = sorted[0];
  const topInfo = HOLLAND_TYPES[top[0]];
  const topPct = pctOf(top[0], top[1]);
  const code = scores.hollandCode || sorted.slice(0, 3).map((t) => t[0]).join('');
  const lowest = sorted[sorted.length - 1];
  const lowPct = pctOf(lowest[0], lowest[1]);

  // ── Holland göstergeleri ──────────────────────────────────────────────
  const farklilasma = clampPct(topPct - lowPct);            // differentiation
  const dist = sorted[1] ? hexDistance(top[0], sorted[1][0]) : 2;
  const tutarlilik = clampPct(dist === 1 ? 85 : dist === 2 ? 55 : 25);  // consistency
  const tutarlilikLabel = dist === 1 ? 'Yüksek' : dist === 2 ? 'Orta' : 'Düşük';

  const careerSet: string[] = [];
  for (const [k] of sorted.slice(0, 3)) for (const cc of HOLLAND_TYPES[k].careers) if (!careerSet.includes(cc)) careerSet.push(cc);

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('🧭 HOLLAND MESLEKİ İLGİ (RIASEC) — DERİNLEMESİNE ANALİZ RAPORU', 'Holland RIASEC — Mesleki İlgi Analizi', student));
  P.push(statGrid([
    { label: 'Holland Kodu', value: code, theme: 'success', icon: 'compass' },
    { label: 'Baskın İlgi', value: topInfo.short, theme: 'primary', icon: 'target' },
    { label: 'Farklılaşma', value: farklilasma, unit: ' puan', theme: farklilasma >= 25 ? 'success' : 'warning', icon: 'trending' },
    { label: 'Tutarlılık', value: tutarlilikLabel, theme: dist === 1 ? 'success' : dist === 2 ? 'info' : 'warning', icon: 'activity' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Holland (RIASEC) modeli mesleki ilgileri altı alanda inceler: ` +
    `${RIASEC.map((k) => `**${HOLLAND_TYPES[k].short} (${k})**`).join(', ')}. ` +
    `Baskın üç harf (Holland kodu: **${code}**) meslek keşfi için bir pusula sunar.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** ${name} hangi tür iş ve ortamlardan hoşlanıyor.\n\n` +
    `**Ölçmez:** Yetenek, başarı şansı veya bir mesleği yapabilme kapasitesi.\n\n` +
    `İlgi ile yetenek farklı şeylerdir. Bir alana ilgi duymak orada başarılı olunacağını garanti etmez; ` +
    `ilgi duymamak da o alanın kapalı olduğu anlamına gelmez. Bu rapor bir **yönlendirme değil, keşif haritasıdır**.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** en baskın mesleki ilgi alanı **${topInfo.name} (%${topPct})** — ${ilgiBand(topPct).frame}. ` +
    `Holland kodu **${code}**; en güçlü üç ilgi alanının birleşimini temsil eder. ` +
    `${farklilasma >= 25
      ? `İlgi profili belirgin şekilde farklılaşmış (${farklilasma} puan); yönelim nettir. `
      : `İlgi alanları birbirine yakın (${farklilasma} puan); yönelim henüz netleşmemiş olabilir. `}` +
    `${dist === 1
      ? 'Kodun ilk iki harfi altıgen üzerinde komşu — profil iç tutarlılığı yüksek.'
      : dist === 3
        ? 'Kodun ilk iki harfi altıgen üzerinde karşıt konumda — farklı yönlere çeken ilgiler bir arada olabilir.'
        : 'Kodun ilk iki harfi altıgen üzerinde orta uzaklıkta — profil dengeli bir tutarlılık gösteriyor.'}\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL HARİTASI ═══
  P.push(`## 📊 2. Mesleki İlgi Profili\n`);
  P.push(radarBlock('Holland RIASEC İlgi Profili (%)', sorted.map(([k, v]) => [topShortName(HOLLAND_TYPES[k].name), pctOf(k, v)])));
  P.push(donutBlock('Holland Kodunu Oluşturan Üç Alan', sorted.slice(0, 3).map(([k, v]) => [HOLLAND_TYPES[k].short, pctOf(k, v)]), code));
  P.push(ring(topInfo.short, topPct, 100, 'En baskın ilgi alanı'));
  P.push(`| İlgi Alanı | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(sorted.map(([k, v]) => {
    const p = pctOf(k, v); const b = ilgiBand(p);
    return `| ${HOLLAND_TYPES[k].icon} ${HOLLAND_TYPES[k].name} | %${p} | ${bar(p)} | ${b.risk} ${b.label} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Bu Kod Çıktı?\n`);
  P.push(
    `Her ilgi alanı için ayrı bir madde grubu sorulur ve katılım düzeyi puanlanır. ` +
    `${tamlayan(name)} yanıtları **${topInfo.short.toLocaleLowerCase('tr')}** maddelerinde en yükseğe çıktığı için bu alan öne çıktı. ` +
    `Aşağıdaki grafik, her alanın **orta düzeyden (%${MID})** ne kadar saptığını gösterir.\n`,
  );
  P.push(compareBlock(
    'İlgi Alanları — Orta Düzeyle Karşılaştırma',
    sorted.map(([k, v]) => [HOLLAND_TYPES[k].short, pctOf(k, v), MID] as [string, number, number]),
    { selfLabel: first, refLabel: 'Orta düzey' },
  ));
  P.push(
    `En düşük ilgi **${HOLLAND_TYPES[lowest[0]].name} (%${lowPct})** alanında. ` +
    `Bu, o tür işlerin ${belirtme(name)} şu an daha az çektiği anlamına gelir — bir yetersizlik göstergesi değildir.\n`,
  );
  P.push('---\n');

  // ═══ 4. FARKLILAŞMA × TUTARLILIK ═══
  P.push(`## ⚖️ 4. Profil Kalitesi — Farklılaşma ve Tutarlılık\n`);
  P.push(
    `Holland kuramı, bir ilgi profilini iki ölçütle değerlendirir:\n\n` +
    `- **Farklılaşma:** İlgiler birbirinden ne kadar ayrışmış? Yüksekse yönelim nettir.\n` +
    `- **Tutarlılık:** Kodun ilk iki harfi altıgen üzerinde komşu mu? Komşuysa ilgiler birbirini besler.\n`,
  );
  P.push(quadrantBlock(
    'Farklılaşma × Tutarlılık',
    clampPct(farklilasma * 2), tutarlilik,
    'Farklılaşma', 'Tutarlılık',
    ['Keşif aşamasında', 'Net ama karma', 'Uyumlu ama belirsiz', 'Net ve uyumlu'],
    'Sağ üst çeyrekte meslek keşfi en kolay ilerler. Sol taraf, daha fazla deneyim gerektiğine işaret eder.',
  ));
  P.push(gauge('Farklılaşma', clampPct(farklilasma * 2), { zones: 'Düşük:0-35,Orta:35-60,Yüksek:60-100', caption: `En yüksek ile en düşük ilgi arasında ${farklilasma} puan fark` }));
  P.push(
    farklilasma >= 25 && dist === 1
      ? `Profil hem net hem uyumlu. **${code}** kodu güvenle bir keşif pusulası olarak kullanılabilir.\n`
      : farklilasma < 15
        ? `İlgiler birbirine çok yakın (${farklilasma} puan). Bu yaşta normaldir; farklı alanları denemek yönelimi netleştirir. Tek bir koda bağlanmak erken olur.\n`
        : dist === 3
          ? `İlgiler net ama altıgende karşıt konumda. ${name} birbirinden farklı iki dünyaya birden ilgi duyuyor olabilir. Bu bir çelişki değil — iki alanı birleştiren meslekler aranabilir.\n`
          : `Profil kullanılabilir düzeyde net. Kodun ilk iki harfini birlikte değerlendirmek yerinde olur.\n`,
  );
  P.push('---\n');

  // ═══ 5. NİÇİN — ZİNCİRLER ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — İlgiden Ortama, Ortamdan Sonuca\n`);
  P.push(`Holland'ın temel önermesi şudur: insanlar, ilgileriyle uyuşan ortamlarda daha mutlu ve verimli olur.\n`);
  P.push(chainBlock('İlgi → Ortam → Sonuç', [
    [`${topInfo.short} ilgisi yüksek (%${topPct})`, TYPE_LENS[top[0]].classroom, 'Bu tür görevlerde katılımı ve verimi artabilir'],
    [`${HOLLAND_TYPES[lowest[0]].short} ilgisi düşük (%${lowPct})`, TYPE_LENS[lowest[0]].risk, 'Bu tür görevlerde ek motivasyon desteği gerekebilir'],
    [
      farklilasma >= 25 ? `Profil belirgin (${farklilasma} puan fark)` : `Profil henüz netleşmemiş (${farklilasma} puan fark)`,
      farklilasma >= 25 ? 'Yönelim netleştiği için hedef belirlemesi kolaylaşabilir' : 'Farklı alanları denemeye açık bir dönemde olabilir',
      farklilasma >= 25 ? 'Alan seçiminde bu koda ağırlık verilebilir' : 'Erken alan daraltması yerine geniş deneyim önerilebilir',
    ],
    ['Uygun öğrenme ortamı', topInfo.studyEnvironment, 'Bu ortam sağlandığında öğrenme isteği artabilir'],
  ]));
  P.push('---\n');

  // ═══ 6. ETKİNLİK UYUM HARİTASI ═══
  P.push(`## 🗺️ 6. Okul Etkinliklerine Uyum Haritası\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} en güçlü üç ilgi alanı ile okul etkinliklerini birleştirir. ` +
    `Yüksek değer, o etkinliğin ilgiyle **daha kolay eşleşebileceğini** gösterir. ` +
    `Kulüp, proje ve staj yönlendirmesinde kullanılabilir.\n`,
  );
  {
    const top3 = sorted.slice(0, 3);
    const cols = top3.map(([k]) => HOLLAND_TYPES[k].short);
    const rows: [string, number[]][] = Object.keys(ACTIVITY_FIT).map((act) => [
      act,
      top3.map(([k, v]) => clampPct(pctOf(k, v) * (ACTIVITY_FIT[act][k] ?? 0.4))),
    ]);
    P.push(heatmapBlock('Okul Etkinliği × İlgi Alanı Uyumu', cols, rows,
      'Bu tablo bir başarı tahmini değil, ilgi profilinden türetilmiş bir uyum göstergesidir.'));
    const ranked = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => b[1] - a[1]);
    P.push(`En yüksek uyum **${ranked[0][0].toLocaleLowerCase('tr')}** etkinliğinde. Kulüp veya proje seçiminde ilk sırada denenebilir.\n`);
  }
  P.push('---\n');

  // ═══ 7. DERİN YORUM ═══
  P.push(`## 🧠 7. İlgi Alanlarının Derinlemesine Yorumu\n`);
  P.push(gauge(topInfo.short, topPct, { zones: 'Düşük:0-40,Orta:40-55,Yüksek:55-100', caption: 'Baskın ilgi alanının gücü' }));
  sorted.slice(0, 3).forEach(([k, v]) => {
    const d = HOLLAND_TYPES[k]; const p = pctOf(k, v); const b = ilgiBand(p);
    P.push(
      `### ${d.icon} ${d.name} — %${p} ${b.risk} ${b.label}\n\n` +
      `${d.description}\n\n` +
      `**Sınıfta nasıl görünür:** ${TYPE_LENS[k].classroom}\n\n` +
      `**Belirgin özellikleri:** ${d.characteristics.slice(0, 3).join(', ').toLocaleLowerCase('tr')}.\n\n` +
      `**İlgili meslekler:** ${d.careers.slice(0, 4).join(', ')}.\n\n` +
      `**Öğrenme ortamı:** ${d.studyEnvironment}\n`,
    );
  });
  const rest = sorted.slice(3);
  if (rest.length) P.push(`**Diğer alanlar (özet):**\n${rest.map(([k, v]) => `- **${HOLLAND_TYPES[k].icon} ${HOLLAND_TYPES[k].name} (%${pctOf(k, v)})** — ${ilgiBand(pctOf(k, v)).label}.`).join('\n')}\n`);
  P.push('---\n');

  // ═══ 8. SONUÇ — KEŞİF PLANI ═══
  P.push(`## 🎯 8. SONUÇ — Kariyer Keşif Yol Haritası\n`);
  P.push(timelineBlock(`${code} Kodu İçin 8 Haftalık Keşif Planı`, [
    ['Kodu birlikte okuyun', `${belirtme(name)} sonucu anlatın; kendini ne kadar tanıdığını sorun.`, '1. hafta'],
    ['Meslek listesini daralt', `${code} havuzundan ilgisini çeken 3 mesleği seçsin.`, '1–2. hafta'],
    ['Bir meslek araştırması', 'Seçtiği meslekleri; günlük iş akışı, eğitim yolu ve koşulları açısından incelesin.', '2–3. hafta'],
    ['Sahadan biriyle konuş', 'O mesleği yapan biriyle kısa bir görüşme ayarlayın.', '3–4. hafta'],
    ['Uyumlu etkinliğe katıl', `Uyum haritasındaki en yüksek etkinlikte bir kulüp veya projeye girsin.`, '4–5. hafta'],
    ['İkinci harfi dene', `${sorted[1] ? HOLLAND_TYPES[sorted[1][0]].short : 'İkinci ilgi alanı'} yönünde bir etkinlik deneyin.`, '5–6. hafta'],
    ['Not tut ve karşılaştır', 'Hangi deneyim daha keyifli geldi — birlikte yazın.', '6–7. hafta'],
    ['Yönelimi gözden geçir', 'Kod hâlâ uyuyor mu? Gerekirse hedefleri güncelleyin.', '8. hafta'],
  ]));
  P.push('---\n');

  // ═══ 9. KARİYER HAVUZU ═══
  P.push(`## 🧳 9. İlgili Meslek Havuzu\n`);
  P.push(`Aşağıdaki meslekler, ${tamlayan(name)} en güçlü üç ilgi alanından (**${code}**) derlenmiştir. Bir öneri havuzudur; yetenek, değer ve olanaklarla birlikte değerlendirilmesi yerinde olur.\n`);
  P.push(insight('note', `İlgili Meslek Alanları (${code})`, careerSet.slice(0, 12).join(' · ')));
  P.push('---\n');

  // ═══ 10. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 10. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- ${tamlayan(name)} baskın ilgisi **${topInfo.name.toLocaleLowerCase('tr')}**; bu yöndeki görev ve kulüpler katılımı artırabilir.\n` +
    `- Uygun öğrenme ortamı: ${topInfo.studyEnvironment.toLocaleLowerCase('tr')}\n` +
    `- Sınıf içi rol dağılımında bu ilgiden yararlanılabilir.`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- ${TYPE_LENS[lowest[0]].risk}\n` +
    (farklilasma < 15
      ? `- Profil henüz netleşmemiş (${farklilasma} puan). Erken alan daraltması yapmamak yerinde olur.\n`
      : `- Kod bir sınır değildir; ${name} listede olmayan alanlara da yönelebilir.\n`) +
    `- İlgi ≠ yetenek. Yönlendirmede ikisini birlikte değerlendirmek gerekir.`));
  P.push('---\n');

  // ═══ 11. AİLE ═══
  P.push(`## 👨‍👩‍👦 11. Aile İçin Rehber\n`);
  P.push(
    `- Baskın ilgi **${topInfo.name.toLocaleLowerCase('tr')}**; bu yöndeki etkinlikler (kulüp, proje, staj) ilgiyi besleyebilir.\n` +
    `- Kariyer keşfi bir süreçtir; farklı alanları deneyimlemek sağlıklıdır.\n` +
    `- Kod bir karar değil, bir başlangıç noktasıdır.\n`,
  );
  P.push(insight('action', 'Küçük Bir Deney',
    `Bu ay ${yonelme(name)} ${code} havuzundan bir meslek seçtirin. O mesleği yapan biriyle 15 dakikalık bir sohbet ayarlayın. ` +
    `Gerçek bir insandan duyulan iş anlatımı, hiçbir testin veremeyeceği netliği verir.`));
  P.push('---\n');

  // ═══ 12. SINIRLILIKLAR ═══
  P.push(`## 📌 12. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuçlar ${tamlayan(name)} kendi beyanına dayanır; henüz tanımadığı meslekler düşük puan alabilir.\n` +
    `- İlgi ≠ yetenek ≠ başarı. Üçü ayrı ayrı değerlendirilmelidir.\n` +
    `- Ergenlikte ilgiler hızlı değişir; kod yılda bir gözden geçirilebilir.\n` +
    (farklilasma < 15 ? `- Farklılaşma düşük (${farklilasma} puan): tek bir koda bağlanmak bu aşamada yanıltıcı olur.\n` : '') +
    `- Bu rapor bir yönlendirme aracı değil, sohbet başlatıcıdır.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} Holland profili, meslek keşfi için net bir başlangıç pusulası sunuyor. ` +
    `İlgiyi yetenek ve değerlerle birlikte değerlendiren bir yaklaşım en sağlıklı yönlendirmeyi getirir. İlgiler zamanla gelişebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
