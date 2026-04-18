import { HOLLAND_QUESTIONS, HOLLAND_TYPES } from './data';
import type { HollandScores } from '../types';

// Her tipten 14 soru, Likert5 (1-5) → max puan 5 × 14 = 70
const MAX_PER_TYPE = 70;

export function calculateHolland(answers: Record<string | number, number>): HollandScores {
  const norm: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    norm[Number(k)] = Number(v);
  }

  const typeScores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const q of HOLLAND_QUESTIONS) {
    const ans = norm[q.id];
    if (ans != null) {
      typeScores[q.type] += ans;
    }
  }

  const sortedTypes = Object.entries(typeScores).sort((a, b) => b[1] - a[1]) as [string, number][];
  const top3 = sortedTypes.slice(0, 3);
  const hollandCode = top3.map(t => t[0]).join('');

  return {
    R: typeScores.R, I: typeScores.I, A: typeScores.A,
    S: typeScores.S, E: typeScores.E, C: typeScores.C,
    hollandCode, sortedTypes, top3,
  };
}

export function generateHollandReport(scores: HollandScores): string {
  const { top3, hollandCode, sortedTypes } = scores;
  const bar = (pct: number) => {
    // Defansif: pct değeri 0-100 aralığına zorla (NaN, negatif, 100 üstü hepsini yakalar)
    const safePct = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
    const n = Math.round(safePct / 10);
    const filled = Math.max(0, Math.min(10, n));
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  };

  let report = `# 🧭 HOLLAND MESLEKİ İLGİ ENVANTERİ RAPORU\n\n**Senin Holland Kodun: ${hollandCode}**\n\n---\n\n## 📊 İlgi Profil Tablon\n\n| Tip | İsim | Puan | Yüzde | Grafik |\n|---|---|---|---|---|\n`;

  for (const [tkey, tscore] of sortedTypes) {
    const t = HOLLAND_TYPES[tkey];
    const pct = MAX_PER_TYPE > 0 ? Math.round((tscore / MAX_PER_TYPE) * 1000) / 10 : 0;
    report += `| ${t.icon} ${tkey} | ${t.short} | ${tscore}/${MAX_PER_TYPE} | %${pct} | ${bar(pct)} |\n`;
  }

  report += `\n---\n\n## 🌟 Holland Kodun Ne Anlama Geliyor?\n\n**${hollandCode}** kodu, seni en çok tanımlayan üç ilgi alanının birleşimidir.\n\n`;

  const medals = ['🥇', '🥈', '🥉'];
  for (let rank = 0; rank < top3.length; rank++) {
    const [tkey, tscore] = top3[rank];
    const t = HOLLAND_TYPES[tkey];
    const pct = MAX_PER_TYPE > 0 ? Math.round((tscore / MAX_PER_TYPE) * 1000) / 10 : 0;
    report += `### ${medals[rank]} ${rank + 1}. Öncelik: ${t.icon} ${t.name} (%${pct})\n\n${t.description}\n\n`;
    report += `**Temel Özellikler:**\n${t.characteristics.map(c => `- ✅ ${c}`).join('\n')}\n\n`;
    report += `**Öğrenme Ortamı:** ${t.studyEnvironment}\n\n`;
    report += `**Kariyer Önerileri:**\n${t.careers.map(c => `- 🎯 ${c}`).join('\n')}\n\n---\n\n`;
  }

  report += `## 💡 Kariyer Seçiminde Holland Kodunu Kullanmak\n\nHolland kodun, sana en uygun meslekleri belirlemende güçlü bir rehber!\n\n**Unutma:**\n- 🔍 En uygun meslekler, kodu tam olarak veya kısmen eşleşenlerdir.\n- 🎯 Holland kodu bir kader değil, bir yol haritasıdır.\n- 🌱 İlgi alanların zaman içinde değişebilir ve gelişebilir.\n- 💪 Güçlü ilgi alanların, o alanda başarılı olma ihtimalini artırır.\n\n---\n\n## 💬 Son Söz\nHolland teorisine göre insanlar iş ortamlarını, kendi kişilikleriyle en uyumlu çevreleri seçmeye çalışırlar. Kişilik-çevre uyumu ne kadar yüksek olursa, iş tatmini ve başarı da o kadar yüksek olur. Kendi koduna uygun bir kariyer yolu seçmek, hem mutlu hem başarılı olmanın anahtarıdır! 🚀`;

  return report;
}
