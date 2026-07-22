/**
 * Çalışma Davranışı — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Kategori puanı yüksek = o alanda daha çok GÜÇLÜK. positivePct = genel olumlu davranış.
 */
import { CALISMA_DAVRANISI_CATEGORIES } from './data';
import type { CalismaDavranisiScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';

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

export function buildCalismaDavranisiDetailedReport(scores: CalismaDavranisiScores, student: StudentInfo): string {
  const name = safeName(student);
  const posPct = clampPct(scores.positivePct ?? 0);

  const catList = Object.entries(scores.categories || {}).map(([k, v]) => {
    const c = CALISMA_DAVRANISI_CATEGORIES[k];
    const pct = c?.maxScore ? clampPct((v / c.maxScore) * 100) : 0; // güçlük yüzdesi
    return { key: k, info: c, score: v, pct };
  }).filter((x) => x.info).sort((a, b) => b.pct - a.pct);

  const combos = scores.combinations || [];
  const P: string[] = [];

  P.push(reportHeader('📚 ÇALIŞMA DAVRANIŞI — DETAYLI ANALİZ RAPORU', 'Çalışma Davranışı ve Alışkanlıkları Analizi', student));
  P.push(statGrid([
    { label: 'Genel Düzey', value: scores.level || '—', theme: posPct >= 70 ? 'success' : posPct >= 40 ? 'warning' : 'danger', icon: 'award' },
    { label: 'Olumlu Davranış', value: posPct, unit: '%', theme: 'primary', icon: 'trending' },
    { label: 'Güçlük Alanı', value: catList.filter((c) => pickInterp(c.score, c.info.interpretations).level === 'high').length, theme: 'info', icon: 'target' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Bu değerlendirme, ${name}'in **ders çalışma alışkanlıklarını** farklı alanlarda inceler: ` +
    `çalışmaya başlama, sürdürme, planlama, dikkat ve sınav hazırlığı gibi. ` +
    `Amaç, güçlü alışkanlıkları görünür kılmak ve güçlük yaşanan alanlara pratik öneriler sunmaktır. ` +
    `Bir alandaki yüksek puan, o konuda daha çok desteğe ihtiyaç olabileceğini gösterir.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  const worst = catList[0];
  P.push(
    `**${name}**'in genel çalışma davranışı düzeyi **${scores.level} (%${posPct} olumlu)** olarak görünüyor. ` +
    `${worst ? `En çok gelişime açık alan **${worst.info.name.toLowerCase()}** görünüyor. ` : ''}` +
    `${posPct >= 70 ? 'Genel tablo güçlü; birkaç ince ayarla daha da verimli olabilir. ' : posPct >= 40 ? 'Sağlam bir temel var; birkaç alanda çalışma faydalı olabilir. ' : 'Alışkanlıkları yapılandırmak belirgin fayda getirebilir. '}` +
    `Aşağıdaki bölümler; her alanı, önerileri ve davranış birleşimlerini ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Çalışma Davranışı Profili\n`);
  P.push(gauge('Olumlu Çalışma Davranışı', posPct, { zones: 'Zayıf:0-40,Orta:40-70,Güçlü:70-100', caption: 'Yüksek bölge daha sağlam alışkanlıkları gösterir' }));
  P.push(barsBlock('Alanlara Göre Güçlük Düzeyi (%)', catList.map((c) => [c.info.name.slice(0, 28), c.pct])));
  P.push(`| Alan | Güçlük | Grafik | Durum |\n|---|---|---|---|`);
  P.push(catList.map((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    return `| ${c.info.name} | %${c.pct} | ${bar(c.pct)} | ${diffColor(it.level)} ${diffLabel(it.level)} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  P.push(`## 🧠 3. Alanların Yorumu ve Öneriler\n`);
  catList.forEach((c) => {
    const it = pickInterp(c.score, c.info.interpretations);
    P.push(
      `**${c.info.name}: %${c.pct}** — ${diffColor(it.level)} ${diffLabel(it.level)}.\n\n${it.text}\n` +
      (it.tips.length ? `\n*Öneriler:*\n${it.tips.map((t) => `- ${t}`).join('\n')}\n` : ''),
    );
  });
  P.push('---\n');

  if (combos.length) {
    P.push(`## 🔗 4. Davranış Birleşimleri\n`);
    for (const cb of combos.slice(0, 4)) {
      P.push(insight('note', cb.title, `${cb.detail}${cb.tip ? `\n\n*Öneri:* ${cb.tip}` : ''}`));
    }
    P.push('---\n');
  }

  P.push(`## 🎯 5. Çalışma Yol Haritası\n`);
  const focusTips = catList.filter((c) => pickInterp(c.score, c.info.interpretations).level !== 'low').slice(0, 3);
  if (focusTips.length) {
    focusTips.forEach((c, i) => {
      const it = pickInterp(c.score, c.info.interpretations);
      P.push(`**📌 Adım ${i + 1}: ${c.info.name}**\n${(it.tips.length ? it.tips : ['Bu alanda küçük, düzenli adımlar denemek faydalı olabilir.']).map((t) => `- ${t}`).join('\n')}\n`);
    });
  } else {
    P.push(`Genel çalışma alışkanlıkları güçlü görünüyor; mevcut düzeni korumak yeterli olabilir. Yeni teknikler denemek pekiştirici olabilir.\n`);
  }
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 6. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${name} ile birlikte gerçekçi bir çalışma planı oluşturmak, düzeni destekleyebilir.\n- Çabayı ve süreci takdir etmek, alışkanlıkların yerleşmesine yardımcı olabilir.\n- Güçlük alanlarında küçük hedefler koymak, motivasyonu artırabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 7. Öncelik Özeti\n`);
  P.push(insight('strength', 'Genel Durum', `Olumlu çalışma davranışı %${posPct} (${scores.level}). ${posPct >= 70 ? 'Sağlam bir temel mevcut.' : 'Gelişime açık; hedefli çalışma fayda getirebilir.'}`));
  if (worst) P.push(insight('action', 'Öncelikli Alan', `${worst.info.name}: ${(pickInterp(worst.score, worst.info.interpretations).tips[0]) || 'küçük düzenli adımlar denenebilir.'}`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Çalışma alışkanlıkları öğrenilebilir ve geliştirilebilir. ${name} için küçük, tutarlı adımlar, zamanla belirgin fark yaratabilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
