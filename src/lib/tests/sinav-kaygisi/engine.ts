import { SINAV_KAYGISI_QUESTIONS, SINAV_KAYGISI_CATEGORIES, SINAV_KAYGISI_TERS_MADDELER } from './data';
import type { SinavKaygisiScores } from '../types';

export function calculateSinavKaygisi(
  answers: Record<string | number, string>
): SinavKaygisiScores {
  const norm: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) norm[Number(k)] = v;

  const categoryScores: Record<string, number> = {};
  for (const [catKey, catInfo] of Object.entries(SINAV_KAYGISI_CATEGORIES)) {
    let score = 0;
    for (const qid of catInfo.questionIds) {
      const ans = norm[qid];
      if (ans == null) continue;
      if (SINAV_KAYGISI_TERS_MADDELER.has(qid)) {
        if (ans === 'Y') score += 1;
      } else {
        if (ans === 'D') score += 1;
      }
    }
    categoryScores[catKey] = score;
  }

  const total = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const maxTotal = Object.values(SINAV_KAYGISI_CATEGORIES).reduce((a, c) => a + c.maxScore, 0);
  const totalPct = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;

  let overallLevel: string, levelEmoji: string;
  if (totalPct >= 75) { overallLevel = 'Çok Yüksek'; levelEmoji = '🔴'; }
  else if (totalPct >= 55) { overallLevel = 'Yüksek'; levelEmoji = '🟠'; }
  else if (totalPct >= 35) { overallLevel = 'Orta'; levelEmoji = '🟡'; }
  else if (totalPct >= 15) { overallLevel = 'Düşük'; levelEmoji = '🔵'; }
  else { overallLevel = 'Çok Düşük'; levelEmoji = '🟢'; }

  const anxietyTypes = {
    bedensel: { categories: ['bedensel_tepkiler'], name: 'Bedensel Kaygı', icon: '💪', description: 'Kaygın ağırlıklı olarak bedensel belirtilerle kendini gösteriyor.', strategy: 'Fiziksel rahatlama teknikleri en etkili yöntem.' },
    bilissel: { categories: ['zihinsel_tepkiler', 'hazirlik_endisesi'], name: 'Bilişsel Kaygı', icon: '🧠', description: 'Kaygın ağırlıklı olarak düşünce düzeyinde yaşanıyor.', strategy: 'Bilişsel teknikler en etkili yöntem.' },
    sosyal: { categories: ['baskalari_gorusu', 'kendi_gorusu'], name: 'Sosyal Kaygı', icon: '👥', description: 'Kaygın ağırlıklı olarak başkalarının seni nasıl göreceği endişesinden kaynaklanıyor.', strategy: 'Öz-değer çalışması en etkili yöntem.' },
  };

  const typeScores: Record<string, number> = {};
  for (const [atype, info] of Object.entries(anxietyTypes)) {
    const atypeTotal = (info.categories as string[]).reduce((s, c) => s + (categoryScores[c] ?? 0), 0);
    const atypeMax = (info.categories as string[]).reduce((s, c) => s + (SINAV_KAYGISI_CATEGORIES[c]?.maxScore ?? 0), 0);
    typeScores[atype] = atypeMax > 0 ? Math.round((atypeTotal / atypeMax) * 1000) / 10 : 0;
  }

  const dominantType = Object.entries(typeScores).sort((a, b) => b[1] - a[1])[0][0];
  const dominantInfo = anxietyTypes[dominantType as keyof typeof anxietyTypes];

  const categoriesNamed: Record<string, number> = {};
  for (const [k, v] of Object.entries(categoryScores)) {
    categoriesNamed[SINAV_KAYGISI_CATEGORIES[k].name] = v;
  }

  return { categories: categoryScores, categoriesNamed, total, maxTotal, totalPct, overallLevel, levelEmoji, dominantType, dominantInfo, typeScores };
}

