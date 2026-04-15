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
}: {
  symbol: D2Symbol;
  selected: boolean;
  onToggle: () => void;
}) {
  const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-current rounded-full" style={{ width: '1.5px', height: '100%' }} />
    ));

  return (
    <button
      onClick={onToggle}
      className={`
        flex flex-col items-center justify-center rounded border
        font-bold transition-all select-none w-full h-full
        ${selected
          ? 'bg-red-500/30 border-red-400 text-red-300 shadow-sm shadow-red-500/30'
          : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30'
        }
      `}
      aria-pressed={selected}
      aria-label={`${symbol.letter} üst:${symbol.above} alt:${symbol.below}`}
    >
      <div className="flex gap-[3px] justify-center items-end" style={{ height: '22%', marginBottom: '3px' }}>
        {lines(symbol.above)}
      </div>
      <span className="font-extrabold leading-none" style={{ fontSize: 'clamp(11px, 2.7vw, 20px)' }}>{symbol.letter}</span>
      <div className="flex gap-[3px] justify-center items-start" style={{ height: '22%', marginTop: '3px' }}>
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
  const [instructionStep, setInstructionStep] = useState(0);
  const [practiceSelections, setPracticeSelections] = useState<boolean[]>(Array(10).fill(false));
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [remaining, setRemaining] = useState(timePerRow);
  const [rowSelections, setRowSelections] = useState<boolean[][]>(() =>
    rows.map(row => Array(row.length).fill(false))
  );
  const [rowStartTime, setRowStartTime] = useState<number>(Date.now());
  const [results, setResults] = useState<D2RowResult[]>([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Antrenman sembolleri (5 doğru hedef, 5 yanlış)
  const practiceSymbols: { letter: string; above: number; below: number; isTarget: boolean }[] = [
    { letter: 'd', above: 2, below: 0, isTarget: true },
    { letter: 'p', above: 1, below: 1, isTarget: false },
    { letter: 'd', above: 0, below: 2, isTarget: true },
    { letter: 'd', above: 3, below: 0, isTarget: false },
    { letter: 'd', above: 1, below: 1, isTarget: true },
    { letter: 'p', above: 2, below: 0, isTarget: false },
    { letter: 'd', above: 1, below: 0, isTarget: false },
    { letter: 'd', above: 0, below: 2, isTarget: true },
    { letter: 'p', above: 0, below: 2, isTarget: false },
    { letter: 'd', above: 2, below: 0, isTarget: true },
  ];

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

  // ── Yönergeler + Antrenman ────────────────────────────
  if (phase === 'instructions') {
    const totalSteps = 4; // 0: giriş, 1: neyi işaretle, 2: neyi işaretleme, 3: antrenman

    const renderSymbol = (letter: string, above: number, below: number, color: string, label?: string) => (
      <div className={`flex flex-col items-center rounded-lg p-2.5 gap-0.5 border ${color}`}>
        <div className="flex gap-1.5 justify-center h-3">
          {Array.from({ length: above }, (_, j) => <div key={j} className="w-0.5 h-full bg-current rounded-full" />)}
        </div>
        <span className="font-black text-xl leading-none">{letter}</span>
        <div className="flex gap-1.5 justify-center h-3">
          {Array.from({ length: below }, (_, j) => <div key={j} className="w-0.5 h-full bg-current rounded-full" />)}
        </div>
        {label && <span className="text-[10px] mt-1 opacity-70">{label}</span>}
      </div>
    );

    // Antrenman sonuç hesaplama
    const practiceCorrect = practiceChecked
      ? practiceSymbols.reduce((acc, sym, i) => acc + (practiceSelections[i] === sym.isTarget ? 1 : 0), 0)
      : 0;

    return (
      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] p-4 flex items-center justify-center fixed inset-0 z-50 overflow-auto">
        <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-5">

          {/* İlerleme çubuğu */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= instructionStep ? 'bg-emerald-400' : 'bg-white/15'}`} />
            ))}
          </div>

          {/* ADIM 0: Giriş */}
          {instructionStep === 0 && (
            <>
              <div className="text-center">
                <div className="text-5xl mb-3">🎯</div>
                <h1 className="text-white font-extrabold text-2xl mb-2">D2 Dikkat Testi</h1>
                <p className="text-white/60 text-sm">{rows.length} satır × {rows[0]?.length ?? 47} sembol</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <p className="text-white/80 text-sm leading-relaxed">
                  Bu testte sana <strong className="text-white">d</strong> ve <strong className="text-white">p</strong> harflerinden oluşan semboller gösterilecek. Her sembolün üstünde ve altında dikey çizgiler var.
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  Senin görevin: sadece belirli sembolleri bulmak ve tıklamak. Hangilerini tıklaman gerektiğini sana adım adım göstereceğiz.
                </p>
              </div>
              <button
                onClick={() => setInstructionStep(1)}
                className="w-full py-3.5 rounded-xl bg-[#10b981] text-white font-bold text-base hover:bg-[#059669] transition-all shadow-lg"
              >
                Devam Et →
              </button>
            </>
          )}

          {/* ADIM 1: Neyi İşaretle */}
          {instructionStep === 1 && (
            <>
              <div className="text-center">
                <h2 className="text-white font-extrabold text-xl mb-1">Bunları İşaretle ✅</h2>
                <p className="text-white/60 text-sm">Sadece <strong className="text-emerald-400">d harfi</strong> + <strong className="text-emerald-400">toplam 2 çizgi</strong></p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-400/30">
                <p className="text-emerald-300 text-sm mb-4 text-center font-semibold">Bu 3 sembol DOĞRU hedeftir — bunları tıkla:</p>
                <div className="flex gap-5 justify-center text-emerald-400">
                  {renderSymbol('d', 2, 0, 'bg-emerald-500/20 border-emerald-400/40', 'üstte 2 çizgi')}
                  {renderSymbol('d', 0, 2, 'bg-emerald-500/20 border-emerald-400/40', 'altta 2 çizgi')}
                  {renderSymbol('d', 1, 1, 'bg-emerald-500/20 border-emerald-400/40', 'üstte 1 + altta 1')}
                </div>
                <p className="text-emerald-300/70 text-xs text-center mt-4">Hepsinde ortak olan: <strong>d harfi</strong> ve <strong>toplam 2 çizgi</strong></p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInstructionStep(0)} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold hover:bg-white/15 transition-all">← Geri</button>
                <button onClick={() => setInstructionStep(2)} className="flex-1 py-3 rounded-xl bg-[#10b981] text-white font-bold hover:bg-[#059669] transition-all shadow-lg">Devam Et →</button>
              </div>
            </>
          )}

          {/* ADIM 2: Neyi İşaretleme */}
          {instructionStep === 2 && (
            <>
              <div className="text-center">
                <h2 className="text-white font-extrabold text-xl mb-1">Bunları İşaretleme ❌</h2>
                <p className="text-white/60 text-sm">Bu sembolleri tıklama — bunlar tuzak!</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-5 border border-red-400/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-red-300 text-xs font-semibold mb-2">p harfi olduğu için YANLIŞ</p>
                    <div className="flex gap-3 justify-center text-red-400">
                      {renderSymbol('p', 2, 0, 'bg-red-500/20 border-red-400/40')}
                      {renderSymbol('p', 1, 1, 'bg-red-500/20 border-red-400/40')}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-red-300 text-xs font-semibold mb-2">Çizgi sayısı 2 değil, YANLIŞ</p>
                    <div className="flex gap-3 justify-center text-red-400">
                      {renderSymbol('d', 1, 0, 'bg-red-500/20 border-red-400/40', '1 çizgi')}
                      {renderSymbol('d', 3, 0, 'bg-red-500/20 border-red-400/40', '3 çizgi')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/70 text-sm text-center">
                  Kısacası: <strong className="text-emerald-400">d + 2 çizgi = İşaretle</strong> · Geri kalan her şey = Geç
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInstructionStep(1)} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold hover:bg-white/15 transition-all">← Geri</button>
                <button onClick={() => { setInstructionStep(3); setPracticeChecked(false); setPracticeSelections(Array(10).fill(false)); }} className="flex-1 py-3 rounded-xl bg-[#10b981] text-white font-bold hover:bg-[#059669] transition-all shadow-lg">Antrenman Yap →</button>
              </div>
            </>
          )}

          {/* ADIM 3: Antrenman */}
          {instructionStep === 3 && (
            <>
              <div className="text-center">
                <h2 className="text-white font-extrabold text-xl mb-1">Antrenman 🏋️</h2>
                <p className="text-white/60 text-sm">Aşağıdaki sembollerden <strong className="text-emerald-400">d + 2 çizgi</strong> olanları tıkla</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {practiceSymbols.map((sym, i) => {
                    const isSelected = practiceSelections[i];
                    const showResult = practiceChecked;
                    const isCorrectSelection = showResult && isSelected === sym.isTarget;
                    const isWrongSelection = showResult && isSelected !== sym.isTarget;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (practiceChecked) return;
                          setPracticeSelections(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
                        }}
                        className={`flex flex-col items-center rounded-lg p-2 gap-0.5 border transition-all ${
                          showResult
                            ? isCorrectSelection
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                              : isWrongSelection
                                ? 'bg-red-500/30 border-red-400 text-red-300'
                                : 'bg-white/5 border-white/15 text-white/50'
                            : isSelected
                              ? 'bg-amber-500/30 border-amber-400 text-amber-300 scale-105'
                              : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex gap-1 justify-center h-2.5">
                          {Array.from({ length: sym.above }, (_, j) => <div key={j} className="w-0.5 h-full bg-current rounded-full" />)}
                        </div>
                        <span className="font-black text-lg leading-none">{sym.letter}</span>
                        <div className="flex gap-1 justify-center h-2.5">
                          {Array.from({ length: sym.below }, (_, j) => <div key={j} className="w-0.5 h-full bg-current rounded-full" />)}
                        </div>
                        {showResult && (
                          <span className="text-[9px] mt-0.5">
                            {isCorrectSelection ? '✅' : isWrongSelection ? '❌' : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {practiceChecked && (
                  <div className={`mt-4 p-3 rounded-lg text-center text-sm font-semibold ${
                    practiceCorrect >= 8 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {practiceCorrect}/10 doğru! {practiceCorrect >= 8 ? 'Harika, hazırsın! 🎉' : 'Tekrar dene, kuralı hatırla: d + 2 çizgi'}
                  </div>
                )}
              </div>

              {!practiceChecked ? (
                <div className="flex gap-3">
                  <button onClick={() => setInstructionStep(2)} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold hover:bg-white/15 transition-all">← Geri</button>
                  <button onClick={() => setPracticeChecked(true)} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all shadow-lg">Kontrol Et ✓</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => { setPracticeChecked(false); setPracticeSelections(Array(10).fill(false)); }} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold hover:bg-white/15 transition-all">Tekrar Dene</button>
                  <button onClick={startTest} className="flex-1 py-3 rounded-xl bg-[#10b981] text-white font-extrabold hover:bg-[#059669] transition-all shadow-lg">Teste Başla 🚀</button>
                </div>
              )}

              <div className="space-y-1.5 text-white/50 text-xs">
                <p>⏱️ Gerçek testte her satır için {timePerRow} saniyen olacak.</p>
                <p>👆 Soldan sağa doğru ilerle.</p>
                {isPortrait && <p className="text-amber-300">⚠️ Test sırasında telefonu yatay tut!</p>}
              </div>
            </>
          )}

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
  const symCount = row.length;

  return (
    <>
      <style>{`body, html { overflow: hidden !important; height: 100% !important; }`}</style>

      <div className="h-[100dvh] bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] flex flex-col overflow-hidden fixed inset-0 z-50">
        {/* Header */}
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

        {/* Sembol Alanı — scroll yok, tüm satır ekrana sığar */}
        <div className="flex-1 flex items-center px-1 sm:px-3 lg:px-6 py-2 overflow-hidden">
          <div
            className="w-full grid mx-auto"
            style={{
              gridTemplateColumns: `repeat(${symCount}, 1fr)`,
              gap: 'clamp(1px, 0.3vw, 4px)',
              height: 'clamp(47px, 11vh, 90px)',
            }}
          >
            {row.map((sym, idx) => (
              <D2SymbolCell
                key={idx}
                symbol={sym}
                selected={rowSelections[currentRow]?.[idx] ?? false}
                onToggle={() => toggleSymbol(currentRow, idx)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
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
