// ============================================================
// D2 Dikkat Testi — Orijinal Brickenkamp Formatı
// 14 satır × 47 sembol = 658 stimuli
// Hedef: "d" harfi + toplam 2 çizgi (üst+alt kombinasyonu)
// Puanlama: TN, E1, E2, TN-E, CP (KP), FR
// ============================================================
import type { D2Symbol, D2RowResult, D2Scores, D2RowDetail } from '../types';

// ── KONFİGÜRASYON ─────────────────────────────────────────
export const D2_CONFIG = {
  rows: 14,
  symbolsPerRow: 47,
  timePerRow: 20, // saniye
  targetRatio: 0.4, // ~%40 hedef
  practiceSymbols: 47,
} as const;

// ── SEMBOL TİPLERİ ────────────────────────────────────────
// (harf, üst_çizgi, alt_çizgi) → toplam 1-4 çizgi
const ALL_SYMBOL_TYPES: Omit<D2Symbol, 'index'>[] = [];
for (const letter of ['d', 'p'] as ('d' | 'p')[]) {
  for (let above = 0; above <= 2; above++) {
    for (let below = 0; below <= 2; below++) {
      const total = above + below;
      if (total >= 1 && total <= 4) {
        ALL_SYMBOL_TYPES.push({
          letter, above, below, total,
          isTarget: letter === 'd' && total === 2,
        });
      }
    }
  }
}

const TARGET_TYPES = ALL_SYMBOL_TYPES.filter(s => s.isTarget);
const DISTRACTOR_TYPES = ALL_SYMBOL_TYPES.filter(s => !s.isTarget);

// ── Seeded LCG Random ─────────────────────────────────────
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed >>> 0; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ── SATIR ÜRETİCİ ─────────────────────────────────────────
export function generateD2Row(
  n = D2_CONFIG.symbolsPerRow,
  targetRatio = D2_CONFIG.targetRatio,
  rng: SeededRandom
): D2Symbol[] {
  const numTargets = Math.round(n * targetRatio);
  const numDist = n - numTargets;
  const row: Omit<D2Symbol, 'index'>[] = [];
  for (let i = 0; i < numTargets; i++) row.push({ ...rng.choice(TARGET_TYPES) });
  for (let i = 0; i < numDist; i++) row.push({ ...rng.choice(DISTRACTOR_TYPES) });
  return rng.shuffle(row).map((s, idx) => ({ ...s, index: idx }));
}

export function generateD2Test(seed?: number): D2Symbol[][] {
  const rng = new SeededRandom(seed ?? 42);
  return Array.from({ length: D2_CONFIG.rows }, () =>
    generateD2Row(D2_CONFIG.symbolsPerRow, D2_CONFIG.targetRatio, rng)
  );
}

export function generateD2PracticeRow(seed = 99): D2Symbol[] {
  const rng = new SeededRandom(seed);
  return generateD2Row(D2_CONFIG.practiceSymbols, 0.40, rng);
}

