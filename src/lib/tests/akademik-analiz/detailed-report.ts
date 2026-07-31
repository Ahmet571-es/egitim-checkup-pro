/**
 * Akademik Analiz — DETAYLI ANALİZ (deterministik, API'SIZ).
 * Bölüm bazlı performans (%), en güçlü/zayıf, performans-özdeğerlendirme farkı.
 */
import { SKILL_LABELS } from './data';
import type { AkademikScores } from '../types';
import {
  clampPct, bar, statGrid, gauge, radarBlock, barsBlock, insight,
  reportHeader, reportFooter, safeName, type StudentInfo,
} from '../../report/report-blocks';
import { tamlayan } from '@/lib/utils/turkish';

function label(k: string): string { return SKILL_LABELS[k] ?? k.replace(/_/g, ' '); }

interface Band { risk: '🟢' | '🟡' | '🔴'; label: string; }
function perfBand(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 70) return { risk: '🟢', label: 'Güçlü' };
  if (p >= 50) return { risk: '🟡', label: 'Orta' };
  if (p >= 30) return { risk: '🟡', label: 'Gelişime Açık' };
  return { risk: '🔴', label: 'Öncelikli' };
}

export function buildAkademikDetailedReport(scores: AkademikScores, student: StudentInfo): string {
  const name = safeName(student);
  const overall = clampPct(scores.overall ?? 0);

  const sectionList = Object.entries(scores.sections || {})
    .map(([k, v]) => ({ key: k, name: label(k), pct: clampPct(v?.pct ?? 0) }))
    .sort((a, b) => b.pct - a.pct);

  const P: string[] = [];

  P.push(reportHeader('📚 AKADEMİK ANALİZ — DETAYLI RAPOR', `Akademik Beceri Analizi${scores.kademLabel ? ' — ' + scores.kademLabel : ''}`, student));
  P.push(statGrid([
    { label: 'Genel Başarı', value: overall, unit: '%', theme: overall >= 70 ? 'success' : overall >= 50 ? 'warning' : 'danger', icon: 'award' },
    { label: 'Düzey', value: scores.level || '—', theme: 'primary', icon: 'trending' },
    { label: 'En Güçlü Alan', value: scores.strongest?.name || (sectionList[0]?.name ?? '—'), theme: 'info', icon: 'star' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Neyi Ölçüyor?\n`);
  P.push(
    `Bu analiz, ${tamlayan(name)} farklı akademik becerilerdeki (örn. anlama, problem çözme, veri yorumlama) performansını ayrı ayrı inceler. ` +
    `Amaç, tek bir not yerine **beceri bazında** güçlü ve gelişime açık alanları görünür kılmak ve çalışmayı buna göre önceliklendirmektir.\n`,
  );
  P.push('---\n');

  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** genel akademik başarısı **%${overall}** (${scores.level || '—'}) düzeyinde. ${scores.levelDesc || ''} ` +
    `En güçlü alan **${scores.strongest?.name || sectionList[0]?.name} (%${scores.strongest?.pct ?? sectionList[0]?.pct})**, ` +
    `en çok gelişime açık alan **${scores.weakest?.name || sectionList[sectionList.length - 1]?.name} (%${scores.weakest?.pct ?? sectionList[sectionList.length - 1]?.pct})**. ` +
    `${scores.gapDesc ? scores.gapDesc + ' ' : ''}` +
    `Aşağıdaki bölümler; beceri kırılımını, güçlü/gelişim alanlarını ve çalışma yol haritasını ayrıntılandırır.\n`,
  );
  P.push('---\n');

  P.push(`## 📊 2. Beceri Profili\n`);
  P.push(gauge('Genel Akademik Başarı', overall, { zones: 'Gelişmeli:0-40,Orta:40-70,Güçlü:70-100', caption: scores.levelDesc || '' }));
  if (sectionList.length >= 3 && sectionList.length <= 8) {
    P.push(radarBlock('Beceri Bazında Başarı (%)', sectionList.map((s) => [s.name, s.pct])));
  } else if (sectionList.length) {
    P.push(barsBlock('Beceri Bazında Başarı (%)', sectionList.slice(0, 6).map((s) => [s.name, s.pct])));
  }
  if (sectionList.length) {
    P.push(`| Beceri | Başarı | Grafik | Düzey |\n|---|---|---|---|`);
    P.push(sectionList.map((s) => { const b = perfBand(s.pct); return `| ${s.name} | %${s.pct} | ${bar(s.pct)} | ${b.risk} ${b.label} |`; }).join('\n') + '\n');
  }
  P.push('---\n');

  P.push(`## 🧠 3. Güçlü ve Gelişim Alanları\n`);
  const strong = sectionList.filter((s) => s.pct >= 60).slice(0, 4);
  const weak = sectionList.filter((s) => s.pct < 50).slice(-4);
  if (strong.length) P.push(insight('strength', 'Güçlü Beceriler', strong.map((s) => `• ${s.name} (%${s.pct})`).join('\n')));
  if (weak.length) P.push(insight('action', 'Öncelikli Gelişim Alanları', weak.map((s) => `• ${s.name} (%${s.pct})`).join('\n')));
  if (scores.gapDesc) P.push(insight('note', `Öz-Değerlendirme Farkı${scores.gapType ? ' — ' + scores.gapType : ''}`, `${scores.gapDesc} (Performans %${clampPct(scores.performanceAvg ?? 0)} · Öz-değerlendirme %${clampPct(scores.selfAssessment ?? 0)})`));
  P.push('---\n');

  P.push(`## 🎯 4. Çalışma Yol Haritası\n`);
  const focus = weak.length ? weak : sectionList.slice(-2);
  P.push(`*${name} için önceliklendirilmiş çalışma önerileri (en çok gelişime açık becerilerden başlayarak).*\n`);
  focus.forEach((s, i) => {
    P.push(`**📌 Öncelik ${i + 1}: ${s.name} (%${s.pct})**\n- Bu becerinin temel kavramlarını gözden geçirmek faydalı olabilir.\n- Bol ve kademeli örnek çözmek, beceriyi pekiştirebilir.\n- Hataları bir deftere not edip tekrar etmek kalıcılığı artırabilir.\n`);
  });
  if (strong.length) P.push(`**Güçlü beceriler** (${strong.map((s) => s.name).join(', ')}) korunmalı; bu alanlar özgüveni ve genel başarıyı destekler.\n`);
  P.push('---\n');

  P.push(`## 👨‍👩‍👦 5. Aile ve 👩‍🏫 Öğretmen İçin\n`);
  P.push(`- ${tamlayan(name)} en çok gelişime açık becerilerine (${(weak[0]?.name) || sectionList[sectionList.length - 1]?.name}) küçük, düzenli çalışmalarla odaklanmak fark yaratabilir.\n- Güçlü becerileri fark ettirmek ve takdir etmek, motivasyonu besleyebilir.\n${scores.gapType ? `- Öz-değerlendirme ile performans arasındaki fark (${scores.gapType.toLowerCase()}), gerçekçi hedefler koymada dikkate alınabilir.\n` : ''}`);
  P.push('---\n');

  P.push(`## 📌 6. Öncelik Özeti\n`);
  P.push(insight('strength', 'Güçlü Alan', `${scores.strongest?.name || sectionList[0]?.name} (%${scores.strongest?.pct ?? sectionList[0]?.pct}) — bu güç korunmalı.`));
  P.push(insight('action', 'Öncelikli Gelişim', `${scores.weakest?.name || sectionList[sectionList.length - 1]?.name} (%${scores.weakest?.pct ?? sectionList[sectionList.length - 1]?.pct}) — kademeli, düzenli çalışma denenebilir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `Akademik beceriler, hedefli ve düzenli çalışmayla gelişir. ${name} için güçlü alanları koruyan, gelişim alanlarına odaklanan bir plan, zamanla genel başarıyı yükseltebilir. 🌱\n`,
  );
  P.push(reportFooter());
  return P.join('\n');
}
