/**
 * VARK Öğrenme Stili — DERİNLEMESİNE ANALİZ (deterministik, API'SIZ).
 *
 * Tercih temelli: yüksek puan "daha güçlü tercih" demektir (yetenek değil).
 *
 * Rapor omurgası (FAZ 1 referans deseni — diğer testlere de bu iskelet uygulanır):
 *   Künye → Tek Bakışta → Ne ölçer/ölçmez → Yönetici özeti → Profil haritası
 *   → NEDEN → Denge analizi → NİÇİN (etki zincirleri) → Alan yansımaları
 *   → Kanal yorumları → SONUÇ (yol haritası) → Öğretmen kartı → Aile
 *   → Kariyer penceresi → Sınırlılıklar
 */
import { VARK_STYLES } from './data';
import type { VarkScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

const ORDER = ['V', 'A', 'R', 'K'] as const;

/** Dengeli profilde her kanal ~%25 olur. Sapmayı okumak için referans. */
const EVEN_SHARE = 25;

interface Band { label: string; risk: '🟢' | '🟡' | '⚪'; frame: string; }
function prefBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 40) return { label: 'Belirgin Tercih', risk: '🟢', frame: 'belirgin bir öğrenme tercihi; bu kanal öğrenmenin merkezine alınabilir' };
  if (p >= 30) return { label: 'Güçlü Tercih', risk: '🟢', frame: 'güçlü bir tercih; sık başvurulabilecek bir kanal' };
  if (p >= 20) return { label: 'Orta Tercih', risk: '🟡', frame: 'orta düzeyde tercih; yeri geldiğinde kullanılabilir' };
  if (p >= 10) return { label: 'Hafif Tercih', risk: '🟡', frame: 'hafif tercih; ikincil bir kanal olabilir' };
  return { label: 'Düşük Tercih', risk: '⚪', frame: 'daha az başvurulan bir kanal' };
}

/**
 * Kanalların okul içi çalışma biçimlerindeki bilinen yükü (0–1).
 * Ölçüm değil; VARK modelinin tanımından türetilmiş sabit ağırlıklardır.
 * Uyum göstergesi = öğrencinin kanal tercihi × biçimin o kanala yüklenmesi.
 */
const ACTIVITY_LOAD: Record<string, Record<string, number>> = {
  'Ders anlatımı':    { V: 0.5, A: 1.0, R: 0.3, K: 0.2 },
  'Not alma / özet':  { V: 0.6, A: 0.2, R: 1.0, K: 0.2 },
  'Sınav hazırlığı':  { V: 0.7, A: 0.5, R: 0.9, K: 0.3 },
  'Sunum / anlatma':  { V: 0.7, A: 0.9, R: 0.4, K: 0.5 },
  'Deney / uygulama': { V: 0.5, A: 0.3, R: 0.2, K: 1.0 },
  'Grup çalışması':   { V: 0.4, A: 0.9, R: 0.3, K: 0.6 },
};

/** Kanal başına: sınıf içi görünüm, sınav davranışı, kariyer penceresi, zayıfsa risk. */
const CHANNEL_LENS: Record<string, { classroom: string; exam: string; career: string; risk: string }> = {
  V: {
    classroom: 'Tahtaya çizilen şema ve tabloları hızlı yakalar; yalnızca sözel akışta dikkati dağılabilir.',
    exam: 'Konu haritası çıkarınca hatırlaması kolaylaşır; düz metinden ezber zorlayabilir.',
    career: 'Tasarım, mimarlık, mühendislik, veri görselleştirme, coğrafya gibi alanlar ilgisini çekebilir.',
    risk: 'Görsel destek olmadan uzun anlatımlarda kopma yaşayabilir.',
  },
  A: {
    classroom: 'Anlatımı ve tartışmayı iyi takip eder; sessiz bireysel çalışmada verim düşebilir.',
    exam: 'Konuyu sesli anlatarak tekrar etmek kalıcılığı artırabilir.',
    career: 'Öğretmenlik, hukuk, psikoloji, iletişim, müzik gibi alanlar ilgisini çekebilir.',
    risk: 'Gürültülü ortamda odaklanması zorlaşabilir; sessiz çalışma alışkanlığı gelişmemiş olabilir.',
  },
  R: {
    classroom: 'Yazılı kaynakla iyi ilerler; not tutması düzenli olabilir.',
    exam: 'Yazarak tekrar ve özet çıkarma en verimli hazırlık yolu olabilir.',
    career: 'Edebiyat, hukuk, akademi, yazılım, editörlük gibi alanlar ilgisini çekebilir.',
    risk: 'Uygulamalı derslerde teoriden pratiğe geçişte zorlanabilir.',
  },
  K: {
    classroom: 'Yaparak öğrenir; uzun süre oturarak dinlemek zorlayabilir.',
    exam: 'Örnek çözerek ve deneyerek çalışmak, okumaktan daha kalıcı olabilir.',
    career: 'Sağlık, spor, teknik meslekler, laboratuvar, sahne sanatları ilgisini çekebilir.',
    risk: 'Teorik ağırlıklı derslerde motivasyonu düşebilir.',
  },
};

