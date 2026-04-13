import { ENNEAGRAM_QUESTIONS, ENNEAGRAM_DATA, WING_DESCRIPTIONS } from './data';
import type { EnneagramScores } from '../types';

const MAX_SCORE = 20 * 5; // 20 soru × 5 (max puan)

export function calculateEnneagram(
  allAnswers: Record<string, number>
): EnneagramScores {
  const scores: Record<number, number> = {};
  for (let t = 1; t <= 9; t++) scores[t] = 0;

  for (const [qId, val] of Object.entries(allAnswers)) {
    const tip = parseInt(qId.split('_')[0], 10);
    if (tip >= 1 && tip <= 9) {
      scores[tip] += val;
    }
  }

  const normalized: Record<number, number> = {};
  for (let t = 1; t <= 9; t++) {
    normalized[t] = Math.round((scores[t] / MAX_SCORE) * 1000) / 10;
  }

  const mainType = Object.entries(scores).reduce(
    (max, [t, s]) => (s > max[1] ? [Number(t), s] : max),
    [1, -1]
  )[0] as number;

  const mainScore = normalized[mainType];

  let wings: number[];
  if (mainType === 1) wings = [9, 2];
  else if (mainType === 9) wings = [8, 1];
  else wings = [mainType - 1, mainType + 1];

  const wingType = wings.reduce(
    (max, w) => (normalized[w] > normalized[max] ? w : max),
    wings[0]
  );
  const wingScore = normalized[wingType];

  const fullTypeStr =
    wingScore > mainScore * 0.7
      ? `${mainType}w${wingType}`
      : `${mainType} (Saf Tip)`;

  const sortedScores = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1])
    .map(([t, p]) => [Number(t), p] as [number, number]);

  return { scores, normalized, mainType, mainScore, wingType, fullTypeStr, sortedScores };
}

// Tüm soruları düz liste olarak döndürür (shuffle için)
export function getAllEnneagramQuestions(): { id: string; tip: number; text: string }[] {
  const all: { id: string; tip: number; text: string }[] = [];
  for (const [tipStr, questions] of Object.entries(ENNEAGRAM_QUESTIONS)) {
    const tip = Number(tipStr);
    questions.forEach((text, idx) => {
      all.push({ id: `${tip}_${idx + 1}`, tip, text });
    });
  }
  return all;
}

// Fisher-Yates shuffle (seed-less)
export function shuffleQuestions<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateEnneagramReport(scores: EnneagramScores): string {
  const { normalized, mainType, wingType, fullTypeStr, sortedScores } = scores;
  const data = ENNEAGRAM_DATA[mainType];
  const wingTxt = WING_DESCRIPTIONS[`${mainType}w${wingType}`] ?? 'Dengeli kanat etkisi.';
  const stressData = ENNEAGRAM_DATA[data.stress];
  const growthData = ENNEAGRAM_DATA[data.growth];

  const bar = (pct: number) => {
    const n = Math.round(pct / 10);
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const scoreTable = sortedScores
    .map(([t, p]) => `| ${ENNEAGRAM_DATA[t].icon} Tip ${t}: ${ENNEAGRAM_DATA[t].role.split(',')[0]} | %${p} | ${bar(p)} |`)
    .join('\n');

  const strengthsTxt = data.strengths.map(s => `- ✅ ${s}`).join('\n');
  const weaknessesTxt = data.weaknesses.map(w => `- ⚠️ ${w}`).join('\n');
  const dangerTxt = data.dangerSignals.map(d => `- 🚨 ${d}`).join('\n');
  const prescriptionTxt = data.prescription.map(p => `- ${p}`).join('\n');
  const careersTxt = data.careers.join(', ');

  return `# ${data.icon} ENNEAGRAM KİŞİLİK RAPORU

**Senin Tipin:** ${data.title}
**Tam Profilin:** ${fullTypeStr}
**Temel Rolün:** ${data.role}

---

## 📊 Tüm Tip Puanların

| Kişilik Tipi | Yüzde | Grafik |
|---|---|---|
${scoreTable}

---

## 🌟 Sen Kimsin?

${data.desc}

---

## 🦅 Kanat Etkisi: ${mainType}w${wingType}

${wingTxt}

---

## 🔑 Temel Motivasyonun

| | |
|---|---|
| 😨 **Temel Korku** | ${data.fear} |
| 💛 **Temel Arzu** | ${data.desire} |

---

## 💪 Güçlü Yönlerin

${strengthsTxt}

---

## 🌱 Gelişim Alanların

${weaknessesTxt}

---

## 💼 Çalışma Stilin

${data.workStyle}

**Sana Uygun Kariyer Alanları:** ${careersTxt}

---

## 💑 İlişki Stilin

${data.relationshipStyle}

---

## 🔴 Stres Altında Ne Olur?

${data.stressBehavior}

> Stres tipine kayarsın: **${stressData.title}** (${stressData.role})

---

## 🟢 Gelişim Yolunda Ne Olur?

${data.growthBehavior}

> Gelişim tipine doğru yol alırsın: **${growthData.title}** (${growthData.role})

---

## 🚨 Dikkat Sinyalleri

${dangerTxt}

---

## 🛠️ Sana Özel Büyüme Taktikleri

${prescriptionTxt}

---

## 🌍 Aynı Tipdeki Tanınmış İsimler

${data.famousExamples}

---

## 💬 Son Söz

Enneagram bir kısıtlama değil, bir harita. Tipini bilmek seni kutucuğa hapsetmez — aksine, neden böyle davrandığını, neyin seni harekete geçirdiğini ve nereye büyüyebileceğini anlamana yardım eder. 🌱`;
}
