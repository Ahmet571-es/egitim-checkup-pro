/**
 * Çoklu Zekâ — DETAYLI ANALİZ (deterministik, API'SIZ).
 *
 * API tabanlı "detaylı analiz"in yerine geçer: aynı 8 bölümlük profesyonel yapı,
 * BOL renkli grafik (radar/gauge/grid/bars/ring/insight) ve ton — ama tamamen
 * kod ile, öğrencinin GERÇEK puan profiline göre kurulur.
 *
 * Ton: yalın Türkçe, tavsiye edici (emir kipi yok), puan referanslı,
 * olasılıksal ("olabilir/işaret edebilir"), abartısız, klinik tanı yok, kısa cümle.
 */
import { COKLU_ZEKA_DATA, type ZekaKey } from './data';
import type { CokluZekaScores, ZekaScore } from '../types';
import {
  compareBlock, chainBlock, timelineBlock, quadrantBlock, donutBlock, heatmapBlock, insight,
} from '../../report/report-blocks';
import { tamlayan, belirtme, yonelme } from '@/lib/utils/turkish';

export interface CokluZekaStudentInfo {
  studentName: string;
  studentAge?: number | string | null;
  studentGrade?: number | string | null;
  studentGender?: string | null;
}

// ── Yardımcılar ──────────────────────────────────────────
function clampPct(pct: number): number {
  const p = Number.isFinite(pct) ? pct : 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

function bar(pct: number): string {
  const n = Math.max(0, Math.min(10, Math.round(clampPct(pct) / 10)));
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

interface Band { label: string; risk: '🔴' | '🟡' | '🟢'; frame: string; }
function band(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 81) return { label: 'Çok Güçlü', risk: '🟢', frame: 'çok güçlü bir alan; belirgin bir yatkınlık işareti olabilir' };
  if (p >= 61) return { label: 'Güçlü', risk: '🟢', frame: 'güçlü bir alan; sürdürülebilir ve ileri taşınabilir görünüyor' };
  if (p >= 41) return { label: 'Ortalama', risk: '🟡', frame: 'ortalama düzeyde; doğru stratejiyle yükseltilebilir' };
  if (p >= 21) return { label: 'Gelişime Açık', risk: '🟡', frame: 'ortalamanın biraz altında; hedefli çalışma faydalı olabilir' };
  return { label: 'Öncelikli Gelişim', risk: '🔴', frame: 'öncelikli bir gelişim alanı; yapılandırılmış destek denenebilir' };
}

const STRONG_OBS = [
  'Bu puan, ilgili görevlerde daha az zorlanabileceğini ve öğrenmeyi bu kanaldan hızlandırabileceğini düşündürüyor.',
  'Bu düzey, alanı günlük öğrenmede doğal olarak kullanabildiğine işaret edebilir.',
  'Bu güçlü sonuç, ilgili derslerde ve etkinliklerde belirgin bir avantaj oluşturabilir.',
];
const WEAK_OBS = [
  'Bu puan, alanı şu an daha az kullandığını gösterebilir; küçük adımlarla denemek gelişimi destekleyebilir.',
  'Bu düzey, bu alanın henüz gelişmekte olduğuna işaret edebilir; zorlamadan, aşamalı çalışma yerinde olur.',
];

function pctOf(sd: ZekaScore): number { return clampPct(sd?.pct ?? 0); }
function shortName(name: string): string { return name.replace(/\s*Zekâ$/, '').replace(/\s*\(.*\)$/, '').trim(); }

/**
 * Ders alanlarının zekâ türlerine bilinen yükü (0–1). Ölçüm değil; Gardner
 * modelinin tanımından türetilmiş sabit ağırlıklardır.
 */
const SUBJECT_LOAD: Record<string, Partial<Record<ZekaKey, number>>> = {
  'Matematik':          { mantiksal: 1.0, gorsel: 0.6, sozel: 0.3 },
  'Fen / Fizik':        { mantiksal: 0.9, gorsel: 0.7, dogaci: 0.6 },
  'Türkçe / Edebiyat':  { sozel: 1.0, icsel: 0.6, sosyal: 0.4 },
  'Sosyal / Tarih':     { sozel: 0.8, sosyal: 0.7, gorsel: 0.5 },
  'Yabancı dil':        { sozel: 0.9, muziksel: 0.6, sosyal: 0.6 },
  'Görsel sanat':       { gorsel: 1.0, bedensel: 0.5, icsel: 0.4 },
  'Müzik':              { muziksel: 1.0, bedensel: 0.5, sozel: 0.3 },
  'Beden eğitimi':      { bedensel: 1.0, sosyal: 0.6, gorsel: 0.4 },
};

// ── Ana Fonksiyon ────────────────────────────────────────
export function buildCokluZekaDetailedReport(
  result: CokluZekaScores,
  student: CokluZekaStudentInfo,
): string {
  const name = (student.studentName || 'Öğrenci').trim();
  const gradeText = student.studentGrade ? `${student.studentGrade}. Sınıf` : 'Belirtilmemiş';
  const ageText = student.studentAge && student.studentAge !== '—' ? `${student.studentAge}` : 'Belirtilmemiş';

  const { scores, bottom2, profile, synergies } = result;

  const sorted = (Object.entries(scores) as [ZekaKey, ZekaScore][])
    .sort((a, b) => pctOf(b[1]) - pctOf(a[1]));

  const top = sorted[0];
  const topInfo = COKLU_ZEKA_DATA[top[0]];
  const topPct = pctOf(top[1]);
  const topShort = shortName(topInfo.name);

  const weak = bottom2 && bottom2.length ? bottom2[bottom2.length - 1] : sorted[sorted.length - 1];
  const weakInfo = COKLU_ZEKA_DATA[weak[0] as ZekaKey];
  const weakPct = pctOf(weak[1] as ZekaScore);

  // Karşılaştırmalı metrikler
  const strongCount = sorted.filter(([, sd]) => pctOf(sd) >= 60).length;
  const gap = topPct - weakPct;
  const balanceLabel = gap <= 20 ? 'Dengeli' : gap <= 40 ? 'Belirgin' : 'Baskın';
  const balanceDesc = gap <= 20
    ? 'Zekâ alanları birbirine yakın; çok yönlü ve esnek bir öğrenme profilini işaret ediyor olabilir.'
    : gap <= 40
      ? 'Bazı alanlar diğerlerinden belirgin şekilde öne çıkıyor; güçlü yönleri işe koşmak verimli olabilir.'
      : 'Belirli alanlar çok baskın; bu alanları merkeze alan bir plan yüksek verim getirebilir.';

  // Kariyer yönelimleri (en güçlü 3 alandan, tekrarsız)
  const careerSet: string[] = [];
  for (const [k] of sorted.slice(0, 3)) {
    for (const c of COKLU_ZEKA_DATA[k].careers) if (!careerSet.includes(c)) careerSet.push(c);
  }
  const topCareers = careerSet.slice(0, 9);

  const focusKeys = new Set<ZekaKey>([
    ...sorted.slice(0, 3).map(([k]) => k),
    ...sorted.slice(-2).map(([k]) => k),
  ]);

  const P: string[] = [];

  // ══════════ BAŞLIK + ÖĞRENCİ DOSYASI ══════════
  P.push(`# 🧠 ÇOKLU ZEKÂ — DETAYLI ANALİZ RAPORU\n`);
  P.push(
    `| Alan | Bilgi |\n|---|---|\n` +
    `| İsim | ${name} |\n| Yaş | ${ageText} |\n| Sınıf | ${gradeText} |\n` +
    `| Değerlendirme | Çoklu Zekâ — Derinlikli Analiz |\n`,
  );

  // ── Giriş görsel özeti (renkli kart ızgarası)
  P.push(
    `[!grid cols="4"]\n` +
    `[!stat label="En Güçlü Alan" value="${topPct}" unit="%" theme="success" icon="brain"]\n` +
    `[!stat label="Güçlü Alan Sayısı" value="${strongCount}" theme="info" icon="star"]\n` +
    `[!stat label="Profil Dengesi" value="${balanceLabel}" theme="primary" icon="compass"]\n` +
    `[!stat label="Alanlar Arası Fark" value="${gap}" unit=" puan" theme="${gap <= 20 ? 'success' : 'warning'}" icon="activity"]\n` +
    `[/!grid]\n`,
  );
  P.push('---\n');

  // ══════════ ÇOKLU ZEKÂ NEDİR (bilgilendirici giriş) ══════════
  P.push(`## 🔎 Bu Rapor Neyi Ölçer, Neyi Ölçmez?\n`);
  P.push(
    `Çoklu zekâ kuramı (Howard Gardner), zekânın tek bir sayıya indirgenemeyeceğini; ` +
    `insanların **farklı yollarla** öğrendiğini savunur. Bu rapor "zeki mi değil mi" sorusuna değil, ` +
    `**"${name} hangi yollarla daha kolay ve kalıcı öğreniyor?"** sorusuna cevap arar. ` +
    `Sekiz zekâ alanının her biri, bir öğrenme ve ifade kanalıdır. Amaç, güçlü kanalları çalışmanın ` +
    `merkezine almak ve gelişime açık alanları yargılamadan desteklemektir.\n`,
  );
  P.push(insight('note', 'Kapsam',
    `**Ölçer:** ${name} hangi kanallardan daha kolay öğreniyor ve kendini ifade ediyor.\n\n` +
    `**Ölçmez:** IQ, genel zekâ düzeyi, akademik başarı veya yetenek sınırı.\n\n` +
    `Düşük çıkan bir alan "zayıflık" değil, **henüz daha az kullanılan bir kanal** anlamına gelir. ` +
    `Çoklu zekâ kuramı bir öğretim çerçevesidir; standart bir zekâ testi değildir.`));
  P.push('---\n');

  // ══════════ 1. YÖNETİCİ ÖZETİ ══════════
  P.push(`## 📋 1. Yönetici Özeti\n`);
  P.push(
    `**${tamlayan(name)}** en güçlü zekâ alanı **${topInfo.name} (%${topPct})** olarak öne çıkıyor — ${band(topPct).frame}. ` +
    `${profile?.name ? `Genel profil: ${profile.name.replace(/^[^ ]+ /, '')}. > **Öğrenciye anlatım:** "${profile.description}" ` : ''}` +
    `Profilin genel dağılımı **${balanceLabel.toLowerCase()}** görünüyor: ${balanceDesc} ` +
    `En çok gelişime açık alan ise **${weakInfo.name} (%${weakPct})** olarak beliriyor. ` +
    `Aşağıdaki bölümler; güçlü yönleri, gelişim alanlarını, uygulanabilir bir çalışma yol haritasını ve kariyer yönelimlerini ayrıntılandırır.\n`,
  );
  P.push('---\n');

  // ══════════ 2. SONUÇ TABLOSU + RADAR + RING ══════════
  P.push(`## 📊 2. Zekâ Profili — Sonuç Tablosu\n`);
  P.push(
    `**Tek cümle sonuç:** ${name}, en çok **${topInfo.name.toLowerCase()}** ile öne çıkıyor; ` +
    `profili, güçlü yönleri işe koşan bir çalışma planına uygun görünüyor.\n`,
  );
  // Radar — 8 zekâ (renkli örümcek grafik, MI için ideal)
  P.push(
    `[!radar title="Çoklu Zekâ Profili (%)"]\n` +
    sorted.map(([k, sd]) => `${COKLU_ZEKA_DATA[k].name}: ${pctOf(sd)}`).join('\n') +
    `\n[/!radar]\n`,
  );
  // Ring — en güçlü alanın skoru
  P.push(donutBlock('En Güçlü Üç Zekâ Alanı', sorted.slice(0, 3).map(([k, sd]) => [shortName(COKLU_ZEKA_DATA[k].name), pctOf(sd)] as [string, number]), topShort));
  P.push(`[!ring label="${topShort}" value="${topPct}" max="100" caption="En güçlü zekâ alanı"]\n`);
  // Detaylı tablo
  P.push(`| Zekâ Türü | Puan | Yüzde | Grafik | Düzey |\n|---|---|---|---|---|`);
  P.push(
    sorted.map(([k, sd]) => {
      const b = band(pctOf(sd));
      return `| ${COKLU_ZEKA_DATA[k].icon} ${COKLU_ZEKA_DATA[k].name} | ${sd.raw}/${sd.max} | %${pctOf(sd)} | ${bar(pctOf(sd))} | ${b.risk} ${b.label} |`;
    }).join('\n') + '\n',
  );
  P.push('---\n');

  // ══════════ 2B. NEDEN — SKORUN ARKASINDAKİ ÖRÜNTÜ ══════════
  P.push(`## 🧩 NEDEN Böyle Bir Profil Çıktı?\n`);
  P.push(
    `Her zekâ alanı için ayrı bir madde grubu sorulur. ${tamlayan(name)} katılım düzeyi ` +
    `**${topInfo.name.toLocaleLowerCase('tr')}** maddelerinde en yükseğe çıktığı için bu alan öne çıktı. ` +
    `Aşağıdaki grafik, her alanın **orta düzeyden (%50)** ne kadar saptığını gösterir.\n`,
  );
  P.push(compareBlock(
    'Zekâ Alanları — Orta Düzeyle Karşılaştırma',
    sorted.map(([k, sd]) => [shortName(COKLU_ZEKA_DATA[k].name), pctOf(sd), 50] as [string, number, number]),
    { selfLabel: name.split(' ')[0] || name, refLabel: 'Orta düzey' },
  ));
  P.push(
    `Pozitif fark, alanın **güçlü**; negatif fark **gelişime açık** olduğunu gösterir. ` +
    `En yüksek ve en düşük alan arasındaki **${gap} puanlık** fark, profilin ne kadar uçlaştığını anlatır.\n`,
  );
  P.push('---\n');

  // ══════════ 2C. DENGE ANALİZİ ══════════
  P.push(`## ⚖️ Denge Analizi — Ne Kadar Güçlü, Ne Kadar Dengeli?\n`);
  P.push(quadrantBlock(
    'Güç Düzeyi × Profil Dengesi',
    topPct, clampPct(100 - gap * 1.6),
    'En güçlü alanın gücü', 'Alanlar arası denge',
    ['Gelişmekte', 'Tek alan baskın', 'Dengeli ama orta', 'Güçlü ve dengeli'],
    'Konum bir sıralama değildir; profilin nasıl kullanılacağını gösterir.',
  ));
  P.push(
    gap <= 20
      ? `Alanlar birbirine yakın (fark ${gap} puan). ${name} farklı kanalları esnekçe kullanabiliyor olabilir. Çeşitlendirilmiş görevler verimli olabilir.\n`
      : gap <= 40
        ? `Bazı alanlar belirgin şekilde öne çıkıyor (fark ${gap} puan). Güçlü kanalları merkeze alan bir plan verimli olabilir.\n`
        : `Profil belirgin şekilde uçlaşmış (fark ${gap} puan). En güçlü alanları merkeze almak yüksek verim getirebilir; zayıf alanlar zorlamadan desteklenmelidir.\n`,
  );
  P.push('---\n');

  // ══════════ 2D. NİÇİN — ETKİ ZİNCİRLERİ ══════════
  P.push(`## 🔗 NİÇİN Önemli? — Neden, Etki ve Sonuç\n`);
  P.push(`Aşağıdaki zincirler, profilin günlük okul hayatına nasıl yansıyabileceğini gösterir.\n`);
  P.push(chainBlock('Zekâ Profilinin Yansımaları', [
    [
      `${shortName(topInfo.name)} güçlü (%${topPct})`,
      topInfo.strengths[0],
      `İlgili derslerde daha az zorlanabilir; bu kanal öğrenmeyi hızlandırabilir`,
    ],
    [
      `${shortName(weakInfo.name)} gelişime açık (%${weakPct})`,
      weakInfo.description.replace(/\s*$/, ''),
      `Bu alandaki görevlerde ek zaman veya farklı sunum gerekebilir`,
    ],
    [
      gap <= 20 ? `Alanlar dengeli (fark ${gap} puan)` : `Alanlar arası fark yüksek (${gap} puan)`,
      gap <= 20 ? 'Farklı görev tiplerine uyum sağlaması kolay olabilir' : 'Görev tipi değiştiğinde performansı dalgalanabilir',
      gap <= 20 ? 'Çeşitlendirilmiş ödevler verimli olabilir' : 'Güçlü kanaldan giriş yapan ödev tasarımı verimli olabilir',
    ],
    [
      `Güçlü alan sayısı: ${strongCount}`,
      strongCount >= 3 ? 'Birden fazla kanaldan öğrenebiliyor olabilir' : 'Öğrenme yolu daha dar bir kanala bağlı olabilir',
      strongCount >= 3 ? 'Proje tabanlı çalışmalar iyi sonuç verebilir' : 'Tek ve tanıdık bir yöntemde derinleşmek daha verimli olabilir',
    ],
  ]));
  P.push('---\n');

  // ══════════ 2E. DERS ALANI UYUM HARİTASI ══════════
  P.push(`## 🗺️ Ders Alanlarına Uyum Haritası\n`);
  P.push(
    `Aşağıdaki tablo, ${tamlayan(name)} zekâ profili ile ders alanlarının bilinen kanal yükünü birleştirir. ` +
    `Yüksek değer, o dersin mevcut güçlü kanallarla **daha kolay eşleşebileceğini** gösterir. ` +
    `Düşük değer başarısızlık değil, **farklı bir giriş yolu gerekebileceği** anlamına gelir.\n`,
  );
  {
    const top3keys = sorted.slice(0, 3).map(([k]) => k);
    const cols = top3keys.map((k) => shortName(COKLU_ZEKA_DATA[k].name));
    const rows: [string, number[]][] = Object.keys(SUBJECT_LOAD).map((sub) => [
      sub,
      top3keys.map((k) => clampPct(pctOf(scores[k]) * (SUBJECT_LOAD[sub][k] ?? 0.3))),
    ]);
    P.push(heatmapBlock('Ders Alanı × Güçlü Zekâ Kanalları', cols, rows,
      'Bu tablo bir başarı tahmini değil, profilden türetilmiş bir uyum göstergesidir.'));
    const ranked = rows.map(([s, v]) => [s, Math.max(...v)] as [string, number]).sort((a, b) => b[1] - a[1]);
    P.push(`En yüksek uyum **${ranked[0][0].toLocaleLowerCase('tr')}** alanında. En çok strateji desteği gerekebilecek alan: **${ranked[ranked.length - 1][0].toLocaleLowerCase('tr')}**.\n`);
  }
  P.push('---\n');

  // ══════════ 3. DERİNLEMESİNE YORUM + GAUGE ══════════
  P.push(`## 🧠 3. Derinlemesine Yorum\n`);
  P.push(`*En belirgin güçlü ve gelişime açık alanlar ayrıntılı, diğerleri özet olarak ele alınıyor.*\n`);
  // Gauge — en güçlü alanın hangi bölgede olduğu (renkli kuşaklı)
  P.push(
    `[!gauge label="${topShort}" value="${topPct}" max="100" zones="Gelişmekte:0-40,Orta:40-60,Güçlü:60-100" caption="En güçlü alanın konumu"]\n`,
  );

  let strongIdx = 0, weakIdx = 0;
  const compactLines: string[] = [];

  sorted.forEach(([k, sd]) => {
    const d = COKLU_ZEKA_DATA[k];
    const p = pctOf(sd);
    const b = band(p);

    if (!focusKeys.has(k)) {
      compactLines.push(`- **${d.icon} ${d.name} (%${p})** — ${b.risk} ${b.label}. En belirgin yönü: ${d.strengths[0].toLowerCase()}.`);
      return;
    }
    if (p >= 61) {
      const obs = STRONG_OBS[strongIdx++ % STRONG_OBS.length];
      P.push(
        `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
        `> **Öğrenciye anlatım:** "${d.description}" Özellikle "${d.strengths[0].toLowerCase()}" ve "${(d.strengths[1] ?? d.strengths[0]).toLowerCase()}" gibi yönler bu tabloyu destekliyor. ${obs}\n\n` +
        `*Okulda nasıl görünür:* Bu alan; ${d.careers.slice(0, 2).join(' ve ').toLowerCase()} gibi yönelimlerle ilişkili derslerde daha rahat ilerlemeyi getirebilir.\n\n` +
        `*Öneri:* ${name} için "${d.studyTips[0]}" yaklaşımı, bu güçlü alanı çalışmanın merkezine almanın somut bir yolu olabilir.\n`,
      );
    } else {
      const obs = WEAK_OBS[weakIdx++ % WEAK_OBS.length];
      P.push(
        `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
        `> **Öğrenciye anlatım:** "${d.description}" ${obs}\n\n` +
        `*Öneri:* "${d.studyTips[0]}" adımını denemek, bu alanı zorlamadan desteklemeye yardımcı olabilir.\n`,
      );
    }
  });
  if (compactLines.length) P.push(`**Diğer alanlar (özet):**\n${compactLines.join('\n')}\n`);

  if (profile?.name) {
    P.push(
      `### 🎯 Genel Profil Sentezi: ${profile.name}\n\n> **Öğrenciye anlatım:** "${profile.description}" ` +
      `Profilin dağılımı **${balanceLabel.toLowerCase()}**: ${balanceDesc}\n`,
    );
  }
  if (synergies && synergies.length) {
    P.push(`### 🔗 Öne Çıkan Güç Birleşimleri\n`);
    for (const syn of synergies.slice(0, 3)) {
      P.push(`[!insight type="strength" title="${syn.name.replace(/^[^ ]+ /, '')}"]\n${syn.detail} Bu birleşim, ${name} için ilgili alanlarda doğal bir avantaj oluşturabilir.\n[/!insight]\n`);
    }
  }
  P.push('---\n');

  // ══════════ 4. GÜÇLÜ YÖNLER ══════════
  const strongList = sorted.filter(([, sd]) => pctOf(sd) >= 50).slice(0, 5);
  const strongUse = strongList.length ? strongList : sorted.slice(0, 3);
  P.push(`## 💪 4. Güçlü Yönler Analizi\n`);
  P.push(
    `[!insight type="strength" title="Öne Çıkan Güç: ${topShort}"]\n` +
    `${topInfo.strengths.slice(0, 3).join(', ')} gibi yönler ${tamlayan(name)} en güçlü kanalını oluşturuyor (%${topPct}). Bu alanı görevlerde ve çalışma yönteminde öne çıkarmak faydalı olabilir.\n[/!insight]\n`,
  );
  P.push(`| # | Güçlü Alan | Kanıt | Okulda Nasıl Görünür? | Nasıl İleri Taşınır? | Kariyer Bağlantısı |\n|---|---|---|---|---|---|`);
  P.push(
    strongUse.map(([k, sd], i) => {
      const d = COKLU_ZEKA_DATA[k];
      return `| ${i + 1} | ${d.icon} ${d.name} | %${pctOf(sd)} | ${d.strengths[0]} | ${d.studyTips[0]} | ${d.careers.slice(0, 3).join(', ')} |`;
    }).join('\n') + '\n',
  );
  P.push('---\n');

  // ══════════ 5. GELİŞİM ALANLARI ══════════
  const devList = sorted.filter(([, sd]) => pctOf(sd) < 50).slice(-4);
  const devUse = devList.length ? devList : sorted.slice(-2);
  P.push(`## 🌱 5. Gelişim Alanları ve Destek Önerileri\n`);
  P.push(
    `[!insight type="action" title="Öncelikli Destek: ${shortName(weakInfo.name)}"]\n` +
    `${weakInfo.name} (%${weakPct}) şu an en çok gelişime açık alan. "${weakInfo.studyTips[0]}" gibi küçük adımlarla, ${tamlayan(name)} güçlü olduğu kanallar üzerinden desteklemek denenebilir.\n[/!insight]\n`,
  );
  P.push(`| # | Gelişim Alanı | Mevcut Durum | Düzey | Bu Neden Önemli? | Önerilen Çalışma |\n|---|---|---|---|---|---|`);
  P.push(
    devUse.map(([k, sd], i) => {
      const d = COKLU_ZEKA_DATA[k];
      const b = band(pctOf(sd));
      return `| ${i + 1} | ${d.icon} ${d.name} | %${pctOf(sd)} | ${b.risk} ${b.label} | Öğrenme esnekliğini artırabilir | ${d.studyTips[0]} |`;
    }).join('\n') + '\n',
  );
  P.push('---\n');

  // ══════════ 6. AKADEMİK ÇALIŞMA YOL HARİTASI + BARS ══════════
  P.push(`## 🎯 6. Akademik Çalışma Yol Haritası\n`);
  P.push(`*${tamlayan(name)} güçlü zekâ alanlarından türetilmiş, uygulanabilir çalışma stratejileri.*\n`);
  const strategySources = sorted.slice(0, 3);
  // Bars — hangi kanallar öne çıkıyor
  P.push(
    `[!bars title="Çalışmanın Merkezine Alınabilecek Kanallar (%)"]\n` +
    strategySources.map(([k, sd]) => `${shortName(COKLU_ZEKA_DATA[k].name)}: ${pctOf(sd)}`).join('\n') +
    `\n[/!bars]\n`,
  );
  P.push(timelineBlock(`${shortName(topInfo.name)} Merkezli 8 Haftalık Plan`, [
    ['Mevcut yöntemi konuşun', `${name} şu an nasıl çalışıyor — birlikte yazın.`, '1. hafta'],
    [`${shortName(topInfo.name)} kanalını devreye al`, topInfo.studyTips[0], '1–2. hafta'],
    ['Tek derste dene', 'En çok zorlandığı derste bu yöntemi uygulayın.', '2–3. hafta'],
    ['Sonucu ölç', 'Aynı konuda öncesi/sonrası farkı konuşun.', '3. hafta'],
    [strategySources[1] ? `İkinci kanalı ekle — ${shortName(COKLU_ZEKA_DATA[strategySources[1][0]].name)}` : 'İkinci yöntemi ekle',
      strategySources[1] ? COKLU_ZEKA_DATA[strategySources[1][0]].studyTips[0] : 'Farklı bir çalışma biçimi deneyin.', '4–5. hafta'],
    ['Gelişim alanına küçük dokunuş', `${shortName(weakInfo.name)} için: ${weakInfo.studyTips[0]}`, '5–6. hafta'],
    ['Proje ile birleştir', 'Güçlü kanalları birlikte kullanan küçük bir proje verin.', '6–7. hafta'],
    ['Rutine dönüştür', 'İşe yarayan yöntemleri haftalık plana sabitleyin.', '8. hafta'],
  ]));
  strategySources.forEach(([k, sd], idx) => {
    const d = COKLU_ZEKA_DATA[k];
    P.push(
      `**📌 Strateji ${idx + 1}: ${d.name} Yöntemiyle Çalışma**\n` +
      `- **Neden:** Çünkü ${tamlayan(name)} ${d.name.toLowerCase()} puanı (%${pctOf(sd)}) bu yaklaşımı destekliyor.\n` +
      `- **Nasıl uygulanabilir:**\n${d.studyTips.map((t) => `   - ${t}`).join('\n')}\n` +
      `- **Beklenen fayda:** Bilgi, ${tamlayan(name)} en rahat öğrendiği kanaldan işlendiği için kalıcılığın artması beklenebilir.\n`,
    );
  });
  P.push('---\n');

  // ══════════ 7. KARİYER YÖNELİMLERİ (yeni, bilgilendirici) ══════════
  P.push(`## 🧭 7. Kariyer Yönelimleri\n`);
  P.push(
    `Aşağıdaki alanlar, ${tamlayan(name)} en güçlü üç zekâ kanalıyla ilişkili mesleklerden derlenmiştir. ` +
    `Bunlar bir **öneri havuzudur**, kesin bir yönlendirme değil — ilgi ve değerlerle birlikte değerlendirilmesi yerinde olur.\n`,
  );
  P.push(
    `[!insight type="note" title="İlgili Meslek Alanları"]\n${topCareers.join(' · ')}\n[/!insight]\n`,
  );
  if (synergies && synergies.length) {
    P.push(`**Güç birleşimlerine göre yönelimler:**\n${synergies.slice(0, 3).map((s) => `- ${s.detail}`).join('\n')}\n`);
  }
  P.push('---\n');

  // ══════════ 8. AİLE BÖLÜMÜ ══════════
  P.push(`## 👨‍👩‍👦 8. Aile İçin Rehber\n`);
  P.push(
    `### Bu Sonuçlar Ne Anlama Geliyor?\n` +
    `${tamlayan(name)} profili, öğrenmeyi en çok **${topInfo.name.toLowerCase()}** üzerinden desteklediğini gösteriyor olabilir. ` +
    `Evdeki desteği, bu güçlü kanalı gözeterek düzenlemek verimi artırabilir.\n`,
  );
  P.push(
    `### ✅ Evde Denenebilecekler\n` +
    strategySources.flatMap(([k]) => COKLU_ZEKA_DATA[k].studyTips.slice(0, 2)).slice(0, 5)
      .map((t) => `- ${t} *(Çünkü güçlü alanlarını destekler.)*`).join('\n') + '\n',
  );
  P.push(
    `### 🗣️ İletişim Önerisi\n` +
    `- Başarı gösterdiğinde: çabayı ve yöntemi öv ("Bu konuyu şu şekilde çalışman iyi olmuş").\n` +
    `- Zorlandığında: alanı değil yöntemi sorgula ("Belki farklı bir yolla denemek işe yarayabilir").\n`,
  );
  P.push('---\n');

  // ══════════ 9. ÖĞRETMEN BÖLÜMÜ ══════════
  P.push(`## 👩‍🏫 9. Öğretmen ve Rehber Öğretmen İçin\n`);
  P.push(
    `### Sınıf İçi Stratejiler\n` +
    strategySources.map(([k]) => `- **${COKLU_ZEKA_DATA[k].name}:** ${COKLU_ZEKA_DATA[k].studyTips[0]}`).join('\n') + '\n' +
    `- Güçlü alanları görev seçiminde işe koşmak, ${tamlayan(name)} derse katılımını artırabilir.\n`,
  );
  P.push(
    `### Geri Bildirim Yaklaşımı\n` +
    `- Somut ve yönteme dönük geri bildirim, genel övgüden daha etkili olabilir.\n` +
    `- Gelişim alanlarında ilerlemeyi, ${tamlayan(name)} güçlü olduğu kanallar üzerinden desteklemek denenebilir.\n`,
  );
  P.push('---\n');

  // ══════════ ÖNCELİK + KAPANIŞ + ÖZET İÇGÖRÜLER ══════════
  P.push(`## 📌 10. Öncelik Özeti\n`);
  P.push(`| Öncelik | Odak | Yaklaşım |\n|---|---|---|`);
  P.push(
    `| 1. 🟢 Pekiştir | ${topInfo.name} (%${topPct}) | Güçlü alanı çalışma yönteminin merkezine al |\n` +
    `| 2. 🟡 Geliştir | ${weakInfo.name} (%${weakPct}) | Küçük adımlarla, güçlü kanallar üzerinden destekle |\n` +
    `| 3. 🟢 Dengele | Genel profil | Farklı yöntemleri deneyerek öğrenme esnekliğini artır |\n`,
  );
  // Özet aksiyon içgörüleri (renkli)
  P.push(`[!insight type="strength" title="Pekiştir"]\n${topInfo.name} (%${topPct}) en güçlü kanal. Çalışma planının merkezine almak verimi artırabilir.\n[/!insight]\n`);
  P.push(`[!insight type="action" title="Geliştir"]\n${weakInfo.name} (%${weakPct}) için "${weakInfo.studyTips[0]}" gibi küçük adımlar denenebilir.\n[/!insight]\n`);
  P.push(`[!insight type="note" title="Dengele"]\nFarklı yöntemleri deneyerek öğrenme esnekliğini artırmak, uzun vadede faydalı olabilir.\n[/!insight]\n`);
  P.push('---\n');

  // ══════════ 11. SINIRLILIKLAR ══════════
  P.push(`## 📎 11. Sınırlılıklar ve Doğru Kullanım\n`);
  P.push(insight('note', 'Bu Rapor Nasıl Okunmalı?',
    `- Sonuçlar ${tamlayan(name)} kendi beyanına dayanır; günlük ruh hâli cevapları etkileyebilir.\n` +
    `- Çoklu zekâ bir öğretim çerçevesidir; standart bir zekâ ölçeği değildir.\n` +
    `- Düşük puanlı alan "yeteneksizlik" anlamına gelmez; desteklendikçe gelişebilir.\n` +
    `- Uyum haritası ve kariyer bölümü ölçüm değil, yöntem seçimine yardımcı göstergelerdir.\n` +
    `- Bu rapor tanı aracı değildir; öğrenme güçlüğü şüphesinde uzman değerlendirmesi gerekir.`));
  P.push(
    `\n### Kapanış Notu\n` +
    `${tamlayan(name)} çoklu zekâ profili, öğrenmeye açık ve yönlendirilebilir bir tabloyu işaret ediyor. ` +
    `Güçlü alanları merkeze alan, gelişim alanlarını yargılamadan destekleyen bir yaklaşım en verimli sonucu getirebilir. ` +
    `Bu profil bir kader değil, bir yol haritasıdır ve zamanla gelişebilir. 🌱\n`,
  );
  P.push(`\n---\n*Bu rapor, EĞİTİM CHECK UP Pro deterministik analiz motoru tarafından, öğrencinin puan profiline göre üretilmiştir. Klinik tanı içermez.*`);

  return P.join('\n');
}
