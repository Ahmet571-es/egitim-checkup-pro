import { VARK_SCORING, VARK_STYLES } from './data';
import type { VarkScores } from '../types';

export function calculateVark(
  answers: Record<string | number, string | string[]>
): VarkScores {
  const varkCounts: Record<string, number> = { V: 0, A: 0, R: 0, K: 0 };

  for (const [qidRaw, selectedOptions] of Object.entries(answers)) {
    const qid = Number(qidRaw);
    if (!(qid in VARK_SCORING)) continue;
    const opts = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];
    for (const opt of opts) {
      const optLower = opt.toLowerCase();
      if (optLower in VARK_SCORING[qid]) {
        varkCounts[VARK_SCORING[qid][optLower]] += 1;
      }
    }
  }

  const total = Object.values(varkCounts).reduce((a, b) => a + b, 0);
  const percentages: Record<string, number> = {};
  for (const [k, v] of Object.entries(varkCounts)) {
    percentages[k] = total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
  }

  const sorted = Object.entries(varkCounts).sort((a, b) => b[1] - a[1]) as [string, number][];
  const dominant = sorted[0];
  const second = sorted[1];

  // Fleming standardı: fark <= 2 ise multimodal
  const isMultimodal = dominant[1] - second[1] <= 2 && dominant[1] > 0;

  return { counts: varkCounts, percentages, totalResponses: total, sorted, dominant, isMultimodal };
}

export function generateVarkReport(scores: VarkScores): string {
  const { counts, percentages, sorted, dominant, isMultimodal } = scores;
  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  let report = `# 🎯 VARK ÖĞRENME STİLİ RAPORU\n\n---\n\n## 📊 Öğrenme Stili Profilin\n\n| Stil | Puan | Yüzde | Grafik |\n|---|---|---|---|\n`;
  for (const [sk, cnt] of sorted) {
    const s = VARK_STYLES[sk];
    const pct = percentages[sk];
    report += `| ${s.icon} ${s.name} | ${cnt} | %${pct} | ${bar(pct)} |\n`;
  }
  report += '\n---\n\n';

  if (isMultimodal) {
    const topTwo = sorted.slice(0, 2);
    report += `## 🌟 Senin Öğrenme Stilin: Çok Modlu (Multimodal)\n\nBirden fazla öğrenme stilini eşit derecede kullanıyorsun!\n\n`;
    report += `En güçlü iki stilin: **${VARK_STYLES[topTwo[0][0]].name}** ve **${VARK_STYLES[topTwo[1][0]].name}**\n\n`;
    for (const [sk] of topTwo) {
      const s = VARK_STYLES[sk];
      report += `### ${s.icon} ${s.name}\n\n${s.description}\n\n**Ders Çalışma İpuçları:**\n`;
      report += s.studyTips.map(t => `- ${t}`).join('\n') + '\n\n';
    }
  } else {
    const s = VARK_STYLES[dominant[0]];
    report += `## 🌟 Senin Baskın Öğrenme Stilin: ${s.icon} ${s.name}\n\n${s.description}\n\n`;
    report += `**Seni Tanımlayan Özellikler:**\n${s.characteristics.map(c => `- ✅ ${c}`).join('\n')}\n\n`;
    report += `**Sana Özel Ders Çalışma İpuçları:**\n${s.studyTips.map(t => `- ${t}`).join('\n')}\n\n`;
    report += `⚠️ **Dikkat:** ${s.avoid}\n\n`;
  }

  const weakestKey = sorted[sorted.length - 1][0];
  const weakestStyle = VARK_STYLES[weakestKey];
  report += `---\n\n## 🌱 Zayıf Stilini Güçlendirme: ${weakestStyle.icon} ${weakestStyle.name}\n\n`;
  report += `En az kullandığın öğrenme stili **${weakestStyle.name}**. Bu stili de geliştirmek, öğrenme esnekliğini artırır:\n\n`;
  report += weakestStyle.studyTips.slice(0, 3).map(t => `- 🌱 ${t}`).join('\n') + '\n\n';

  report += `---\n\n## 💬 Son Söz\nÖğrenme stilini bilmek, daha verimli çalışmanın anahtarıdır! Baskın stilini kullanarak başla, diğer stilleri de deneyerek öğrenme repertuarını genişlet. 🚀`;
  return report;
}
