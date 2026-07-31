/**
 * Sınav Kaygısı — DETAYLI ANALİZ (deterministik, API'SIZ).
 * RISK temelli: yüksek puan = daha çok kaygı. Ton DESTEKLEYİCİ, alarma sokmayan;
 * kaygıyı normalleştirir ve başa çıkma stratejilerine odaklanır.
 */
import { SINAV_KAYGISI_CATEGORIES } from './data';
import type { SinavKaygisiScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan } from '@/lib/utils/turkish';

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

export function buildSinavKaygisiDetailedReport(scores: SinavKaygisiScores, student: StudentInfo): string {
  const name = safeName(student);
  const totalPct = clampPct(scores.totalPct ?? 0);
  const dom = scores.dominantInfo;

  // Kategori pct'leri (skor / maxScore)
  const catList = Object.entries(scores.categories || {}).map(([k, v]) => {
    const c = SINAV_KAYGISI_CATEGORIES[k];
    const pct = c?.maxScore ? clampPct((v / c.maxScore) * 100) : 0;
    return { key: k, info: c, score: v, pct };
  }).filter((x) => x.info).sort((a, b) => b.pct - a.pct);

  const P: string[] = [];

  P.push(reportHeader('🧘 SINAV KAYGISI — DETAYLI ANALİZ RAPORU', 'Sınav Kaygısı — Düzey ve Başa Çıkma Analizi', student));
  P.push(statGrid([
    { label: 'Genel Kaygı Düzeyi', value: scores.overallLevel || '—', theme: totalPct >= 70 ? 'danger' : totalPct >= 40 ? 'warning' : 'success', icon: 'activity' },
    { label: 'Kaygı Oranı', value: totalPct, unit: '%', theme: 'info', icon: 'target' },
    { label: 'Baskın Kaygı Türü', value: dom?.name || '—', theme: 'primary', icon: 'compass' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Sınav kaygısı, sınav öncesi ve sırasında yaşanan gerginliktir ve **çok yaygındır** — belirli bir düzeyi normaldir, hatta performansı destekleyebilir. ` +
    `Bu rapor **"${tamlayan(name)} kaygısı hangi düzeyde ve nasıl kendini gösteriyor?"** sorusuna yanıt arar. ` +
    `Amaç, kaygıyı yargılamak değil, onunla başa çıkmayı kolaylaştıracak yolları görünür kılmaktır.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** genel sınav kaygısı düzeyi **${scores.overallLevel} (%${totalPct})** olarak görünüyor. ` +
    `${dom ? `Kaygı ağırlıklı olarak **${dom.name.toLowerCase()}** biçiminde kendini gösteriyor: ${dom.description} ` : ''}` +
    `${totalPct >= 70
      ? 'Bu düzey, günlük destek ve başa çıkma tekniklerinin faydalı olabileceğine işaret ediyor olabilir. '
      : totalPct >= 40
        ? 'Bu düzey yönetilebilir görünüyor; birkaç teknikle daha da rahatlaması beklenebilir. '
        : 'Bu düzey oldukça iyi; mevcut dengeyi korumak yeterli olabilir. '}` +
    `Aşağıdaki bölümler; kaygının hangi alanlarda yoğunlaştığını ve pratik başa çıkma yollarını ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Kaygı Profili\n`);
  P.push(gauge('Genel Kaygı', totalPct, { zones: 'Düşük:0-40,Orta:40-70,Yüksek:70-100', caption: 'Düşük bölge daha rahat bir tabloyu gösterir' }));
  P.push(barsBlock('Kaygı Alanlarına Göre Dağılım (%)', catList.map((c) => [c.info.name.replace(/ ile İlgili.*| Endişeler/g, '').slice(0, 28), c.pct])));
  P.push(`| Kaygı Alanı | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(catList.map((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    return `| ${c.info.icon} ${c.info.name.replace(/ ile İlgili.*| Endişeler/g, '')} | %${c.pct} | ${bar(c.pct)} | ${riskColor(it.level)} ${riskLabel(it.level)} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  P.push(`## 🧠 3. Kaygı Alanlarının Yorumu\n`);
  P.push(`*En belirgin alanlar önce ele alınıyor. Yüksek alanlarda başa çıkma önerileri paylaşılıyor.*\n`);
  catList.forEach((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    P.push(
      `**${c.info.icon} ${c.info.name}: %${c.pct}** — ${riskColor(it.level)} ${riskLabel(it.level)} düzey.\n\n${it.text}\n` +
      (it.tips.length ? `\n*Başa çıkma önerileri:*\n${it.tips.map((t) => `- ${t}`).join('\n')}\n` : ''),
    );
  });
  P.push('---\n');

  P.push(`## 🎯 4. Başa Çıkma Yol Haritası\n`);
  if (dom) {
    P.push(insight('action', `Öncelik: ${dom.name}`, `${dom.description} ${dom.strategy}`));
  }
  P.push(`**Genel olarak deneyebileceğin teknikler:**\n- Sınav öncesi düzenli, yeterli uyku ve dengeli beslenme kaygıyı azaltabilir.\n- Nefes egzersizleri (4 saniye al, 4 saniye ver) sınav anında rahatlatabilir.\n- Küçük ve gerçekçi çalışma hedefleri, kontrol duygusunu artırabilir.\n- Kaygını güvendiğin biriyle (aile, öğretmen, rehber) paylaşmak hafifletebilir.\n`);
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${tamlayan(name)} kaygısını küçümsemeden, "başarabilirsin" baskısı kurmadan dinlemek rahatlatıcı olabilir.\n- Sonuçtan çok çabayı takdir etmek, kaygıyı azaltabilir.\n- Yüksek ve sürekli kaygı gözlenirse, okul rehberlik servisiyle görüşmek faydalı olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight(totalPct >= 70 ? 'risk' : 'note', 'Genel Durum', `Kaygı düzeyi %${totalPct} (${scores.overallLevel}). ${totalPct >= 70 ? 'Başa çıkma tekniklerini düzenli uygulamak faydalı olabilir.' : 'Yönetilebilir bir tablo; mevcut yaklaşımları sürdürmek yeterli olabilir.'}`));
  if (dom) P.push(insight('action', 'Öncelikli Teknik', dom.strategy));
  P.push(
    `\n### Kapanış Notu\n` +
    `Sınav kaygısı yaşamak bir zayıflık değildir; çok yaygındır ve **yönetilebilir**. ` +
    `${tamlayan(name)} kaygısı, doğru tekniklerle zamanla azalabilir. Küçük adımlar, kalıcı rahatlama getirebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