export function generateSinavKaygisiReport(scores: SinavKaygisiScores): string {
  const { categoryScores: _, total, maxTotal, totalPct, overallLevel, levelEmoji, dominantInfo, typeScores } = {
    categoryScores: scores.categories, ...scores
  };

  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const levelMessages: Record<string, string> = {
    'Çok Yüksek': 'Sınav kaygın çok yüksek düzeyde. Bu kesinlikle üstesinden gelinebilir!',
    'Yüksek': 'Sınav kaygın yüksek görünüyor. Ama endişelenme — başa çıkmak tamamen mümkün!',
    'Orta': 'Belirli düzeyde sınav kaygın var. Bu aslında performansını destekleyebilecek sağlıklı bir seviye.',
    'Düşük': 'Sınav kaygın düşük seviyede. Sınavlara karşı sağlıklı bir tutum içindesin!',
    'Çok Düşük': 'Sınav kaygın çok düşük — sınavlara karşı son derece rahat bir tutumun var! 🎉',
  };

  let report = `# 📝 SINAV KAYGISI DEĞERLENDİRME RAPORU\n\n**Genel Kaygı Düzeyin:** ${levelEmoji} **${overallLevel}** (${total}/${maxTotal} — %${totalPct})\n\n${levelMessages[overallLevel] ?? ''}\n\n`;

  if (overallLevel === 'Orta') {
    report += `> 💡 **Biliyor muydun?** Araştırmalar, orta düzeyde bir kaygının aslında performansı artırdığını gösteriyor (Yerkes-Dodson Yasası).\n\n`;
  }

  report += `---\n\n## 🎯 Baskın Kaygı Tipin: ${dominantInfo.icon} ${dominantInfo.name}\n\n${dominantInfo.description}\n\n**En Etkili Başa Çıkma Yöntemi:** ${dominantInfo.strategy}\n\n`;

  report += `**Kaygı Tipi Dağılımın:**\n\n| Tip | Düzey |\n|-----|-------|\n`;
  const typeNames: Record<string, string> = { bedensel: '💪 Bedensel', bilissel: '🧠 Bilişsel', sosyal: '👥 Sosyal' };
  for (const [tkey, tpct] of Object.entries(typeScores).sort((a, b) => b[1] - a[1])) {
    report += `| ${typeNames[tkey] ?? tkey} | ${bar(tpct)} %${tpct} |\n`;
  }
  report += `\n---\n\n`;

  const order = ['baskalari_gorusu', 'kendi_gorusu', 'gelecek_endisesi', 'hazirlik_endisesi', 'bedensel_tepkiler', 'zihinsel_tepkiler', 'genel_kaygi'];
  report += `## 📊 Alt Boyut Sonuçların\n\n`;
  for (const catKey of order) {
    const cat = SINAV_KAYGISI_CATEGORIES[catKey];
    if (!cat) continue;
    const score = scores.categories[catKey] ?? 0;
    const pct = cat.maxScore > 0 ? Math.round((score / cat.maxScore) * 1000) / 10 : 0;
    report += `### ${cat.icon} ${cat.name}\n**Puanın:** ${score}/${cat.maxScore} (${bar(pct)} %${pct})\n\n`;

    for (const [lk, ld] of Object.entries(cat.interpretations)) {
      const [lo, hi] = ld.range;
      if (score >= lo && score <= hi) {
        report += `${ld.text}\n\n`;
        if (ld.tips.length > 0) {
          report += `**Sana Özel Öneriler:**\n${ld.tips.map(t => `- 💡 ${t}`).join('\n')}\n\n`;
        }
        break;
      }
    }
    report += `---\n\n`;
  }

  if (totalPct >= 35) {
    report += `## 🛠️ Pratik Baş Etme Teknikleri\n\n### 🫁 Nefes Tekniği (4-7-8)\n4 saniye burundan nefes al → 7 saniye tut → 8 saniye ağızdan ver. Sınav öncesi 3 kez tekrarla.\n\n### 🧠 Düşünce Durdurma\nOlumsuz düşünce geldiğinde zihninde 'DUR!' de. Sonra yerine olumlu bir düşünce koy.\n\n### 🎬 Görselleştirme\nSınavdan önce gözlerini kapat ve kendini sakin, güvenli bir şekilde soruları çözerken hayal et.\n\n---\n\n`;
  }

  report += `## 💬 Son Söz\nSınav kaygısı çok yaygın bir durumdur ve başa çıkmak tamamen mümkündür! Sen bunu başarabilirsin! 💪`;
  return report;
}