export function buildVarkDetailedReport(scores: VarkScores, student: StudentInfo): string {
  const name = safeName(student);
  const first = name.split(' ')[0] || name;

  // ── Yüzdeyi tek doğru kaynaktan al ──────────────────────────────────────
  // DİKKAT: `scores.sorted` ve `scores.dominant` [anahtar, HAM CEVAP SAYISI] taşır.
  const rawPct = scores.percentages || {};
  const counts = (scores as unknown as { counts?: Record<string, number> }).counts || {};
  const hasPct = ORDER.some((k) => Number.isFinite(Number(rawPct[k])) && Number(rawPct[k]) > 0);
  const pct: Record<string, number> = {};
  if (hasPct) {
    for (const k of ORDER) pct[k] = clampPct(Number(rawPct[k]) || 0);
  } else {
    const tot = ORDER.reduce((a, k) => a + (Number(counts[k]) || 0), 0);
    for (const k of ORDER) pct[k] = tot > 0 ? clampPct(Math.round(((Number(counts[k]) || 0) / tot) * 1000) / 10) : 0;
  }

  const sorted = ORDER.map((k) => [k, pct[k]] as [string, number]).sort((a, b) => b[1] - a[1]);
  const domKey = scores.dominant?.[0] && VARK_STYLES[scores.dominant[0]] ? scores.dominant[0] : sorted[0][0];
  const domInfo = VARK_STYLES[domKey];
  const domPct = clampPct(pct[domKey] ?? sorted[0][1]);
  const domShort = domInfo.name.replace(/\s*\(.*\)/, '');
  const multimodal = !!scores.isMultimodal;

  const weakKey = sorted[sorted.length - 1][0];
  const weakInfo = VARK_STYLES[weakKey];
  const weakShort = weakInfo.name.replace(/\s*\(.*\)/, '');
  const weakPct = clampPct(sorted[sorted.length - 1][1]);
  const secKey = sorted[1]?.[0];
  const secInfo = secKey ? VARK_STYLES[secKey] : null;
  const secShort = secInfo ? secInfo.name.replace(/\s*\(.*\)/, '') : '';

  const spread = clampPct(domPct - weakPct);
  const esneklik = clampPct(100 - spread * 2.5);   // kanallar birbirine yakınsa yüksek
  const baskinlik = clampPct(domPct * 2);          // %25 dengeli → 50

  const P: string[] = [];

  // ═══ KÜNYE + TEK BAKIŞTA ═══
  P.push(reportHeader('👁️ VARK ÖĞRENME STİLİ — DERİNLEMESİNE ANALİZ RAPORU', 'VARK — Öğrenme Stili Analizi', student));
  P.push(statGrid([
    { label: 'Baskın Kanal', value: domShort, theme: 'success', icon: 'eye' },
    { label: 'Baskın Oranı', value: domPct, unit: '%', theme: 'primary', icon: 'target' },
    { label: 'Profil', value: multimodal ? 'Çok Modlu' : 'Tek Baskın', theme: 'info', icon: 'compass' },
    { label: 'Esneklik', value: esneklik, unit: '%', theme: esneklik >= 60 ? 'success' : 'warning', icon: 'activity' },
  ], 4));
  P.push('---\n');

  // ═══ NE ÖLÇER / NE ÖLÇMEZ ═══
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `VARK modeli (Neil Fleming, 1987) öğrenme **tercihini** dört kanalda inceler: ` +
    `**Görsel (V)**, **İşitsel (A)**, **Okuma/Yazma (R)** ve **Kinestetik (K)**.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** ${name} bilgiyi hangi kanaldan daha rahat alıyor.\n\n` +
    `**Ölçmez:** Zekâ düzeyi, yetenek, akademik başarı veya kişilik. ` +
    `Düşük çıkan bir kanal "eksiklik" değil, "daha az tercih edilen yol" anlamına gelir.`));
  P.push('---\n');

  // ═══ 1. YÖNETİCİ ÖZETİ ═══
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** baskın öğrenme kanalı **${domInfo.name} (%${domPct})** — ${prefBand(domPct).frame}. ` +
    `${multimodal
      ? `Profil çok modlu: kanallar birbirine yakın (yayılım %${spread}). Bu, farklı yöntemleri esnekçe kullanabildiğine işaret edebilir. `
      : `Profil tek kanal etrafında toplanıyor (yayılım %${spread}). Bu kanalı merkeze almak verimi artırabilir. `}` +
    `En az başvurduğu kanal **${weakShort} (%${weakPct})**.\n`,
  );
  P.push('---\n');

  // ═══ 2. PROFİL HARİTASI ═══
  P.push(`## 📊 2. Profil Haritası\n`);
  P.push(radarBlock('Dört Kanalın Dağılımı (%)', sorted.map(([k, v]) => [VARK_STYLES[k].name, clampPct(v)])));
  P.push(donutBlock('Tercih Payları', sorted.map(([k, v]) => [VARK_STYLES[k].name.replace(/\s*\(.*\)/, ''), clampPct(v)]), domShort));
  P.push(`| Kanal | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(sorted.map(([k, v]) => {
    const b = prefBand(v);
    return `| ${VARK_STYLES[k].icon} ${VARK_STYLES[k].name} | %${clampPct(v)} | ${bar(v)} | ${b.risk} ${b.label} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  // ═══ 3. NEDEN ═══
  P.push(`## 🧩 3. NEDEN Böyle Bir Profil Çıktı?\n`);
  P.push(
    `Testteki her soru, dört kanaldan birini işaret eden seçenekler sunar. ` +
    `${tamlayan(name)} seçimleri **${domShort}** yönünde yoğunlaştığı için bu kanal öne çıktı. ` +
    `Aşağıdaki grafik, her kanalın **dengeli bir profilden (%${EVEN_SHARE})** ne kadar saptığını gösterir.\n`,
  );
  P.push(compareBlock(
    'Kanal Payları — Dengeli Profille Karşılaştırma',
    sorted.map(([k, v]) => [VARK_STYLES[k].name.replace(/\s*\(.*\)/, ''), clampPct(v), EVEN_SHARE] as [string, number, number]),
    { selfLabel: first, refLabel: 'Dengeli profil' },
  ));
  P.push(
    `Pozitif fark, o kanalın **tercih edildiğini**; negatif fark **daha az başvurulduğunu** gösterir. ` +
    `${domShort} kanalındaki fark bu raporun ana bulgusudur.\n`,
  );
  P.push('---\n');

  // ═══ 4. DENGE ANALİZİ ═══
  P.push(`## ⚖️ 4. Denge Analizi — Ne Kadar Baskın, Ne Kadar Esnek?\n`);
  P.push(quadrantBlock(
    'Baskınlık × Esneklik Konumu',
    baskinlik, esneklik,
    'Baskınlık', 'Esneklik',
    ['Dağınık profil', 'Tek kanala bağımlı', 'Dengeli çok modlu', 'Güçlü kanal + esneklik'],
    'Sağ üst çeyrek en verimli bölgedir: net bir ana kanal, yanında kullanılabilen alternatifler.',
  ));
  P.push(gauge('Esneklik', esneklik, { zones: 'Dar:0-40,Orta:40-65,Geniş:65-100', caption: 'Kanallar arası geçiş kolaylığı' }));
  P.push(
    esneklik >= 65
      ? `Esneklik yüksek (%${esneklik}). ${name} farklı yöntemler arasında rahat geçiş yapabiliyor olabilir. Ders türü değiştiğinde uyum sağlaması kolaylaşır.\n`
      : esneklik >= 40
        ? `Esneklik orta düzeyde (%${esneklik}). Ana kanal net; ikincil kanalları bilinçli kullanmak faydalı olabilir.\n`
        : `Esneklik dar (%${esneklik}). ${domShort} dışındaki yöntemler zorlayabilir. Diğer kanalları küçük adımlarla denemek işe yarayabilir.\n`,
  );
  P.push('---\n');

  // ═══ 5. NİÇİN — ETKİ ZİNCİRLERİ ═══
  P.push(`## 🔗 5. NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(`Aşağıdaki zincirler, test sonucunun günlük okul hayatına nasıl yansıyabileceğini gösterir.\n`);
  P.push(chainBlock('Öğrenme Profilinin Yansımaları', [
    [`${domShort} tercihi yüksek (%${domPct})`, CHANNEL_LENS[domKey].classroom, 'Bu kanala uygun materyalde kavrama hızlanabilir'],
    [`${weakShort} tercihi düşük (%${weakPct})`, CHANNEL_LENS[weakKey].risk, 'Bu tür derslerde ek destek veya farklı sunum denenebilir'],
    [
      multimodal ? `Kanallar birbirine yakın (yayılım %${spread})` : `Tek kanal belirgin (yayılım %${spread})`,
      multimodal ? 'Yöntem değiştiğinde uyum sağlaması kolay olabilir' : 'Yöntem değiştiğinde geçiş süresi uzayabilir',
      multimodal ? 'Çeşitlendirilmiş ders akışı verimli olabilir' : 'Tutarlı ve tanıdık bir çalışma düzeni verimli olabilir',
    ],
    [`Sınav hazırlığında ${domShort.toLocaleLowerCase('tr')} yöntemi`, CHANNEL_LENS[domKey].exam, 'Tekrar süresi kısalabilir, kalıcılık artabilir'],
  ]));
  P.push('---\n');

  // ═══ 6. ALAN YANSIMALARI ═══
  P.push(`## 🗺️ 6. Çalışma Biçimlerine Uyum Haritası\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} kanal tercihleri ile okuldaki çalışma biçimlerinin ` +
    `birleştirilmesinden hesaplanır. Yüksek değer, o biçimin ${belirtme(name)} **daha çok destekleyebileceği** anlamına gelir.\n`,
  );
  {
    const acts = Object.keys(ACTIVITY_LOAD);
    const cols = sorted.map(([k]) => VARK_STYLES[k].name.replace(/\s*\(.*\)/, ''));
    const rows: [string, number[]][] = acts.map((act) => [
      act,
      sorted.map(([k]) => clampPct(pct[k] * (ACTIVITY_LOAD[act][k] ?? 0) * 2)),
    ]);
    P.push(heatmapBlock('Çalışma Biçimi × Kanal Uyumu', cols, rows,
      'Bu tablo bir ölçüm değil, tercih profilinden türetilmiş bir uyum göstergesidir.'));
    const best = rows.map(([a, v]) => [a, Math.max(...v)] as [string, number]).sort((x, y) => y[1] - x[1])[0];
    P.push(`En yüksek uyum **${best[0].toLocaleLowerCase('tr')}** biçiminde görünüyor. Bu biçimi sık kullanmak verimi artırabilir.\n`);
  }
  P.push('---\n');

  // ═══ 7. KANAL YORUMLARI ═══
  P.push(`## 🧠 7. Kanalların Derinlemesine Yorumu\n`);
  P.push(ring(domShort, domPct, 100, 'Baskın öğrenme kanalı'));
  sorted.forEach(([k, v]) => {
    const d = VARK_STYLES[k];
    const lens = CHANNEL_LENS[k];
    const p = clampPct(v);
    const b = prefBand(p);
    P.push(
      `### ${d.icon} ${d.name} — %${p} ${b.risk} ${b.label}\n\n` +
      `${d.description}\n\n` +
      `**Sınıfta nasıl görünür:** ${lens.classroom}\n\n` +
      `**Sınav ve ödevde:** ${lens.exam}\n\n` +
      `**Belirgin özellikleri:** ${d.characteristics.slice(0, 3).join(', ').toLocaleLowerCase('tr')}.\n\n` +
      `*Öneri:* ${p >= 30
        ? `Bu güçlü kanalı kullanmak için "${d.studyTips[0]}" yaklaşımı ${name} için verimli olabilir.`
        : `Bu kanal ikincil görünüyor; ihtiyaç halinde "${d.studyTips[0]}" denenebilir.`}\n`,
    );
  });
  P.push('---\n');

  // ═══ 8. SONUÇ — YOL HARİTASI ═══
  P.push(`## 🎯 8. SONUÇ — Uygulama Yol Haritası\n`);
  P.push(timelineBlock(`${domShort} Merkezli 8 Haftalık Çalışma Planı`, [
    ['Mevcut düzeni gözden geçir', `${name} şu an nasıl çalışıyor, hangi yöntem işe yarıyor — birlikte not edin.`, '1. hafta'],
    [`${domShort} materyalini hazırla`, domInfo.studyTips[0], '1–2. hafta'],
    ['Bir konuyu bu yöntemle çalış', 'Tek bir üniteyle başlayın; sonucu ölçün.', '2–3. hafta'],
    ['Sonucu karşılaştır', 'Eski yöntemle yeni yöntem arasındaki farkı konuşun.', '3. hafta'],
    [secInfo ? `İkincil kanalı ekle — ${secShort}` : 'İkinci bir yöntem ekle', secInfo ? secInfo.studyTips[0] : 'Farklı bir çalışma biçimi deneyin.', '4–5. hafta'],
    ['Zayıf kanalı küçük dozda dene', `${weakShort} için: ${weakInfo.studyTips[0]}`, '5–6. hafta'],
    ['Sınav provası yap', CHANNEL_LENS[domKey].exam, '6–7. hafta'],
    ['Planı sabitle', 'İşe yarayan yöntemleri kalıcı rutine dönüştürün.', '8. hafta'],
  ]));
  P.push('---\n');

  // ═══ 9. ÖĞRETMEN KARTI ═══
  P.push(`## 👩‍🏫 9. Öğretmen İçin Hızlı Kart\n`);
  P.push(insight('strength', 'İşe Yarayabilecekler',
    `- ${yonelme(name)} bilgi sunarken **${domShort.toLocaleLowerCase('tr')}** kanalını gözetin.\n` +
    `- ${domInfo.studyTips[1] ?? domInfo.studyTips[0]}\n` +
    `- Çok modlu materyal (görsel + sözlü + uygulamalı) farklı kanalları aynı anda destekler.\n` +
    `- Sınav öncesi tekrarda: ${CHANNEL_LENS[domKey].exam.toLocaleLowerCase('tr')}`));
  P.push(insight('risk', 'Dikkat Edilebilecekler',
    `- ${domInfo.avoid}\n` +
    `- ${weakShort} ağırlıklı etkinliklerde ek yönerge gerekebilir: ${CHANNEL_LENS[weakKey].risk.toLocaleLowerCase('tr')}\n` +
    `- Bu profil bir etiket değildir; ${name} farklı yöntemleri de öğrenebilir.`));
  P.push('---\n');

  // ═══ 10. AİLE ═══
  P.push(`## 👨‍👩‍👦 10. Aile İçin Rehber\n`);
  P.push(`${tamlayan(name)} profili, öğrenmeyi en çok **${domInfo.name.toLocaleLowerCase('tr')}** üzerinden desteklediğini gösteriyor olabilir. Evdeki çalışma düzenini bu kanala göre kurmak faydalı olabilir.\n`);
  P.push(`### Evde Denenebilecekler\n${domInfo.studyTips.slice(0, 4).map((t) => `- ${t}`).join('\n')}\n`);
  P.push(insight('action', 'Küçük Bir Deney',
    `Bir hafta boyunca tek bir dersi ${domShort.toLocaleLowerCase('tr')} yöntemiyle çalıştırın. ` +
    `Sonunda ${belirtme(name)} sorun: "Bu yöntem sana daha kolay geldi mi?" Cevabı, planı birlikte şekillendirmenizi sağlar.`));
  P.push('---\n');

  // ═══ 11. KARİYER PENCERESİ ═══
  P.push(`## 🧭 11. Gelecek ve Kariyer Penceresi\n`);
  P.push(`Öğrenme stili meslek seçmez — ama **hangi ortamda daha rahat çalışılacağına** dair ipucu verir.\n`);
  P.push(
    `- **${domShort} (%${domPct}):** ${CHANNEL_LENS[domKey].career}\n` +
    (secInfo && secKey ? `- **${secShort} (%${clampPct(sorted[1][1])}):** ${CHANNEL_LENS[secKey].career}\n` : ''),
  );
  P.push(insight('note', 'Önemli Çerçeve',
    `Bu satırlar bir yönlendirme değil, sohbet başlatıcıdır. Meslek seçimi; ilgi, yetenek, değerler ve ` +
    `koşullar birlikte değerlendirilerek yapılır. Holland (RIASEC) ve Çoklu Zekâ sonuçlarıyla birlikte okunması daha sağlıklı olur.`));
  P.push('---\n');

  // ═══ 12. SINIRLILIKLAR ═══
  P.push(`## 📌 12. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuçlar ${tamlayan(name)} kendi beyanına dayanır; günlük ruh hâli cevapları etkileyebilir.\n` +
    `- Öğrenme tercihi zamanla değişebilir; yılda bir tekrar ölçmek yerinde olur.\n` +
    `- "Baskın kanal" tek yol demek değildir; en iyi öğrenme genelde birden fazla kanalın birlikte kullanılmasıyla olur.\n` +
    `- Bu rapor tanı aracı değildir; öğrenme güçlüğü şüphesinde uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} VARK profili, öğrenmeyi kolaylaştıracak net bir kanal önceliği sunuyor. ` +
    `Baskın kanalı merkeze alan, diğerlerini de zaman zaman kullanan bir yaklaşım en verimli sonucu getirebilir. ` +
    `Öğrenme stili sabit bir özellik değildir; desteklendikçe gelişebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
