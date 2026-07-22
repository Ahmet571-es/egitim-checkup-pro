/**
 * Hızlı Okuma — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Metrik: okuma hızı (WPM) + anlama (%) + etkin okuma skoru (hız×0.4 + anlama×0.6).
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import type { SpeedReadingScores } from '../types';

export function buildHizliOkumaDetailedReport(scores: SpeedReadingScores, student: StudentInfo): string {
  const name = safeName(student);
  const wpm = Math.max(0, Math.round(scores.wpm ?? 0));
  const comp = clampPct(scores.comprehensionPct ?? 0);
  const eff = clampPct(scores.effectiveScore ?? 0);

  const P: string[] = [];

  P.push(reportHeader('📖 HIZLI OKUMA — DETAYLI ANALİZ RAPORU', 'Hızlı Okuma — Hız ve Anlama Analizi', student));
  P.push(statGrid([
    { label: 'Okuma Hızı', value: wpm, unit: 'kel/dk', theme: 'primary', icon: 'trending' },
    { label: 'Anlama', value: comp, unit: '%', theme: comp >= 70 ? 'success' : comp >= 40 ? 'warning' : 'danger', icon: 'book' },
    { label: 'Etkin Okuma', value: eff, unit: '%', theme: 'info', icon: 'award' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Hızlı okuma değerlendirmesi iki şeyi birlikte ölçer: **okuma hızı** (dakikada kelime / WPM) ve **anlama düzeyi**. ` +
    `Çünkü hızlı okumak tek başına yeterli değildir — okunanın anlaşılması esastır. ` +
    `**Etkin okuma skoru**, ikisini birleştirir (anlama ağırlıklı). Bu rapor **"${name} ne kadar hızlı okuyor ve ne kadarını anlıyor?"** sorusuna yanıt arar.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${name}** dakikada yaklaşık **${wpm} kelime** okuyor (${scores.speedLabel || '—'}) ve okuduğunun **%${comp}**'ini anlıyor (${scores.compLevel || '—'}). ` +
    `Etkin okuma skoru **%${eff}** (${scores.effLevel || '—'}). ${scores.profileDesc || ''} ` +
    `Aşağıdaki bölümler; hız-anlama dengesini ve okuma becerisini geliştirme yollarını ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Okuma Profili\n`);
  P.push(gauge('Etkin Okuma Skoru', eff, { zones: 'Gelişmeli:0-40,Orta:40-70,İyi:70-100', caption: `Hız ve anlamanın birleşimi` }));
  P.push(barsBlock('Hız-Anlama Dengesi (%)', [['Anlama', comp], ['Etkin Okuma', eff]]));
  P.push(statGrid([
    { label: 'Okunan Metin', value: scores.wordCount ?? '—', unit: 'kelime', theme: 'info', icon: 'book' },
    { label: 'Süre', value: scores.readingTimeSeconds ? `${scores.readingTimeSeconds} sn` : '—', theme: 'primary', icon: 'activity' },
    { label: 'Doğru Yanıt', value: (scores.correct != null && scores.total != null) ? `${scores.correct}/${scores.total}` : '—', theme: 'success', icon: 'target' },
  ]));
  P.push('---\n');

  P.push(`## 🧠 3. Derinlemesine Yorum\n`);
  P.push(insight('note', `Okuma Hızı: ${scores.speedLabel || '—'}`, scores.speedComment || `Dakikada ${wpm} kelime okuma hızı ölçüldü.`));
  P.push(insight(comp >= 70 ? 'strength' : 'action', `Anlama Düzeyi: ${scores.compLevel || '—'}`, comp >= 70 ? `Okuduğunu anlama oranı yüksek (%${comp}); bu, hızın anlamayı gölgelemediğini gösterebilir.` : `Anlama oranı %${comp}; hızı bir miktar düşürüp anlamaya odaklanmak dengeyi iyileştirebilir.`));
  P.push(insight(eff >= 70 ? 'strength' : 'note', `Etkin Okuma: ${scores.effLevel || '—'}`, scores.profileDesc || `Hız ve anlamanın birleşimi %${eff} olarak beliriyor.`));
  P.push('---\n');

  P.push(`## 🎯 4. Okuma Geliştirme Yol Haritası\n`);
  P.push(`*${name} için denenebilecek okuma teknikleri:*\n`);
  P.push(
    (comp < 70
      ? `- **Önce anlama:** Hızdan çok anlamaya odaklan; okuduktan sonra kısa özet çıkarmak kavramayı pekiştirir.\n- Zor bölümlerde okuma hızını bilinçli olarak düşürmek faydalı olabilir.\n`
      : `- **Hızı artır:** Anlama güçlü olduğuna göre, göz atlama (skimming) ve öbekleme (chunking) teknikleriyle hız denenebilir.\n`) +
    `- **Parmak/kalem takibi:** Satırı bir kalemle takip etmek, göz sıçramalarını düzenleyip hızı artırabilir.\n` +
    `- **Geri dönüşü azalt:** Aynı cümleyi tekrar okuma (regresyon) alışkanlığını fark edip azaltmak hızı yükseltebilir.\n` +
    `- **Düzenli pratik:** Günlük 15-20 dk keyifli okuma, hem hızı hem anlamayı zamanla geliştirir.\n`,
  );
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${name}'in ilgisini çeken kitaplar, düzenli okuma alışkanlığını destekleyebilir.\n- Okuduğu üzerine sohbet etmek, anlama becerisini besleyebilir.\n- Hız ile anlamayı birlikte gözetmek (yalnız hız değil) sağlıklı bir hedef olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight(eff >= 70 ? 'strength' : 'action', 'Genel Durum', `Etkin okuma %${eff} — hız ${wpm} kel/dk, anlama %${comp}.`));
  P.push(insight('action', 'Öncelikli Adım', comp < 70 ? 'Anlamaya odaklanıp okuma sonrası özetleme denenebilir.' : 'Anlama güçlü; öbekleme ve göz takibiyle hız artırılabilir.'));
  P.push(
    `\n### Kapanış Notu\n` +
    `Okuma, düzenli pratikle sürekli gelişen bir beceridir. ${name} için keyifli ve düzenli okuma, hem hızı hem anlamayı zamanla belirgin şekilde artırabilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
