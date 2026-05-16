import { SAG_SOL_BEYIN_QUESTIONS, SAG_SOL_BEYIN_DATA } from './data';
import type { SagSolBeyinScores } from '../types';

/**
 * Toplam soru sayısı dinamik — data.ts'deki SAG_SOL_BEYIN_QUESTIONS uzunluğundan okunur.
 * Eşik değerleri yüzde tabanlı (≈%28 ve ≈%72) — soru sayısı değişse de oran korunur.
 */
const TOTAL_QUESTIONS = SAG_SOL_BEYIN_QUESTIONS.length;

// Yüzde tabanlı eşikler — daima soru sayısına orantılı
const LOWER_THRESHOLD = Math.floor(TOTAL_QUESTIONS * 0.28);   // 32 soru → 8
const UPPER_THRESHOLD = Math.ceil(TOTAL_QUESTIONS * 0.72);    // 32 soru → 24
const STRONG_LOW = Math.floor(TOTAL_QUESTIONS * 0.16);        // 32 soru → 5
const STRONG_HIGH = Math.ceil(TOTAL_QUESTIONS * 0.84);        // 32 soru → 27

export function calculateSagSolBeyin(
  answers: Record<string | number, string>
): SagSolBeyinScores {
  const normalized: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    normalized[Number(k)] = v;
  }

  let sagPuan = 0;
  let solPuan = 0;

  for (const q of SAG_SOL_BEYIN_QUESTIONS) {
    const studentAnswer = normalized[q.id];
    if (studentAnswer == null) continue;
    if (studentAnswer === q.rightBrain) {
      sagPuan += 1;
    } else {
      solPuan += 1;
    }
  }

  const total = sagPuan + solPuan || 1;
  const sagYuzde = Math.round((sagPuan / total) * 1000) / 10;
  const solYuzde = Math.round((solPuan / total) * 1000) / 10;

  let dominant: 'sag' | 'sol' | 'dengeli';
  let level: string;

  if (sagPuan <= LOWER_THRESHOLD) {
    dominant = 'sol';
    level = sagPuan <= STRONG_LOW ? 'Güçlü Sol Beyin' : 'Orta Düzey Sol Beyin';
  } else if (sagPuan >= UPPER_THRESHOLD) {
    dominant = 'sag';
    level = sagPuan >= STRONG_HIGH ? 'Güçlü Sağ Beyin' : 'Orta Düzey Sağ Beyin';
  } else {
    dominant = 'dengeli';
    level = 'Dengeli Beyin';
  }

  return { sagBeyin: sagPuan, solBeyin: solPuan, sagYuzde, solYuzde, dominant, level };
}

export function generateSagSolBeyinReport(scores: SagSolBeyinScores): string {
  const data = SAG_SOL_BEYIN_DATA[scores.dominant];
  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const strengthsText = data.strengths.map(s => `- ✅ ${s}`).join('\n');
  const devText = data.developmentAreas.map(d => `- 🌱 ${d}`).join('\n');
  const tipsText = data.studyTips.map(t => `- 💡 ${t}`).join('\n');
  const careerText = data.careerAreas.join(', ');

  return `# ${data.icon} SAĞ-SOL BEYİN ÜSTÜNLÜĞÜ RAPORU

**Sonucun:** ${scores.level}

---

## 📊 Puan Tablon

| Beyin Yarımküresi | Puan | Yüzde | Grafik |
|---|---|---|---|
| 🎨 Sağ Beyin | ${scores.sagBeyin}/${TOTAL_QUESTIONS} | %${scores.sagYuzde} | ${bar(scores.sagYuzde)} |
| 🔬 Sol Beyin | ${scores.solBeyin}/${TOTAL_QUESTIONS} | %${scores.solYuzde} | ${bar(scores.solYuzde)} |

---

## 🌟 Sen Kimsin?
${data.description}

---

## 💪 Senin Süper Güçlerin
${strengthsText}

---

## 🌱 Geliştirebileceğin Alanlar
${devText}

---

## 📚 Sana Özel Ders Çalışma İpuçları
${tipsText}

---

## 🚀 Sana Uygun Kariyer Alanları
${careerText}

---

## 💬 Son Söz
Unutma, sağ beyin veya sol beyin baskın olmak iyi ya da kötü değildir! Her ikisi de harika süper güçlerdir. Önemli olan kendi güçlü tarafını tanımak ve onu en iyi şekilde kullanmaktır. 🌟`;
}
