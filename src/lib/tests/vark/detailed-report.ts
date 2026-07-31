/**
 * VARK Öğrenme Stili — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Tercih temelli: yüksek puan "daha güçlü tercih" demektir (yetenek değil).
 */
import { VARK_STYLES } from './data';
import type { VarkScores } from '../types';
import {
  clampPct, bar, statGrid, ring, gauge, radarBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan, yonelme } from '@/lib/utils/turkish';

const ORDER = ['V', 'A', 'R', 'K'] as const;

interface Band { label: string; risk: '🟢' | '🟡' | '⚪'; frame: string; }
function prefBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 40) return { label: 'Belirgin Tercih', risk: '🟢', frame: 'belirgin bir öğrenme tercihi; bu kanal öğrenmenin merkezine alınabilir' };
  if (p >= 30) return { label: 'Güçlü Tercih', risk: '🟢', frame: 'güçlü bir tercih; sık başvurulabilecek bir kanal' };
  if (p >= 20) return { label: 'Orta Tercih', risk: '🟡', frame: 'orta düzeyde tercih; yeri geldiğinde kullanılabilir' };
  if (p >= 10) return { label: 'Hafif Tercih', risk: '🟡', frame: 'hafif tercih; ikincil bir kanal olabilir' };
  return { label: 'Düşük Tercih', risk: '⚪', frame: 'daha az başvurulan bir kanal' };
}