// ── SKORLAMA ─────────────────────────────────────────────
export function calculateD2(rowResults: D2RowResult[], timePerRow = D2_CONFIG.timePerRow): D2Scores {
  let totalTn = 0, totalE1 = 0, totalE2 = 0, totalCorrect = 0, totalTargets = 0;
  const rowCps: number[] = [];
  const rowDetails: D2RowDetail[] = [];

  for (let rowIdx = 0; rowIdx < rowResults.length; rowIdx++) {
    const { symbols, selected, elapsedTime } = rowResults[rowIdx];
    const tn = selected.filter(Boolean).length;
    let e1 = 0, e2 = 0, correct = 0, targets = 0;
    const missedIndices: number[] = [];
    const wrongIndices: number[] = [];
    const correctIndices: number[] = [];

    // Son işaretlenen sembolün indeksini bul
    let lastSelected = -1;
    for (let i = selected.length - 1; i >= 0; i--) {
      if (selected[i]) { lastSelected = i; break; }
    }

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const sel = selected[i] ?? false;
      if (sym.isTarget) {
        targets++;
        if (sel) { correct++; correctIndices.push(i); }
        else {
          e1++;
          if (lastSelected === -1 || i <= lastSelected) missedIndices.push(i);
        }
      } else {
        if (sel) { e2++; wrongIndices.push(i); }
      }
    }

    const blank = lastSelected >= 0 ? symbols.length - lastSelected - 1 : symbols.length;
    const cp = correct - e2;
    rowCps.push(cp);
    totalTn += tn; totalE1 += e1; totalE2 += e2;
    totalCorrect += correct; totalTargets += targets;

    rowDetails.push({
      rowNum: rowIdx + 1, totalSymbols: symbols.length, targetsInRow: targets,
      correct, missed: e1, wrong: e2, blank, cp, tn,
      elapsed: Math.round(elapsedTime * 10) / 10,
      missedIndices, wrongIndices, correctIndices, symbols, selected,
    });
  }

  const totalE = totalE1 + totalE2;
  const tnE = totalTn - totalE;
  const totalCp = totalCorrect - totalE2;
  const cpPct = Math.round((totalCorrect / Math.max(1, totalTargets)) * 1000) / 10;
  const hitRate = Math.round((totalCorrect / Math.max(1, totalTargets)) * 1000) / 10;
  const errorPct = Math.round((totalE / Math.max(1, totalTn)) * 1000) / 10;
  const fr = rowCps.length > 0 ? Math.max(...rowCps) - Math.min(...rowCps) : 0;

  let level: string, levelDesc: string;
  if (cpPct >= 90) { level = 'Çok Yüksek'; levelDesc = 'Dikkat ve konsantrasyon kapasitesi çok güçlü.'; }
  else if (cpPct >= 75) { level = 'Yüksek'; levelDesc = 'Ortalamanın üzerinde dikkat performansı.'; }
  else if (cpPct >= 55) { level = 'Orta'; levelDesc = 'Ortalama düzeyde dikkat. Gelişim potansiyeli var.'; }
  else if (cpPct >= 35) { level = 'Düşük'; levelDesc = 'Dikkat alanında destek ihtiyacı var.'; }
  else { level = 'Çok Düşük'; levelDesc = 'Dikkat ve konsantrasyon alanında ciddi gelişim ihtiyacı tespit edildi.'; }

  let balance: string, balanceDesc: string;
  if (hitRate >= 80 && errorPct <= 10) { balance = 'Dengeli'; balanceDesc = 'Hem hızlı hem doğru çalışıyor.'; }
  else if (hitRate < 60 && errorPct <= 10) { balance = 'Temkinli (Yavaş ama Doğru)'; balanceDesc = 'Doğruluk yüksek ama hız düşük.'; }
  else if (errorPct > 20) { balance = 'Dürtüsel (Hızlı ama Hatalı)'; balanceDesc = 'Hızlı ama hata oranı yüksek.'; }
  else { balance = 'Gelişen'; balanceDesc = 'Hız ve doğruluk arasında denge kuruluyor.'; }

  let consistency: string, consistencyDesc: string;
  if (fr <= 3) { consistency = 'Çok Tutarlı'; consistencyDesc = 'Satırlar arası performans oldukça dengeli.'; }
  else if (fr <= 6) { consistency = 'Tutarlı'; consistencyDesc = 'Performans satırlar arasında makul düzeyde sabit.'; }
  else if (fr <= 10) { consistency = 'Dalgalı'; consistencyDesc = 'Performansta belirgin iniş çıkışlar var.'; }
  else { consistency = 'Tutarsız'; consistencyDesc = 'Satırlar arası performans çok değişken.'; }

  return {
    TN: totalTn, E1: totalE1, E2: totalE2, E: totalE,
    TN_E: tnE, CP: totalCp, FR: fr,
    cpPct, hitRate, errorPct,
    level, levelDesc, balance, balanceDesc, consistency, consistencyDesc,
    rowPerformances: rowCps, rowDetails, totalTargets, totalCorrect, timePerRow,
  };
}

// ── HTML RENDER YARDIMCISı (sembol gösterimi için) ─────────
export function renderD2SymbolLabel(symbol: D2Symbol): string {
  const above = '|'.repeat(symbol.above) || '⠀';
  const below = '|'.repeat(symbol.below) || '⠀';
  return `${above}\n${symbol.letter}\n${below}`;
}

export function generateD2Report(scores: D2Scores): string {
  const bar = (pct: number) => {
    const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
    return '█'.repeat(n) + '░'.repeat(10 - n);
  };

  const rowTable = scores.rowDetails
    .map(d => `| Satır ${String(d.rowNum).padStart(2)} | ${d.cp} | ${d.correct} | ${d.missed} | ${d.wrong} | ${d.blank} |`)
    .join('\n');

  return `# 🎯 D2 DİKKAT TESTİ RAPORU

---

## 📊 Genel Performans Özeti

| Metrik | Değer | Açıklama |
|--------|-------|----------|
| 🎯 Konsantrasyon (CP) | **${scores.CP}** | Doğru hedefler − Yanlış işaretlemeler |
| ⚡ Toplam Performans (TN-E) | **${scores.TN_E}** | Toplam işaretleme − Toplam hata |
| 📊 Toplam İşaretleme (TN) | ${scores.TN} | Tüm satırlarda işaretlenen sembol sayısı |
| ❌ Toplam Hata (E) | ${scores.E} | Atlama (${scores.E1}) + Yanlış (${scores.E2}) |
| 📈 Dalgalanma (FR) | ${scores.FR} | En yüksek − en düşük satır performansı |
| ⏱️ Satır Süresi | ${scores.timePerRow} sn | |

---

## 🧠 Dikkat Seviyesi: **${scores.level}**

${bar(scores.cpPct)} %${scores.cpPct}

${scores.levelDesc}

---

## ⚖️ Hız-Doğruluk Dengesi: **${scores.balance}**

| Gösterge | Değer |
|----------|-------|
| Hedef Yakalama Oranı | %${scores.hitRate} |
| Hata Oranı | %${scores.errorPct} |

${scores.balanceDesc}

---

## 📈 Tutarlılık: **${scores.consistency}**

${scores.consistencyDesc}

---

## 📉 Satır Bazlı Performans

| Satır | CP | Doğru | Kaçırılan | Yanlış | Boş |
|-------|-----|-------|-----------|--------|-----|
${rowTable}

---

## 📌 Özet

| Gösterge | Sonuç |
|----------|-------|
| Dikkat Seviyesi | **${scores.level}** |
| Hız-Doğruluk | **${scores.balance}** |
| Tutarlılık | **${scores.consistency}** |
| Konsantrasyon Puanı | **${scores.CP}/${scores.totalTargets}** |
| Genel Hata | **${scores.E}** (Atlama: ${scores.E1}, Yanlış: ${scores.E2}) |`;
}
