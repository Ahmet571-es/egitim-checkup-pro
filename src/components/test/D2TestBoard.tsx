'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { D2Symbol, D2RowResult } from '@/lib/tests/types';

interface D2TestBoardProps {
  rows: D2Symbol[][];
  timePerRow: number; // saniye
  onComplete: (results: D2RowResult[]) => void;
}

// Sembol görsel bileşeni
function D2SymbolCell({
  symbol,
  selected,
  onToggle,
  size,
}: {
  symbol: D2Symbol;
  selected: boolean;
  onToggle: () => void;
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-8 text-[10px]',
    md: 'w-8 h-10 text-xs',
    lg: 'w-10 h-12 text-sm',
  };
  const lineH = { sm: 'h-2', md: 'h-2.5', lg: 'h-3' };

  const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <div key={i} className={`w-px ${lineH[size]} bg-current`} />
    ));

  return (
    <button
      onClick={onToggle}
      className={`
        flex flex-col items-center justify-center rounded border
        font-bold transition-all select-none flex-shrink-0
        ${sizeClasses[size]}
        ${selected
          ? 'bg-red-500/30 border-red-400 text-red-300 shadow-sm shadow-red-500/30'
          : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30'
        }
      `}
      aria-pressed={selected}
      aria-label={`${symbol.letter} üst:${symbol.above} alt:${symbol.below}`}
    >
      <div className="flex gap-1 justify-center mb-0.5">
        {lines(symbol.above)}
      </div>
      <span className="font-extrabold leading-none">{symbol.letter}</span>
      <div className="flex gap-1 justify-center mt-0.5">
        {lines(symbol.below)}
      </div>
    </button>
  );
}

// Geri sayım çemberi
function CountdownCircle({ remaining, total }: { remaining: number; total: number }) {
  const pct = (remaining / total) * 100;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = remaining <= 5 ? '#ef4444' : remaining <= 10 ? '#f97316' : '#10b981';

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{remaining}</span>
      </div>
    </div>
  );
}

type Phase = 'instructions' | 'practice' | 'running' | 'done';

