'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BurdonSection, BurdonSectionResponse, BurdonCell } from '@/lib/tests/burdon-dikkat/engine';
import { BURDON_TARGETS } from '@/lib/tests/burdon-dikkat/engine';

interface Props {
  sections: BurdonSection[];
  practiceSection: BurdonSection;
  timePerSection: number;    // saniye
  timePractice: number;       // saniye
  studentGrade?: number | null;  // 5-12 (ortaokul=5-8, lise=9-12)
  studentAge?: number | null;    // Öğrencinin yaşı
  onComplete: (responses: BurdonSectionResponse[]) => void;
}

// ── Geri Sayım Çemberi ─────────────────────────────────
function CountdownCircle({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = remaining <= 10 ? '#ef4444' : remaining <= 30 ? '#f97316' : '#10b981';

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-bold text-[13px] leading-none">{mins}:{secs.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}

// ── Harf Hücresi ──────────────────────────────────────
function LetterCell({
  cell,
  marked,
  onToggle,
}: {
  cell: BurdonCell;
  marked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative select-none transition-all font-serif
        w-7 h-9 sm:w-8 sm:h-10
        flex items-center justify-center
        ${marked
          ? 'text-amber-200'
          : 'text-white/80 hover:text-white hover:bg-white/5'
        }
      `}
      aria-pressed={marked}
    >
      <span className="text-[18px] sm:text-[20px] font-bold leading-none">{cell.letter}</span>
      {marked && (
        <span
          className="absolute left-[10%] right-[10%] bottom-[15%] bg-amber-400"
          style={{ height: '2px' }}
        />
      )}
    </button>
  );
}

// ── Phase tipleri ─────────────────────────────────────
type Phase =
  | 'instructions'        // Bilgilendirme kılavuzu
  | 'practice-intro'      // Deneme bölümüne giriş
  | 'practice'            // Deneme yapıyor
  | 'practice-feedback'   // Deneme sonrası geribildirim
  | 'main-intro'          // Asıl teste giriş
  | 'section-running'     // Bir bölüm çalışıyor
  | 'section-break'       // Bölüm araları
  | 'done';               // Bitti

export default function BurdonTestBoard({
  sections,
  practiceSection,
  timePerSection,
  timePractice,
  studentGrade,
  studentAge,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>('instructions');
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionStartTime, setSectionStartTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(timePerSection);
  const [markedByRow, setMarkedByRow] = useState<Record<number, Set<number>>>({});
  const [practiceMarked, setPracticeMarked] = useState<Record<number, Set<number>>>({});
  const [reachedRow, setReachedRow] = useState(0);
  const [responses, setResponses] = useState<BurdonSectionResponse[]>([]);

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Zamanlayıcı ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'section-running' && phase !== 'practice') return;
    if (sectionStartTime === null) return;

    const totalTime = phase === 'practice' ? timePractice : timePerSection;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sectionStartTime) / 1000);
      const left = totalTime - elapsed;
      if (left <= 0) {
        setRemaining(0);
        if (phase === 'practice') {
          finishPractice();
        } else {
          finishSection();
        }
      } else {
        setRemaining(left);
      }
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sectionStartTime]);

  // ── Bir hücre tıklandı ──────────────────────────────
  const toggleMark = useCallback((rowIdx: number, colIdx: number) => {
    if (phase === 'practice') {
      setPracticeMarked(prev => {
        const newRow = new Set(prev[rowIdx] ?? []);
        if (newRow.has(colIdx)) newRow.delete(colIdx); else newRow.add(colIdx);
        return { ...prev, [rowIdx]: newRow };
      });
    } else if (phase === 'section-running') {
      setMarkedByRow(prev => {
        const newRow = new Set(prev[rowIdx] ?? []);
        if (newRow.has(colIdx)) newRow.delete(colIdx); else newRow.add(colIdx);
        return { ...prev, [rowIdx]: newRow };
      });
      setReachedRow(r => Math.max(r, rowIdx));
    }
  }, [phase]);

  // ── Deneme başlat ───────────────────────────────────
  const startPractice = () => {
    setPracticeMarked({});
    setSectionStartTime(Date.now());
    setRemaining(timePractice);
    setPhase('practice');
  };

  // ── Deneme bitir ────────────────────────────────────
  const finishPractice = useCallback(() => {
    setPhase('practice-feedback');
    setSectionStartTime(null);
  }, []);

  // ── Asıl teste başla ────────────────────────────────
  const startMainTest = () => {
    setCurrentSection(0);
    setMarkedByRow({});
    setReachedRow(0);
    setPhase('main-intro');
  };

  const startSection = () => {
    setMarkedByRow({});
    setReachedRow(0);
    setSectionStartTime(Date.now());
    setRemaining(timePerSection);
    setPhase('section-running');
  };

  // ── Bölüm bitir ─────────────────────────────────────
  const finishSection = useCallback(() => {
    const sectionIdx = currentSection;
    const timeTaken = sectionStartTime
      ? Math.floor((Date.now() - sectionStartTime) / 1000)
      : timePerSection;
    const newResponse: BurdonSectionResponse = {
      section: sectionIdx,
      responses: Object.entries(markedByRow).map(([row, set]) => ({
        row: parseInt(row),
        markedCells: Array.from(set),
      })),
      completed: remaining > 0,
      timeTakenSeconds: timeTaken,
      reachedRow,
    };

    const newResponses = [...responses, newResponse];
    setResponses(newResponses);
    setSectionStartTime(null);

    if (sectionIdx < sections.length - 1) {
      setCurrentSection(sectionIdx + 1);
      setPhase('section-break');
    } else {
      setPhase('done');
      setTimeout(() => onComplete(newResponses), 600);
    }
  }, [currentSection, sectionStartTime, markedByRow, reachedRow, remaining, responses, sections.length, onComplete, timePerSection]);

  // ── RENDER: Bilgilendirme Kılavuzu ──────────────────
  if (phase === 'instructions') {
    // Yaş ve sınıf bilgisi — öğrencinin profilinden
    const isLise = studentGrade != null && studentGrade >= 9 && studentGrade <= 12;
    const levelLabel = isLise ? 'lise' : 'ortaokul';
    const minutes = Math.floor(timePerSection / 60);
    const extraSecs = timePerSection % 60;
    const timeLabel = extraSecs > 0
      ? `${minutes} dakika ${extraSecs} saniye`
      : `${minutes} dakika`;

    return (
      <div className="max-w-3xl mx-auto">
        {/* ═══ KİŞİSELLEŞTİRİLMİŞ YAŞ/SÜRE BİLGİLENDİRME KARTI ═══ */}
        {(studentAge || studentGrade) && (
          <div className="mb-4 relative bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-400/40 rounded-2xl p-5 backdrop-blur-xl overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                <span className="text-[24px]">👋</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-amber-200 font-extrabold text-[14px] uppercase tracking-wider mb-2">
                  Senin İçin Kişiselleştirildi
                </h3>
                <div className="space-y-2 text-white/90 text-[13.5px] leading-relaxed">
                  {studentAge && (
                    <p>
                      📅 <strong className="text-amber-200">{studentAge} yaşında</strong> olduğun için
                      {studentGrade && <> ({studentGrade}. sınıf — <strong>{levelLabel}</strong>)</>}
                      {!studentGrade && isLise === false && <> (<strong>{levelLabel}</strong>)</>},
                      test süreleri sana göre ayarlandı.
                    </p>
                  )}
                  {!studentAge && studentGrade && (
                    <p>
                      📅 <strong className="text-amber-200">{studentGrade}. sınıf ({levelLabel})</strong> olduğun için test süreleri sana göre ayarlandı.
                    </p>
                  )}
                  <div className="bg-white/5 rounded-lg p-3 border border-amber-400/20 mt-2">
                    <p className="text-amber-100">
                      ⏱️ Her bölüm için <strong className="text-white text-[15px]">{timeLabel}</strong> sürem var.
                    </p>
                    <p className="text-white/60 text-[11.5px] mt-1 italic">
                      ({isLise
                        ? 'Lise düzeyinde orijinal MEB standardı 2 dakikadır.'
                        : 'Ortaokul düzeyinde orijinal MEB standardı 3 dakikadır.'})
                    </p>
                  </div>
                  <p className="text-white/70 text-[12px]">
                    Toplam <strong>{sections.length} bölüm</strong> × {timeLabel} ≈ <strong>{Math.ceil((sections.length * timePerSection) / 60)} dakika</strong> aktif test süresi
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-400/30 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-[20px] sm:text-[24px] font-extrabold text-white mb-4">
            🔍 Burdon Dikkat Testi
          </h2>

          <div className="space-y-4 text-white/90 text-[14px] leading-relaxed">
            <div>
              <h3 className="text-cyan-300 font-bold text-[15px] mb-1.5">📋 Nasıl Yapılır?</h3>
              <p>
                Önünde <strong>{sections.length} ayrı bölüm</strong> olacak. Her bölümde{' '}
                <strong>20 satır</strong>, her satırda <strong>40 harf</strong> var. Görevin:
              </p>
              <div className="mt-2 bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-amber-200 font-bold mb-1">
                  Sayfadaki bütün{' '}
                  <span className="bg-amber-500/30 px-2 py-0.5 rounded">a</span>,{' '}
                  <span className="bg-amber-500/30 px-2 py-0.5 rounded">b</span>,{' '}
                  <span className="bg-amber-500/30 px-2 py-0.5 rounded">d</span>{' '}
                  ve{' '}
                  <span className="bg-amber-500/30 px-2 py-0.5 rounded">g</span>{' '}
                  harflerine tıklayarak altlarını çiz.
                </p>
                <p className="text-white/70 text-[13px]">
                  Diğer harflere dokunma. Bir harfe yanlışlıkla tıkladıysan tekrar tıklayarak işareti kaldırabilirsin.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-cyan-300 font-bold text-[15px] mb-1.5">⏱️ Süre</h3>
              <p>
                Her bölüm için <strong>{timeLabel}</strong> sürem var. Süre dolunca o bölüm otomatik biter ve sıradakine geçilir.
                Aralarda kısa bir nefes verilir.
              </p>
            </div>

            <div>
              <h3 className="text-cyan-300 font-bold text-[15px] mb-1.5">🎯 Strateji</h3>
              <ul className="list-disc list-inside space-y-1 text-white/85">
                <li>Bir satırı bitirmeden diğerine geçme — sırayla ilerle.</li>
                <li>Hızlı ama dikkatli ol. Her bir harfi tek tek kontrol et.</li>
                <li>Sayfadaki <strong>tüm</strong> a, b, d, g harflerini yakalamaya çalış — hiçbirini atlama.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-cyan-300 font-bold text-[15px] mb-1.5">✨ Önce Kısa Bir Deneme</h3>
              <p>
                Asıl teste başlamadan önce <strong>2 satırlık bir deneme</strong> yapacaksın.
                Bu deneme puanlanmaz — amacı, sistemin nasıl çalıştığını anlamanı sağlamak.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setPhase('practice-intro')}
              className="px-6 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all"
            >
              Anladım, Denemeye Geç →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: Deneme Girişi ───────────────────────────
  if (phase === 'practice-intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-400/30 rounded-2xl p-6 backdrop-blur-xl text-center">
          <div className="text-[48px] mb-3">🎯</div>
          <h2 className="text-[22px] font-extrabold text-white mb-3">Deneme Zamanı</h2>
          <p className="text-white/85 text-[14px] leading-relaxed mb-4">
            Aşağıdaki 2 satırda <strong className="text-amber-300">a, b, d, g</strong> harflerine tıklayarak altlarını çizmeyi dene.
            Süren <strong>{timePractice} saniye</strong>.
          </p>
          <p className="text-white/60 text-[12px] italic mb-5">
            Bu bölüm puanlanmaz — sadece sistemi anlaman için.
          </p>
          <button
            onClick={startPractice}
            className="px-8 py-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all"
          >
            Denemeyi Başlat
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Deneme Yapıyor ──────────────────────────
  if (phase === 'practice') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3 sticky top-0 z-10 bg-slate-900/90 backdrop-blur-xl py-2 border-b border-white/10">
          <div>
            <p className="text-amber-300 text-[11px] font-bold uppercase tracking-wider">Deneme</p>
            <h3 className="text-white font-extrabold text-[16px]">a, b, d, g harflerini işaretle</h3>
          </div>
          <CountdownCircle remaining={remaining} total={timePractice} />
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4">
          {practiceSection.rows.map((row, rIdx) => (
            <div key={rIdx} className="flex flex-wrap gap-0.5 py-1 border-b border-white/5 last:border-0">
              {row.map((cell, cIdx) => (
                <LetterCell
                  key={cIdx}
                  cell={cell}
                  marked={practiceMarked[rIdx]?.has(cIdx) ?? false}
                  onToggle={() => toggleMark(rIdx, cIdx)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={finishPractice}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[13px] font-bold transition"
          >
            Denemeyi Erken Bitir
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Deneme Geribildirimi ────────────────────
  if (phase === 'practice-feedback') {
    // Deneme doğruluk kontrolü
    let pcC = 0, pcE1 = 0, pcE2 = 0;
    practiceSection.rows.forEach((row, rIdx) => {
      const marks = practiceMarked[rIdx] ?? new Set<number>();
      row.forEach((cell, cIdx) => {
        const isMarked = marks.has(cIdx);
        if (cell.isTarget) {
          if (isMarked) pcC++; else pcE1++;
        } else {
          if (isMarked) pcE2++;
        }
      });
    });

    const totalTargets = practiceSection.targetCount;
    const accuracy = totalTargets > 0 ? Math.round((pcC / totalTargets) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-xl">
          <div className="text-center mb-5">
            <div className="text-[48px] mb-2">✓</div>
            <h2 className="text-[22px] font-extrabold text-white">Deneme Tamamlandı</h2>
            <p className="text-white/70 text-[13px] mt-1">İşte deneme sonucun:</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-emerald-400/30">
              <p className="text-emerald-300 text-[11px] font-bold uppercase">Doğru</p>
              <p className="text-white font-extrabold text-[22px]">{pcC}</p>
              <p className="text-white/50 text-[10px]">/ {totalTargets} hedef</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-amber-400/30">
              <p className="text-amber-300 text-[11px] font-bold uppercase">Atlanan</p>
              <p className="text-white font-extrabold text-[22px]">{pcE1}</p>
              <p className="text-white/50 text-[10px]">hedef kaçtı</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-rose-400/30">
              <p className="text-rose-300 text-[11px] font-bold uppercase">Yanlış</p>
              <p className="text-white font-extrabold text-[22px]">{pcE2}</p>
              <p className="text-white/50 text-[10px]">fazla çizdi</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-5">
            <p className="text-[13px] text-white/85">
              {accuracy >= 80 ? (
                <>✨ <strong className="text-emerald-300">Harika!</strong> Sistemi iyi anlamışsın. Asıl teste geçmeye hazırsın.</>
              ) : accuracy >= 50 ? (
                <>👍 <strong className="text-amber-300">İyi başladın.</strong> Asıl testte daha dikkatli olursan doğruluk oranın yükselir.</>
              ) : (
                <>💡 <strong className="text-rose-300">Dikkatli ol.</strong> Unutma: sadece <strong>a, b, d, g</strong> harflerinin altını çizeceksin. Diğer harflere dokunma.</>
              )}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setPracticeMarked({});
                setPhase('practice-intro');
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[13px] font-bold transition"
            >
              Tekrar Dene
            </button>
            <button
              onClick={startMainTest}
              className="px-6 py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-extrabold rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all"
            >
              Asıl Teste Başla →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: Asıl Teste Giriş ────────────────────────
  if (phase === 'main-intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-400/30 rounded-2xl p-6 backdrop-blur-xl text-center">
          <div className="text-[48px] mb-3">🚀</div>
          <h2 className="text-[22px] font-extrabold text-white mb-3">Asıl Test Başlıyor</h2>
          <div className="space-y-2 text-white/85 text-[14px] mb-5">
            <p><strong>{sections.length} bölüm</strong>, her biri <strong>{Math.floor(timePerSection / 60)}:{(timePerSection % 60).toString().padStart(2, '0')}</strong> süreli.</p>
            <p className="text-cyan-300">Toplam: ~{Math.ceil((sections.length * timePerSection) / 60)} dakika</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-3 mb-5">
            <p className="text-amber-200 text-[13px]">
              💡 Hazır olduğunda başlat butonuna bas. Süre başlayacak.
            </p>
          </div>
          <button
            onClick={startSection}
            className="px-8 py-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all text-[16px]"
          >
            Bölüm 1'i Başlat
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Bölüm Araları ───────────────────────────
  if (phase === 'section-break') {
    const nextSection = currentSection;  // currentSection zaten artırılmış
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-xl text-center">
          <div className="text-[48px] mb-3">☕</div>
          <h2 className="text-[22px] font-extrabold text-white mb-2">Bölüm {nextSection} Tamamlandı</h2>
          <p className="text-white/70 text-[14px] mb-4">
            Kısa bir nefes al. Hazır olduğunda sıradaki bölümü başlat.
          </p>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-5">
            <p className="text-[13px] text-white/85">
              Sıradaki: <strong>Bölüm {nextSection + 1} / {sections.length}</strong>
            </p>
          </div>
          <button
            onClick={startSection}
            className="px-8 py-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all"
          >
            Bölüm {nextSection + 1}'i Başlat →
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Bölüm Çalışıyor ─────────────────────────
  if (phase === 'section-running') {
    const section = sections[currentSection];
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-3 sticky top-0 z-10 bg-slate-900/90 backdrop-blur-xl py-2 border-b border-white/10">
          <div>
            <p className="text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
              Bölüm {currentSection + 1} / {sections.length}
            </p>
            <h3 className="text-white font-extrabold text-[15px] sm:text-[17px]">
              <span className="bg-amber-500/30 px-1.5 rounded">a</span>{' '}
              <span className="bg-amber-500/30 px-1.5 rounded">b</span>{' '}
              <span className="bg-amber-500/30 px-1.5 rounded">d</span>{' '}
              <span className="bg-amber-500/30 px-1.5 rounded">g</span>{' '}
              harflerini işaretle
            </h3>
          </div>
          <CountdownCircle remaining={remaining} total={timePerSection} />
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 sm:p-4 overflow-x-auto">
          {section.rows.map((row, rIdx) => (
            <div key={rIdx} className="flex flex-wrap gap-0.5 py-1 border-b border-white/5 last:border-0 min-w-max">
              <span className="text-white/30 text-[10px] font-mono w-5 flex items-center justify-center">{rIdx + 1}</span>
              {row.map((cell, cIdx) => (
                <LetterCell
                  key={cIdx}
                  cell={cell}
                  marked={markedByRow[rIdx]?.has(cIdx) ?? false}
                  onToggle={() => toggleMark(rIdx, cIdx)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={finishSection}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[13px] font-bold transition"
          >
            Bölümü Erken Bitir
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Done ────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 rounded-2xl p-8 text-center backdrop-blur-xl">
        <div className="text-[56px] mb-3">🎉</div>
        <h2 className="text-[24px] font-extrabold text-white mb-2">Test Tamamlandı!</h2>
        <p className="text-white/80 text-[14px]">Sonuçlar hesaplanıyor...</p>
      </div>
    </div>
  );
}