export function buildVarkDetailedReport(scores: VarkScores, student: StudentInfo): string {
  const name = safeName(student);
  // DİKKAT: `scores.sorted` ve `scores.dominant` [anahtar, HAM CEVAP SAYISI] taşır.
  // Yüzde tek doğru kaynak `percentages`. Eski/eksik kayıtlarda sayımlardan
  // yüzde türetilir; hiçbiri yoksa sıfırlanır.
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

  const sorted = ORDER.map((k) => [k, pct[k]] as [string, number])
    .slice()
    .sort((a, b) => b[1] - a[1]);

  const domKey = scores.dominant?.[0] || sorted[0][0];
  const dom: [string, number] = [domKey, pct[domKey] ?? sorted[0][1]];
  const domInfo = VARK_STYLES[dom[0]];
  const domPct = clampPct(dom[1]);
  const domShort = domInfo.name.replace(/\s*\(.*\)/, '');
  const multimodal = !!scores.isMultimodal;

  const P: string[] = [];

  P.push(reportHeader('👁️ VARK ÖĞRENME STİLİ — DETAYLI ANALİZ RAPORU', 'VARK — Öğrenme Stili Analizi', student));
  P.push(statGrid([
    { label: 'Baskın Stil', value: domShort, theme: 'success', icon: 'eye' },
    { label: 'Baskın Oranı', value: domPct, unit: '%', theme: 'primary', icon: 'target' },
    { label: 'Profil', value: multimodal ? 'Çok Modlu' : 'Tek Baskın', theme: 'info', icon: 'compass' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `VARK modeli (Neil Fleming), öğrenme tercihini dört kanalda inceler: ` +
    `**Görsel (V)**, **İşitsel (A)**, **Okuma/Yazma (R)** ve **Kinestetik (K)**. ` +
    `Bu bir yetenek ölçümü değildir; **"${name} bilgiyi hangi kanaldan daha kolay alıyor?"** sorusuna yanıt arar. ` +
    `Amaç, çalışma yöntemini baskın kanala göre düzenleyerek öğrenmeyi kolaylaştırmaktır.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** baskın öğrenme stili **${domInfo.name} (%${domPct})** olarak öne çıkıyor — ${prefBand(domPct).frame}. ` +
    `${multimodal
      ? 'Profil çok modlu görünüyor: birden fazla kanal birbirine yakın; bu, farklı yöntemleri esnekçe kullanabildiğine işaret edebilir. '
      : 'Profil tek baskın kanal etrafında şekilleniyor; bu kanalı merkeze almak verimi artırabilir. '}` +
    `Aşağıdaki bölümler; her kanalın anlamını, baskın stile uygun çalışma stratejilerini ve aile/öğretmen önerilerini ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Öğrenme Stili Profili\n`);
  P.push(radarBlock('VARK Öğrenme Stili Profili (%)', sorted.map(([k, v]) => [VARK_STYLES[k].name, clampPct(v)])));
  P.push(ring(domShort, domPct, 100, 'Baskın öğrenme kanalı'));
  P.push(`| Kanal | Oran | Grafik | Düzey |\n|---|---|---|---|`);
  P.push(sorted.map(([k, v]) => {
    const b = prefBand(v);
    return `| ${VARK_STYLES[k].icon} ${VARK_STYLES[k].name} | %${clampPct(v)} | ${bar(v)} | ${b.risk} ${b.label} |`;
  }).join('\n') + '\n');
  P.push('---\n');

  P.push(`## 🧠 3. Kanalların Derinlemesine Yorumu\n`);
  P.push(gauge(domShort, domPct, { zones: 'Hafif:0-20,Orta:20-35,Baskın:35-100', caption: 'Baskın kanalın gücü' }));
  sorted.forEach(([k, v]) => {
    const d = VARK_STYLES[k];
    const p = clampPct(v);
    const b = prefBand(p);
    P.push(
      `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
      `${d.description} En belirgin özellikleri: ${d.characteristics.slice(0, 2).join(', ').toLowerCase()}.\n\n` +
      `*Öneri:* ${p >= 30
        ? `Bu güçlü kanalı kullanmak için "${d.studyTips[0]}" yaklaşımı ${name} için verimli olabilir.`
        : `Bu kanal ikincil görünüyor; ihtiyaç halinde "${d.studyTips[0]}" denenebilir.`}\n`,
    );
  });
  P.push('---\n');

  P.push(`## 🎯 4. Baskın Stile Göre Çalışma Yol Haritası\n`);
  P.push(insight('strength', `Öne Çıkan Kanal: ${domShort}`,
    `${tamlayan(name)} en güçlü öğrenme kanalı ${domInfo.name} (%${domPct}). Aşağıdaki yöntemler bu kanala göre seçildi.`));
  P.push(`**${domInfo.icon} ${domInfo.name} için önerilen çalışma yöntemleri:**\n${domInfo.studyTips.map((t) => `- ${t}`).join('\n')}\n`);
  if (domInfo.avoid) P.push(insight('note', 'Dikkat', domInfo.avoid));
  // İkincil kanal desteği
  if (sorted[1]) {
    const sec = VARK_STYLES[sorted[1][0]];
    P.push(`**${sec.icon} İkincil destek — ${sec.name.replace(/\s*\(.*\)/, '')}:**\n${sec.studyTips.slice(0, 3).map((t) => `- ${t}`).join('\n')}\n`);
  }
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile İçin Rehber\n`);
  P.push(`${tamlayan(name)} profili, öğrenmeyi en çok **${domInfo.name.toLowerCase()}** üzerinden desteklediğini gösteriyor olabilir. Evdeki çalışma düzenini bu kanala göre kurmak faydalı olabilir.\n`);
  P.push(`### ✅ Evde Denenebilecekler\n${domInfo.studyTips.slice(0, 4).map((t) => `- ${t}`).join('\n')}\n`);
  P.push('---\n');

  P.push(`## 👩‍🏫 6. Öğretmen İçin\n`);
  P.push(`- ${yonelme(name)} bilgi sunarken baskın kanalı (${domShort.toLowerCase()}) gözetmek, kavramayı kolaylaştırabilir.\n- Çok modlu materyaller (görsel + sözlü + uygulamalı), farklı kanalları aynı anda desteklemek için denenebilir.\n`);
  P.push('---\n');

  P.push(`## 📌 7. Öncelik Özeti\n`);
  P.push(insight('strength', 'Merkeze Al', `${domInfo.name} (%${domPct}) baskın kanal — çalışma yöntemini buna göre kurmak verimi artırabilir.`));
  P.push(insight('action', 'Zenginleştir', `Diğer kanalları da devreye sokan çok modlu çalışma, öğrenmeyi pekiştirebilir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} VARK profili, öğrenmeyi kolaylaştıracak net bir kanal önceliği sunuyor. ` +
    `Baskın kanalı merkeze alan, diğerlerini de zaman zaman kullanan bir yaklaşım en verimli sonucu getirebilir. Öğrenme stili zamanla gelişebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
