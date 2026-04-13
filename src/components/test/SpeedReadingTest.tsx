'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReadingPassage } from '@/lib/tests/types';
import QuestionCard from './QuestionCard';

interface SpeedReadingTestProps {
  passage: ReadingPassage;
  onComplete: (answers: Record<string, string>, readingTimeSeconds: number) => void;
  accentColor?: string;
}

type Phase = 'reading' | 'questions' | 'done';

export default function SpeedReadingTest({
  passage,
  onComplete,
  accentColor = '#10b981',
}: SpeedReadingTestProps) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [readingTime, setReadingTime] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'reading') {
      timerRef.current = setInterval(() => setReadingTime(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const finishReading = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('questions');
  }, []);

  const handleAnswer = (qId: string, val: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: String(val) }));
  };

  const handleSubmit = () => {
    onComplete(answers, readingTime);
    setPhase('done');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Okuma fazı ────────────────────────────────────────
  if (phase === 'reading') {
    const words = passage.text.trim().split(/\s+/).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Başlık */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-white font-extrabold text-xl">📖 {passage.title}</h1>
              <div className="flex items-center gap-2">
                <div
                  className="px-3 py-1.5 rounded-full text-white font-bold text-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  ⏱️ {formatTime(readingTime)}
                </div>
              </div>
            </div>
            <p className="text-white/50 text-xs">{words} kelime</p>
          </div>

          {/* Metin */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="text-white/85 text-base leading-[1.85] whitespace-pre-line">
              {passage.text}
            </div>
          </div>

          {/* Oku Butonu */}
          <button
            onClick={finishReading}
            className="w-full py-4 rounded-xl font-extrabold text-white text-lg hover:opacity-90 transition-all hover:scale-[1.01] shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            Okumayı Bitirdim → Sorulara Geç
          </button>

          <p className="text-center text-white/40 text-xs">
            Okuma süren kaydediliyor. Bitirince butona tıkla.
          </p>
        </div>
      </div>
    );
  }

  // ── Soru fazı ─────────────────────────────────────────
  if (phase === 'questions') {
    const questions = passage.questions;
    const q = questions[currentQ];
    if (!q) return null;
    const answered = Object.keys(answers).length;
    const progress = (answered / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-bold">🧠 Anlama Soruları</p>
                <p className="text-white/50 text-xs mt-0.5">Okuma süresi: {formatTime(readingTime)}</p>
              </div>
              <span className="text-white/60 text-sm">{currentQ + 1}/{questions.length}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
            </div>
          </div>

          {/* Soru kartı */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <QuestionCard
              questionNumber={currentQ + 1}
              questionText={q.text}
              questionType="mc"
              options={q.options}
              value={answers[q.id]}
              onChange={val => handleAnswer(q.id, val)}
              accentColor={accentColor}
            />
          </div>

          {/* Navigasyon */}
          <div className="flex gap-3">
            {currentQ > 0 && (
              <button
                onClick={() => setCurrentQ(p => p - 1)}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
              >
                ← Önceki
              </button>
            )}
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(p => p + 1)}
                disabled={!answers[q.id]}
                className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ backgroundColor: answers[q.id] ? accentColor : 'rgba(255,255,255,0.1)' }}
              >
                Sonraki →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answered < questions.length}
                className="flex-1 py-3 rounded-xl text-white font-extrabold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ backgroundColor: answered >= questions.length ? accentColor : 'rgba(255,255,255,0.1)' }}
              >
                Testi Bitir ✓
              </button>
            )}
          </div>

          {answered < questions.length && (
            <p className="text-center text-white/40 text-xs">
              {questions.length - answered} soru kaldı
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2847] to-[#1a3a5c] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">✅</div>
        <p className="font-bold text-xl">Test tamamlandı!</p>
        <p className="text-white/60 text-sm mt-2">Sonuçlar hesaplanıyor...</p>
      </div>
    </div>
  );
}
