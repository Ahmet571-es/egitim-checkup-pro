/**
 * Holland (RIASEC) Mesleki İlgi — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Ham Likert toplamı, tip başı max (soru×5) ile 0-100'e normalize edilir.
 */
import { HOLLAND_TYPES, HOLLAND_QUESTIONS } from './data';
import type { HollandScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

interface Band { label: string; risk: '🟢' | '🟡' | '⚪'; frame: string; }
function ilgiBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 70) return { label: 'Çok Yüksek İlgi', risk: '🟢', frame: 'çok yüksek bir mesleki ilgi; güçlü bir yönelim işareti olabilir' };
  if (p >= 55) return { label: 'Yüksek İlgi', risk: '🟢', frame: 'yüksek bir ilgi; dikkate değer bir yönelim' };
  if (p >= 40) return { label: 'Orta İlgi', risk: '🟡', frame: 'orta düzeyde ilgi; ikincil bir yönelim olabilir' };
  if (p >= 25) return { label: 'Düşük İlgi', risk: '🟡', frame: 'düşük ilgi; şu an öncelikli görünmüyor' };
  return { label: 'Çok Düşük İlgi', risk: '⚪', frame: 'çok düşük ilgi' };
}

export function buildHollandDetailedReport(scores: HollandScores, student: StudentInfo): string {
  const name = safeName(student);
  const maxByType: Record<string, number> = {};
  for (const q of HOLLAND_QUESTIONS as { type: string }[]) maxByType[q.type] = (maxByType[q.type] || 0) + 5;
  const pctOf = (type: string, raw: number) => (maxByType[type] ? clampPct((raw / maxByType[type]) * 100) : 0);

  const raw: Record<string, number> = { R: scores.R, I: scores.I, A: scores.A, S: scores.S, E: scores.E, C: scores.C };
  const sorted = (scores.sortedTypes && scores.sortedTypes.length
    ? scores.sortedTypes
    : RIASEC.map((k) => [k, raw[k] ?? 0] as [string, number])
  ).slice().sort((a, b) => pctOf(b[0], b[1]) - pctOf(a[0], a[1]));

  const top = sorted[0];
  const topInfo = HOLLAND_TYPES[top[0]];
  const topPct = pctOf(top[0], top[1]);
  const code = scores.hollandCode || sorted.slice(0, 3).map((t) => t[0]).join('');

  // Kariyer havuzu (top3 tipten, tekrarsız)
  const careerSet: string[] = [];
  for (const [k] of sorted.slice(0, 3)) for (const c of HOLLAND_TYPES[k].careers) if (!careerSet.includes(c)) careerSet.push(c);

  const P: string[] = [];

  P.push(reportHeader('🧭 HOLLAND MESLEKİ İLGİ (RIASEC) — DETAYLI ANALİZ RAPORU', 'Holland RIASEC — Mesleki İlgi Analizi', student));
  P.push(statGrid([
    { label: 'Holland Kodu', value: code, theme: 'success', icon: 'compass' },
    { label: 'Baskın İlgi', value: topInfo.short, theme: 'primary', icon: 'target' },
    { label: 'En Yüksek Oran', value: topPct, unit: '%', theme: 'info', icon: 'trending' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Holland (RIASEC) modeli mesleki ilgileri altı alanda inceler: ` +
    `**Gerçekçi (R)**, **Araştırmacı (I)**, **Sanatsal (A)**, **Sosyal (S)**, **Girişimci (E)**, **Geleneksel (C)**. ` +
    `Bu bir yetenek testi değil, bir **ilgi haritasıdır**: **"${name} hangi tür işlerden ve ortamlardan hoşlanıyor?"** ` +
    `Baskın üç harf (Holland kodu: **${code}**), meslek yönelimleri için bir pusula sunar.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${name}**'in en baskın mesleki ilgi alanı **${topInfo.name} (%${topPct})** — ${ilgiBand(topPct).frame}. ` +
    `Holland kodu **${code}**; bu, en güçlü üç ilgi alanının birleşimini temsil eder. ` +
    `Aşağıdaki bölümler; her alanın anlamını, koda uygun meslek yönelimlerini ve uygun öğrenme ortamlarını ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Mesleki İlgi Profili\n`);
  P.push(radarBlock('Holland RIASEC İlgi Profili (%)', sorted.map(([k, v]) => [topShortName(HOLLAND_TYPES[k].name), pctOf(k, v)])));
  P.push(ring(topInfo.short, topPct, 100, 'En baskın ilgi alanı'));
  P.push(`| İlgi Alanı | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(sorted.map(([k, v]) => {
    const p = pctOf(k, v); const b = ilgiBand(p);
    return `| ${HOLLAND_TYPES[k].icon} ${HOLLAND_TYPES[k].name} | %${p} | ${bar(p)} | ${b.risk} ${b.label} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  P.push(`## 🧠 3. İlgi Alanlarının Derinlemesine Yorumu\n`);
  P.push(gauge(topInfo.short, topPct, { zones: 'Düşük:0-40,Orta:40-55,Yüksek:55-100', caption: 'Baskın ilgi alanının gücü' }));
  sorted.slice(0, 3).forEach(([k, v]) => {
    const d = HOLLAND_TYPES[k]; const p = pctOf(k, v); const b = ilgiBand(p);
    P.push(
      `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
      `${d.description} En belirgin özellikleri: ${d.characteristics.slice(0, 2).join(', ').toLowerCase()}.\n\n` +
      `*İlgili meslekler:* ${d.careers.slice(0, 4).join(', ')}.\n\n*Öğrenme ortamı:* ${d.studyEnvironment}\n`,
    );
  });
  const rest = sorted.slice(3);
  if (rest.length) P.push(`**Diğer alanlar (özet):**\n${rest.map(([k, v]) => `- **${HOLLAND_TYPES[k].icon} ${HOLLAND_TYPES[k].name} (%${pctOf(k, v)})** — ${ilgiBand(pctOf(k, v)).label}.`).join('\n')}\n`);
  P.push('---\n');

  P.push(`## 🎯 4. Kariyer Yönelimleri\n`);
  P.push(`Aşağıdaki meslekler, ${name}'in en güçlü üç ilgi alanından (**${code}**) derlenmiştir. Bunlar bir öneri havuzudur; yetenek, değer ve olanaklarla birlikte değerlendirilmesi yerinde olur.\n`);
  P.push(insight('note', `İlgili Meslek Alanları (${code})`, careerSet.slice(0, 12).join(' · ')));
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${name}'in baskın ilgisi **${topInfo.name.toLowerCase()}**; bu yöndeki etkinlikler (kulüp, proje, staj) ilgiyi besleyebilir.\n- Öğrenme ortamı önerisi: ${topInfo.studyEnvironment}\n- Kariyer keşfi bir süreçtir; farklı alanları deneyimlemek sağlıklı olabilir.\n`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight('strength', 'Güçlü İlgi', `${topInfo.name} (%${topPct}) en baskın alan — bu yöndeki fırsatları değerlendirmek faydalı olabilir.`));
  P.push(insight('action', 'Keşfet', `${code} kodundaki diğer alanları da (${sorted.slice(1, 3).map(([k]) => HOLLAND_TYPES[k].short).join(', ')}) deneyimlemek yönelimi netleştirebilir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${name}'in Holland profili, meslek keşfi için net bir başlangıç pusulası sunuyor. ` +
    `İlgiyi yetenek ve değerlerle birlikte değerlendiren bir yaklaşım en sağlıklı yönlendirmeyi getirebilir. İlgiler zamanla gelişebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}

function topShortName(name: string): string { return name.replace(/\s*\(.*\)/, '').trim(); }
