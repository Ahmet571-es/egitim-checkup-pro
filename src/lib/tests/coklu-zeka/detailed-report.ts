/**
 * Çoklu Zekâ — DETAYLI ANALİZ (deterministik, API'SIZ).
 *
 * API tabanlı "detaylı analiz"in yerine geçer: aynı 8 bölümlük profesyonel yapı,
 * grafikler ve ton — ama tamamen kod ile, uzman yazımı yorum parçalarından
 * öğrencinin GERÇEK puan profiline göre kurulur.
 *
 * Ton: yalın Türkçe, tavsiye edici (emir kipi yok), puan referanslı,
 * olasılıksal ("olabilir/işaret edebilir"), abartısız, klinik tanı yok, kısa cümle.
 */
import { COKLU_ZEKA_DATA, type ZekaKey } from './data';
import type { CokluZekaScores, ZekaScore } from '../types';

export interface CokluZekaStudentInfo {
  studentName: string;
  studentAge?: number | string | null;
  studentGrade?: number | string | null;
  studentGender?: string | null;
}

// ── Yardımcılar ──────────────────────────────────────────
/** Görüntülenecek yüzdeyi 0-100 aralığına kırpar (bozuk veriye karşı savunma). */
function clampPct(pct: number): number {
  const p = Number.isFinite(pct) ? pct : 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

function bar(pct: number): string {
  const n = Math.max(0, Math.min(10, Math.round(clampPct(pct) / 10)));
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

interface Band {
  label: string;
  risk: '🔴' | '🟡' | '🟢';
  frame: string;
}

function band(pct: number): Band {
  const p = clampPct(pct);
  if (p >= 81) return { label: 'Çok Güçlü', risk: '🟢', frame: 'çok güçlü bir alan; belirgin bir yatkınlık işareti olabilir' };
  if (p >= 61) return { label: 'Güçlü', risk: '🟢', frame: 'güçlü bir alan; sürdürülebilir ve ileri taşınabilir görünüyor' };
  if (p >= 41) return { label: 'Ortalama', risk: '🟡', frame: 'ortalama düzeyde; doğru stratejiyle yükseltilebilir' };
  if (p >= 21) return { label: 'Gelişime Açık', risk: '🟡', frame: 'ortalamanın biraz altında; hedefli çalışma faydalı olabilir' };
  return { label: 'Öncelikli Gelişim', risk: '🔴', frame: 'öncelikli bir gelişim alanı; yapılandırılmış destek denenebilir' };
}

// Güçlü alanlar için çeşitlendirilmiş gözlem cümleleri (index ile deterministik seçim).
const STRONG_OBS = [
  'Bu puan, ilgili görevlerde daha az zorlanabileceğini ve öğrenmeyi bu kanaldan hızlandırabileceğini düşündürüyor.',
  'Bu düzey, alanı günlük öğrenmede doğal olarak kullanabildiğine işaret edebilir.',
  'Bu güçlü sonuç, ilgili derslerde ve etkinliklerde belirgin bir avantaj oluşturabilir.',
];
const WEAK_OBS = [
  'Bu puan, alanı şu an daha az kullandığını gösterebilir; küçük adımlarla denemek gelişimi destekleyebilir.',
  'Bu düzey, bu alanın henüz gelişmekte olduğuna işaret edebilir; zorlamadan, aşamalı çalışma yerinde olur.',
];

function pctOf(sd: ZekaScore): number {
  return clampPct(sd?.pct ?? 0);
}

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

  const weak = bottom2 && bottom2.length ? bottom2[bottom2.length - 1] : sorted[sorted.length - 1];
  const weakInfo = COKLU_ZEKA_DATA[weak[0] as ZekaKey];
  const weakPct = pctOf(weak[1] as ZekaScore);

  // Odak seti: en güçlü 3 + en zayıf 2 (tam yorum). Ortadakiler kısa satır.
  const focusKeys = new Set<ZekaKey>([
    ...sorted.slice(0, 3).map(([k]) => k),
    ...sorted.slice(-2).map(([k]) => k),
  ]);

  const parts: string[] = [];

  // ══════════ BAŞLIK + ÖĞRENCİ DOSYASI ══════════
  parts.push(`# 🧠 ÇOKLU ZEKÂ — DETAYLI ANALİZ RAPORU\n`);
  parts.push(
    `| Alan | Bilgi |\n|---|---|\n` +
    `| İsim | ${name} |\n| Yaş | ${ageText} |\n| Sınıf | ${gradeText} |\n` +
    `| Değerlendirme | Çoklu Zekâ — Derinlikli Analiz |\n`,
  );
  parts.push('---\n');

  // ══════════ 1. YÖNETİCİ ÖZETİ ══════════
  parts.push(`## 📋 Yönetici Özeti\n`);
  parts.push(
    `**${name}**'in en güçlü zekâ alanı **${topInfo.name} (%${topPct})** olarak öne çıkıyor — ${band(topPct).frame}. ` +
    `${profile?.name ? `Genel profil: ${profile.name.replace(/^[^ ]+ /, '')}. ${profile.description} ` : ''}` +
    `En çok gelişime açık alan ise **${weakInfo.name} (%${weakPct})** görünüyor. ` +
    `Bu rapor, güçlü alanları çalışma yönteminin merkezine almayı ve gelişim alanlarını küçük adımlarla desteklemeyi öneriyor.\n`,
  );
  parts.push(`[!stat label="En Güçlü Alan" value="${topPct}" unit="%" theme="success" icon="brain"]\n`);
  parts.push('---\n');

  // ══════════ 2. SONUÇ TABLOSU + GRAFİK ══════════
  parts.push(`## 📊 1. Zekâ Profili — Sonuç Tablosu\n`);
  parts.push(
    `**Tek cümle sonuç:** ${name}, en çok **${topInfo.name.toLowerCase()}** ile öne çıkıyor; ` +
    `profili, güçlü yönleri işe koşan bir çalışma planına uygun görünüyor.\n`,
  );
  parts.push(
    `[!bars title="Çoklu Zekâ Profili (%)"]\n` +
    sorted.map(([k, sd]) => `${COKLU_ZEKA_DATA[k].name}: ${pctOf(sd)}`).join('\n') +
    `\n[/!bars]\n`,
  );
  parts.push(`| Zekâ Türü | Puan | Yüzde | Grafik | Düzey |\n|---|---|---|---|---|`);
  parts.push(
    sorted.map(([k, sd]) => {
      const b = band(pctOf(sd));
      return `| ${COKLU_ZEKA_DATA[k].icon} ${COKLU_ZEKA_DATA[k].name} | ${sd.raw}/${sd.max} | %${pctOf(sd)} | ${bar(pctOf(sd))} | ${b.risk} ${b.label} |`;
    }).join('\n') + '\n',
  );
  parts.push('---\n');

  // ══════════ 3. DERİNLEMESİNE YORUM ══════════
  parts.push(`## 🧠 2. Derinlemesine Yorum\n`);
  parts.push(`*En belirgin güçlü ve gelişime açık alanlar ayrıntılı, diğerleri özet olarak ele alınıyor.*\n`);

  let strongIdx = 0;
  let weakIdx = 0;
  const compactLines: string[] = [];

  sorted.forEach(([k, sd]) => {
    const d = COKLU_ZEKA_DATA[k];
    const p = pctOf(sd);
    const b = band(p);

    if (!focusKeys.has(k)) {
      compactLines.push(`- **${d.icon} ${d.name} (%${p})** — ${b.label}. ${d.strengths[0]} yönü orta düzeyde destekleniyor.`);
      return;
    }

    if (p >= 61) {
      const obs = STRONG_OBS[strongIdx++ % STRONG_OBS.length];
      parts.push(
        `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
        `${d.description} Özellikle "${d.strengths[0].toLowerCase()}" gibi yönler bu tabloyu destekliyor. ${obs}\n\n` +
        `*Öneri:* ${name} için "${d.studyTips[0]}" yaklaşımı, bu güçlü alanı çalışmanın merkezine almanın somut bir yolu olabilir.\n`,
      );
    } else {
      const obs = WEAK_OBS[weakIdx++ % WEAK_OBS.length];
      parts.push(
        `**${d.icon} ${d.name}: %${p}** — ${b.frame}.\n\n` +
        `${d.description} ${obs}\n\n` +
        `*Öneri:* "${d.studyTips[0]}" adımını denemek, bu alanı zorlamadan desteklemeye yardımcı olabilir.\n`,
      );
    }
  });

  if (compactLines.length) {
    parts.push(`**Diğer alanlar (özet):**\n${compactLines.join('\n')}\n`);
  }

  if (profile?.name) {
    parts.push(
      `### 🎯 Genel Profil Sentezi: ${profile.name}\n\n${profile.description} ` +
      `Bu profil, ${name}'in tek bir alana sıkışmadan, güçlü yönlerini bir arada kullanabileceğini işaret edebilir.\n`,
    );
  }
  if (synergies && synergies.length) {
    parts.push(`### 🔗 Öne Çıkan Güç Birleşimleri\n`);
    for (const syn of synergies.slice(0, 3)) {
      parts.push(
        `[!insight type="strength" title="${syn.name.replace(/^[^ ]+ /, '')}"]\n${syn.detail} Bu birleşim, ${name} için ilgili alanlarda doğal bir avantaj oluşturabilir.\n[/!insight]\n`,
      );
    }
  }
  parts.push('---\n');

  // ══════════ 4. GÜÇLÜ YÖNLER ══════════
  const strongList = sorted.filter(([, sd]) => pctOf(sd) >= 50).slice(0, 5);
  const strongUse = strongList.length ? strongList : sorted.slice(0, 3);
  parts.push(`## 💪 3. Güçlü Yönler Analizi\n`);
  parts.push(`| # | Güçlü Alan | Kanıt | Okulda Nasıl Görünür? | Nasıl İleri Taşınır? | Kariyer Bağlantısı |\n|---|---|---|---|---|---|`);
  parts.push(
    strongUse.map(([k, sd], i) => {
      const d = COKLU_ZEKA_DATA[k];
      return `| ${i + 1} | ${d.icon} ${d.name} | %${pctOf(sd)} | ${d.strengths[0]} | ${d.studyTips[0]} | ${d.careers.slice(0, 3).join(', ')} |`;
    }).join('\n') + '\n',
  );
  parts.push('---\n');

  // ══════════ 5. GELİŞİM ALANLARI ══════════
  const devList = sorted.filter(([, sd]) => pctOf(sd) < 50).slice(-4);
  const devUse = devList.length ? devList : sorted.slice(-2);
  parts.push(`## 🌱 4. Gelişim Alanları ve Destek Önerileri\n`);
  parts.push(`| # | Gelişim Alanı | Mevcut Durum | Düzey | Bu Neden Önemli? | Önerilen Çalışma |\n|---|---|---|---|---|---|`);
  parts.push(
    devUse.map(([k, sd], i) => {
      const d = COKLU_ZEKA_DATA[k];
      const b = band(pctOf(sd));
      return `| ${i + 1} | ${d.icon} ${d.name} | %${pctOf(sd)} | ${b.risk} ${b.label} | Öğrenme esnekliğini artırabilir | ${d.studyTips[0]} |`;
    }).join('\n') + '\n',
  );
  parts.push('---\n');

  // ══════════ 6. ÇALIŞMA YOL HARİTASI ══════════
  parts.push(`## 🎯 5. Akademik Çalışma Yol Haritası\n`);
  parts.push(`*${name}'in güçlü zekâ alanlarından türetilmiş, uygulanabilir çalışma stratejileri.*\n`);
  const strategySources = sorted.slice(0, 3);
  strategySources.forEach(([k, sd], idx) => {
    const d = COKLU_ZEKA_DATA[k];
    parts.push(
      `**📌 Strateji ${idx + 1}: ${d.name} Yöntemiyle Çalışma**\n` +
      `- **Neden:** Çünkü ${name}'in ${d.name.toLowerCase()} puanı (%${pctOf(sd)}) bu yaklaşımı destekliyor.\n` +
      `- **Nasıl uygulanabilir:**\n${d.studyTips.map((t) => `   - ${t}`).join('\n')}\n` +
      `- **Beklenen fayda:** Bilgi, ${name}'in en rahat öğrendiği kanaldan işlendiği için kalıcılığın artması beklenebilir.\n`,
    );
  });
  parts.push('---\n');

  // ══════════ 7. AİLE BÖLÜMÜ ══════════
  parts.push(`## 👨‍👩‍👦 6. Aile İçin Rehber\n`);
  parts.push(
    `### Bu Sonuçlar Ne Anlama Geliyor?\n` +
    `Çoklu zekâ, "zeki mi değil mi" sorusuna değil, "hangi yollarla daha kolay öğreniyor" sorusuna cevap arar. ` +
    `${name}'in profili, öğrenmeyi en çok **${topInfo.name.toLowerCase()}** üzerinden desteklediğini gösteriyor olabilir.\n`,
  );
  parts.push(
    `### ✅ Evde Denenebilecekler\n` +
    strategySources.flatMap(([k]) => COKLU_ZEKA_DATA[k].studyTips.slice(0, 2)).slice(0, 5)
      .map((t) => `- ${t} *(Çünkü güçlü alanlarını destekler.)*`).join('\n') + '\n',
  );
  parts.push(
    `### 🗣️ İletişim Önerisi\n` +
    `- Başarı gösterdiğinde: çabayı ve yöntemi öv ("Bu konuyu şu şekilde çalışman iyi olmuş").\n` +
    `- Zorlandığında: alanı değil yöntemi sorgula ("Belki farklı bir yolla denemek işe yarayabilir").\n`,
  );
  parts.push('---\n');

  // ══════════ 8. ÖĞRETMEN BÖLÜMÜ ══════════
  parts.push(`## 👩‍🏫 7. Öğretmen ve Rehber Öğretmen İçin\n`);
  parts.push(
    `### Sınıf İçi Stratejiler\n` +
    strategySources.map(([k]) => `- **${COKLU_ZEKA_DATA[k].name}:** ${COKLU_ZEKA_DATA[k].studyTips[0]}`).join('\n') + '\n' +
    `- Güçlü alanları görev seçiminde işe koşmak, ${name}'in derse katılımını artırabilir.\n`,
  );
  parts.push(
    `### Geri Bildirim Yaklaşımı\n` +
    `- Somut ve yönteme dönük geri bildirim, genel övgüden daha etkili olabilir.\n` +
    `- Gelişim alanlarında ilerlemeyi, ${name}'in güçlü olduğu kanallar üzerinden desteklemek denenebilir.\n`,
  );
  parts.push('---\n');

  // ══════════ ÖNCELİK + KAPANIŞ ══════════
  parts.push(`## 📌 8. Öncelik Özeti\n`);
  parts.push(`| Öncelik | Odak | Yaklaşım |\n|---|---|---|`);
  parts.push(
    `| 1. 🟢 Pekiştir | ${topInfo.name} (%${topPct}) | Güçlü alanı çalışma yönteminin merkezine al |\n` +
    `| 2. 🟡 Geliştir | ${weakInfo.name} (%${weakPct}) | Küçük adımlarla, güçlü kanallar üzerinden destekle |\n` +
    `| 3. 🟢 Dengele | Genel profil | Farklı yöntemleri deneyerek öğrenme esnekliğini artır |\n`,
  );
  parts.push(
    `\n### Kapanış Notu\n` +
    `${name}'in çoklu zekâ profili, öğrenmeye açık ve yönlendirilebilir bir tabloyu işaret ediyor. ` +
    `Güçlü alanları merkeze alan, gelişim alanlarını yargılamadan destekleyen bir yaklaşım en verimli sonucu getirebilir. ` +
    `Bu profil bir kader değil, bir yol haritasıdır ve zamanla gelişebilir. 🌱\n`,
  );
  parts.push(
    `\n---\n*Bu rapor, EĞİTİM CHECK UP Pro deterministik analiz motoru tarafından, öğrencinin puan profiline göre üretilmiştir. Klinik tanı içermez.*`,
  );

  return parts.join('\n');
}