export default function D2TestBoard({ rows, timePerRow, onComplete }: D2TestBoardProps) {
  const [phase, setPhase] = useState<Phase>('instructions');
  const [currentRow, setCurrentRow] = useState(0);
  const [remaining, setRemaining] = useState(timePerRow);
  const [rowSelections, setRowSelections] = useState<boolean[][]>(() =>
    rows.map(row => Array(row.length).fill(false))
  );
  const [rowStartTime, setRowStartTime] = useState<number>(Date.now());
  const [results, setResults] = useState<D2RowResult[]>([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ekran yönü kontrolü
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const finishRow = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = (Date.now() - rowStartTime) / 1000;
    const rowResult: D2RowResult = {
      symbols: rows[currentRow],
      selected: rowSelections[currentRow],
      elapsedTime: Math.min(elapsed, timePerRow),
    };
    const newResults = [...results, rowResult];

    if (currentRow + 1 >= rows.length) {
      setResults(newResults);
      setPhase('done');
      onComplete(newResults);
    } else {
      setResults(newResults);
      setCurrentRow(prev => prev + 1);
      setRemaining(timePerRow);
      setRowStartTime(Date.now());
    }
  }, [currentRow, rowSelections, rows, results, timePerRow, rowStartTime, onComplete]);

  // Timer
  useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          finishRow();
          return timePerRow;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentRow, finishRow, timePerRow]);

  const toggleSymbol = (rowIdx: number, symIdx: number) => {
    if (phase !== 'running' || rowIdx !== currentRow) return;
    setRowSelections(prev => {
      const next = prev.map(r => [...r]);
      next[rowIdx][symIdx] = !next[rowIdx][symIdx];
      return next;
    });
  };

  const startTest = () => {
    setPhase('running');
    setCurrentRow(0);
    setRemaining(timePerRow);
    setRowStartTime(Date.now());
  };

  // ── Dikey mod uyarısı ─────────────────────────────────
  if (phase !== 'instructions' && isPortrait) {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] flex items-center justify-center p-6 fixed inset-0 z-50 overflow-hidden">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-white font-extrabold text-xl mb-2">Telefonu Yatay Çevirin</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            D2 Dikkat Testi yatay modda çalışır. Lütfen telefonunuzu yatay konuma getirin.
          </p>
          <div className="mt-6 text-4xl animate-bounce">🔄</div>
        </div>
      </div>
    );
  }

  // ── Yönergeler ────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] p-4 flex items-center justify-center fixed inset-0 z-50 overflow-auto">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-5">
          <div className="text-center">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-white font-extrabold text-2xl">D2 Dikkat Testi</h1>
            <p className="text-white/60 text-sm mt-1">{rows.length} satır × {rows[0]?.length ?? 47} sembol</p>
          </div>

          {/* Hedef gösterimi */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white/70 text-sm font-semibold mb-3">🎯 İşaretlemen Gereken Hedef Semboller:</p>
            <p className="text-white/60 text-xs mb-3">
              Sadece <strong className="text-white">{"d"}</strong> harfi ile <strong className="text-white">toplam 2 çizgisi</strong> olan sembolleri işaretle:
            </p>
            <div className="flex gap-4 justify-center">
              {[
                { above: 2, below: 0 },
                { above: 0, below: 2 },
                { above: 1, below: 1 },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center bg-green-500/20 border border-green-400/40 rounded-lg p-3 gap-1">
                  <div className="flex gap-1.5 justify-center h-3">
                    {Array.from({ length: s.above }, (_, j) => <div key={j} className="w-0.5 h-full bg-green-400 rounded-full" />)}
                  </div>
                  <span className="text-green-300 font-black text-xl">d</span>
                  <div className="flex gap-1.5 justify-center h-3">
                    {Array.from({ length: s.below }, (_, j) => <div key={j} className="w-0.5 h-full bg-green-400 rounded-full" />)}
                  </div>
                  <span className="text-green-400 text-xs">{s.above}+{s.below}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-white/70 text-sm">
            <p>📋 Her satırda <strong className="text-white">{timePerRow} saniye</strong> süren var.</p>
            <p>⏭️ Süre dolunca sonraki satıra otomatik geçilir.</p>
            <p>👆 Soldaki sembolden başla, sağa doğru ilerle.</p>
            <p>✅ Bir sembolü tekrar tıklayarak seçimini iptal edebilirsin.</p>
            {isPortrait && (
              <p className="text-amber-300">⚠️ Test sırasında telefonu yatay tutun!</p>
            )}
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 rounded-xl bg-[#10b981] text-white font-extrabold text-lg hover:bg-[#059669] transition-all hover:scale-[1.02] shadow-lg"
          >
            Testi Başlat 🚀
          </button>
        </div>
      </div>
    );
  }

  // ── Bitti ─────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] flex items-center justify-center p-4 fixed inset-0 z-50 overflow-hidden">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-white font-extrabold text-2xl mb-2">Test Tamamlandı!</h2>
          <p className="text-white/60">Sonuçların hesaplanıyor...</p>
        </div>
      </div>
    );
  }

  // ── Test ekranı ───────────────────────────────────────
  const row = rows[currentRow] ?? [];
  const selectedCount = rowSelections[currentRow]?.filter(Boolean).length ?? 0;

  // Sembol boyutunu ekrana göre hesapla
  const symCount = row.length;
  const symSize: 'sm' | 'md' | 'lg' =
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'sm' :
    symCount > 30 ? 'md' : 'lg';

  return (
    <>
      {/* Body scroll'u kapat */}
      <style>{`body, html { overflow: hidden !important; height: 100% !important; }`}</style>

      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] flex flex-col overflow-hidden fixed inset-0 z-50">
        {/* Header — kompakt */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border-b border-white/10 flex-shrink-0">
          <div className="text-white/70 text-xs sm:text-sm font-semibold">
            Satır {currentRow + 1} / {rows.length}
          </div>
          <CountdownCircle remaining={remaining} total={timePerRow} />
          <div className="text-white/60 text-xs sm:text-sm">
            ✓ {selectedCount}
          </div>
        </div>

        {/* İlerleme */}
        <div className="h-1 bg-white/10 flex-shrink-0">
          <div
            className="h-full bg-[#10b981] transition-all"
            style={{ width: `${((currentRow) / rows.length) * 100}%` }}
          />
        </div>

        {/* Sembol Alanı — tam ekranı doldur, sadece yatay scroll */}
        <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-2 sm:px-3">
          <div className="flex gap-0.5 sm:gap-1 mx-auto">
            {row.map((sym, idx) => (
              <D2SymbolCell
                key={idx}
                symbol={sym}
                selected={rowSelections[currentRow]?.[idx] ?? false}
                onToggle={() => toggleSymbol(currentRow, idx)}
                size={symSize}
              />
            ))}
          </div>
        </div>

        {/* Footer — kompakt */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border-t border-white/10 flex-shrink-0">
          <p className="text-white/40 text-[10px] sm:text-xs">
            ← Soldan sağa işaretle
          </p>
          <button
            onClick={finishRow}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all active:scale-95"
          >
            Satırı Bitir →
          </button>
        </div>
      </div>
    </>
  );
}
