/**
 * Enneagram — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Kimlik temelli: "iyi/kötü" değil, hangi tip. normalized 0-100 yüzdedir.
 */
import { ENNEAGRAM_DATA } from './data';
import type { EnneagramScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { belirtme, tamlayan } from '@/lib/utils/turkish';

function shortTitle(t: number): string {
  const title = ENNEAGRAM_DATA[t]?.title || `Tip ${t}`;
  const role = title.split(':')[1]?.trim() || title;
  return `${t}-${role}`;
}

export function buildEnneagramDetailedReport(scores: EnneagramScores, student: StudentInfo): string {
  const name = safeName(student);
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

  const P: string[] = [];

  P.push(reportHeader('🔮 ENNEAGRAM KİŞİLİK — DETAYLI ANALİZ RAPORU', 'Enneagram — Kişilik Tipi Analizi', student));
  P.push(statGrid([
    { label: 'Ana Tip', value: `${mainType}. ${main.title.split(':')[1]?.trim() ?? ''}`, theme: 'success', icon: 'star' },
    { label: 'Kanat', value: wing ? typeStr : `Tip ${mainType}`, theme: 'primary', icon: 'compass' },
    { label: 'Ana Tip Rezonansı', value: mainPct, unit: '%', theme: 'info', icon: 'heart' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Enneagram, dokuz kişilik tipini temel **korku**, **arzu** ve motivasyonlar üzerinden inceleyen bir modeldir. ` +
    `"İyi/kötü tip" yoktur; her tipin güçlü yönleri ve gelişim alanları vardır. ` +
    `Bu rapor **"${belirtme(name)} ne motive ediyor, hangi örüntülerle hareket ediyor?"** sorusuna yanıt arar. ` +
    `Ana tip **${typeStr}**, baskın örüntüyü temsil eder.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** ana kişilik tipi **${main.title} (${main.role})** olarak beliriyor (rezonans %${mainPct}). ` +
    `${wing ? `Kanat tipi ise ${wing.title.split(':')[1]?.trim()} yönünde; bu, ana tipe ek bir renk katar. ` : ''}` +
    `Temel motivasyon: ${main.desire.toLowerCase()} Temel kaygı: ${main.fear.toLowerCase()} ` +
    `Aşağıdaki bölümler; ana tipin örüntüsünü, güçlü/gelişim yönlerini, stres–gelişim yönelimlerini ve pratik önerileri ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Tip Rezonans Profili\n`);
  P.push(radarBlock('Enneagram Tip Rezonansı (%)', sorted.map(([t, p]) => [shortTitle(t), p])));
  P.push(ring(`Tip ${mainType}`, mainPct, 100, `Ana tip: ${main.role}`));
  P.push(`| Tip | Rezonans | Grafik |\n|---|---|---|`);
  P.push(sorted.map(([t, p]) => `| ${ENNEAGRAM_DATA[t].icon} ${ENNEAGRAM_DATA[t].title} | %${p} | ${bar(p)} |`).join('\n') + '\n');
  P.push('---\n');

  P.push(`## 🧠 3. Ana Tipin Derinlemesine Yorumu — ${main.title}\n`);
  P.push(gauge(`Tip ${mainType}`, mainPct, { zones: 'Hafif:0-40,Belirgin:40-65,Baskın:65-100', caption: 'Ana tip rezonansı' }));
  P.push(`${main.desc}\n`);
  P.push(insight('note', 'Temel Motivasyon ve Kaygı',
    `**Arzu:** ${main.desire}\n**Korku:** ${main.fear}\n**Çalışma stili:** ${main.workStyle}`));
  P.push(`### 💪 Güçlü Yönler\n${main.strengths.map((s: string) => `- ${s}`).join('\n')}\n`);
  P.push(`### 🌱 Gelişim Alanları\n${main.weaknesses.map((w: string) => `- ${w}`).join('\n')}\n`);
  if (wing) P.push(`### 🔗 Kanat: ${wing.title}\n${wing.role} yönü, ana tipe ek nüanslar katar. Kanat, aynı örüntünün farklı bir tonda ifadesi olarak düşünülebilir.\n`);
  P.push('---\n');

  P.push(`## ↕️ 4. Stres ve Gelişim Yönelimleri\n`);
  P.push(insight('risk', 'Stres Altında', main.stressBehavior));
  P.push(insight('strength', 'Gelişim Yolunda', main.growthBehavior));
  if (main.dangerSignals?.length) P.push(insight('note', 'Dikkat Edilebilecek İşaretler', main.dangerSignals.map((d: string) => `• ${d}`).join('\n')));
  P.push('---\n');

  P.push(`## 🎯 5. Gelişim Yol Haritası\n`);
  P.push(`*${tamlayan(name)} ana tipine (${main.role}) göre, dengeyi ve gelişimi destekleyebilecek pratik öneriler.*\n`);
  P.push(`${(main.prescription || []).map((p: string) => `- ${p}`).join('\n')}\n`);
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 6. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${tamlayan(name)} temel motivasyonunu (${main.desire.toLowerCase()}) anlamak, iletişimi kolaylaştırabilir.\n- İlişki stili: ${main.relationshipStyle}\n- Stres işaretleri görüldüğünde (${main.role.toLowerCase()} örüntüsü), yargılamadan alan tanımak faydalı olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 7. Öncelik Özeti\n`);
  P.push(insight('strength', 'Güçlü Yön', `${main.strengths[0]}`));
  P.push(insight('action', 'Gelişim', `${(main.prescription && main.prescription[0]) || main.growthBehavior}`));
  P.push(insight('note', 'Denge', `Stres yönelimi (Tip ${main.stress}) yerine gelişim yönelimini (Tip ${main.growth}) bilinçli tercih etmek, dengeyi destekleyebilir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} Enneagram profili, davranışların ardındaki motivasyonu anlamak için değerli bir ayna sunuyor. ` +
    `${main.famousExamples ? `Aynı tipten bilinen örnekler: ${main.famousExamples}. ` : ''}` +
    `Enneagram bir etiket değil, öz-farkındalık ve gelişim aracıdır. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
