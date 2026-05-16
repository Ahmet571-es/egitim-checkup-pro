import { SAG_SOL_BEYIN_QUESTIONS, SAG_SOL_BEYIN_DATA } from './data';
import { VISUAL_QUESTIONS, calculateVisualScore } from './visual-data';
import type { SagSolBeyinScores } from '../types';

/**
 * Sağ-Sol Beyin Testi — Hibrit (Metin + Görsel) Motor
 *
 * - Metin bölümü: 32 soru (ID 1-35, 15-16-20 boşaltılmış)
 * - Görsel bölümü: 15 soru (ID 101-115)
 * - Toplam: 47 soru
 *
 * Skor mantığı:
 * - Her iki bölümün sağ/sol puanları ayrı tutulur (rapor için)
 * - Genel sağ/sol = text + visual
 * - Dominant ve level toplam üzerinden, yüzde tabanlı eşiklerle belirlenir
 */

const TEXT_TOTAL = SAG_SOL_BEYIN_QUESTIONS.length;
const VISUAL_TOTAL = VISUAL_QUESTIONS.length;
const GRAND_TOTAL = TEXT_TOTAL + VISUAL_TOTAL;

// Yüzde tabanlı eşikler — soru sayısı değişse de oran korunur
const LOWER_THRESHOLD = Math.floor(GRAND_TOTAL * 0.28);
const UPPER_THRESHOLD = Math.ceil(GRAND_TOTAL * 0.72);
const STRONG_LOW = Math.floor(GRAND_TOTAL * 0.16);
const STRONG_HIGH = Math.ceil(GRAND_TOTAL * 0.84);

export function calculateSagSolBeyin(
  answers: Record<string | number, string>
): SagSolBeyinScores {
  // Cevapları ID tipine bakmaksızın normalize et
  const normalized: Record<number, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    normalized[Number(k)] = v;
  }

  // ── Metin sorularını skorla ──
  let textSag = 0;
  let textSol = 0;
  for (const q of SAG_SOL_BEYIN_QUESTIONS) {
    const studentAnswer = normalized[q.id];
    if (studentAnswer == null) continue;
    if (studentAnswer === q.rightBrain) textSag += 1;
    else textSol += 1;
  }

  // ── Görsel sorularını skorla ──
  const visual = calculateVisualScore(normalized);

  // ── Kombine skor ──
  const sagPuan = textSag + visual.sagBeyin;
  const solPuan = textSol + visual.solBeyin;
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

  return {
    sagBeyin: sagPuan,
    solBeyin: solPuan,
    sagYuzde,
    solYuzde,
    dominant,
    level,
    // Bölüm bazında detay — rapor için
    textSag,
    textSol,
    visualSag: visual.sagBeyin,
    visualSol: visual.solBeyin,
    textTotal: textSag + textSol,
    visualTotal: visual.total,
  };
}

export function generateSagSolBeyinReport(scores: SagSolBeyinScores): string {
  const data = SAG_SOL_BEYIN_DATA[scores.dominant];
  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const strengthsText = data.strengths.map((s) => `- ✅ ${s}`).join('\n');
  const devText = data.developmentAreas.map((d) => `- 🌱 ${d}`).join('\n');
  const tipsText = data.studyTips.map((t) => `- 💡 ${t}`).join('\n');
  const careerText = data.careerAreas.join(', ');

  // Alt skor karşılaştırması (text vs visual)
  const textSag = scores.textSag ?? 0;
  const textSol = scores.textSol ?? 0;
  const visualSag = scores.visualSag ?? 0;
  const visualSol = scores.visualSol ?? 0;
  const textTotal = scores.textTotal ?? TEXT_TOTAL;
  const visualTotal = scores.visualTotal ?? VISUAL_TOTAL;
  const textSagPct = textTotal ? Math.round((textSag / textTotal) * 100) : 0;
  const visualSagPct = visualTotal ? Math.round((visualSag / visualTotal) * 100) : 0;

  // İç tutarlılık analizi: metin ve görsel sonuçlar uyumlu mu?
  const diff = Math.abs(textSagPct - visualSagPct);
  let consistencyNote = '';
  if (diff < 15) {
    consistencyNote = '🎯 **Yüksek tutarlılık:** Hem metin sorularına verdiğin cevaplar hem de görsel tercihlerin aynı yönde gidiyor. Bu, sonucun çok güvenilir olduğunu gösteriyor.';
  } else if (diff < 30) {
    consistencyNote = '⚖️ **Karışık profil:** Metin tercihlerin ile görsel tercihlerin arasında belirgin bir fark var. Bu çok normal — günlük yaşamda farklı durumlarda farklı beyin yarımkürelerini kullanıyorsun demektir.';
  } else {
    consistencyNote = '🌈 **Çok yönlü profil:** Söylediğin ve düşündüğün şeyler ile gözüne hoş gelen, hissettiğin şeyler arasında büyük fark var. Bu da çok değerli — esnek ve çok yönlü bir zihne sahipsin demektir.';
  }

  return `# ${data.icon} SAĞ-SOL BEYİN ÜSTÜNLÜĞÜ RAPORU

**Sonucun:** ${scores.level}

---

## 📊 Genel Puan Tablon

| Beyin Yarımküresi | Puan | Yüzde | Grafik |
|---|---|---|---|
| 🎨 Sağ Beyin | ${scores.sagBeyin}/${GRAND_TOTAL} | %${scores.sagYuzde} | ${bar(scores.sagYuzde)} |
| 🔬 Sol Beyin | ${scores.solBeyin}/${GRAND_TOTAL} | %${scores.solYuzde} | ${bar(scores.solYuzde)} |

---

## 🔬 Bölüm Bazında Sonuçlar

### 📝 Metin Soruları (Düşünme & Tercih)
Günlük hayattaki tercihlerin, düşünme tarzın ve alışkanlıkların hakkında:
- 🎨 Sağ Beyin: **${textSag}/${textTotal}** (%${textSagPct})
- 🔬 Sol Beyin: **${textSol}/${textTotal}** (%${100 - textSagPct})

### 🖼️ Görsel Soruları (Algı & Sezgi)
Görseller karşısında ilk hissin ve algı tarzın hakkında:
- 🎨 Sağ Beyin: **${visualSag}/${visualTotal}** (%${visualSagPct})
- 🔬 Sol Beyin: **${visualSol}/${visualTotal}** (%${100 - visualSagPct})

### 🤝 Tutarlılık Analizi
${consistencyNote}

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
