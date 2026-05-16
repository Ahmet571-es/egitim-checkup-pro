'use client';

import React from 'react';
import { Check } from 'lucide-react';

export type QuestionType = 'likert5' | 'likert4' | 'binary' | 'mc' | 'mc_single' | 'visual';

export interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  questionType: QuestionType;
  options?: Record<string, string>;
  value?: string | number | string[];
  onChange: (value: string | number | string[]) => void;
  accentColor?: string;
  passage?: string;
  /** Inline SVG string — yalnızca type='visual' iken render edilir. */
  promptSvg?: string;
}

const LIKERT5_LABELS = [
  { value: 1, label: 'Hiç', short: '1' },
  { value: 2, label: 'Nadiren', short: '2' },
  { value: 3, label: 'Bazen', short: '3' },
  { value: 4, label: 'Sıklıkla', short: '4' },
  { value: 5, label: 'Her Zaman', short: '5' },
];

const LIKERT4_LABELS = [
  { value: 0, label: 'Bana hiç uygun değil', short: '0' },
  { value: 1, label: 'Bana az uygun', short: '1' },
  { value: 2, label: 'Bana kısmen uygun', short: '2' },
  { value: 3, label: 'Bana çok uygun', short: '3' },
  { value: 4, label: 'Bana tamamen uygun', short: '4' },
];

/** Madde 16: Interactive question card with hover lift, selection feedback, check icon slide-in */
export default function QuestionCard({
  questionNumber, questionText, questionType, options, value, onChange, accentColor = '#10b981', passage, promptSvg,
}: QuestionCardProps) {

  const isSelected = (v: string | number) => value === v;

  const OptionButton = ({ v, label, short }: { v: string | number; label: string; short: string }) => {
    const selected = isSelected(v);
    return (
      <button
        onClick={() => onChange(v)}
        className={`touch-feedback w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
          selected
            ? 'border-transparent text-white shadow-lg scale-[1.01]'
            : 'border-white/15 text-white/70 hover:border-white/30 hover:-translate-y-0.5 bg-white/5'
        } ${!selected && value !== undefined ? 'opacity-70' : ''}`}
        style={selected ? { backgroundColor: accentColor + '33', borderColor: accentColor } : {}}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-200"
          style={selected ? { backgroundColor: accentColor, color: 'white' } : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          {selected ? <Check size={14} className="animate-[scale-in_0.15s_ease-out]" /> : short}
        </span>
        <span className="text-sm sm:text-base">{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Reading passage */}
      {passage && (
        <div className="bg-white/5 border border-white/15 rounded-xl p-4 text-white/80 text-sm leading-relaxed max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Okuma Parçası</p>
          <p>{passage}</p>
        </div>
      )}

      {/* Görsel prompt — type='visual' iken soru metninden önce SVG göster */}
      {questionType === 'visual' && promptSvg && (
        <div
          className="rounded-2xl overflow-hidden bg-white/95 border-2 border-white/30 shadow-2xl shadow-black/30 mb-2"
          dangerouslySetInnerHTML={{ __html: promptSvg }}
        />
      )}

      {/* Question */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
          Soru {questionNumber}{questionType === 'visual' ? ' · Görsel' : ''}
        </p>
        <p className="text-white font-medium text-base sm:text-lg leading-relaxed">{questionText}</p>
      </div>

      {/* Options */}
      {questionType === 'likert5' && (
        <div className="space-y-2">
          {LIKERT5_LABELS.map(({ value: v, label, short }) => (
            <OptionButton key={v} v={v} label={label} short={short} />
          ))}
        </div>
      )}

      {questionType === 'likert4' && (
        <div className="space-y-2">
          {LIKERT4_LABELS.map(({ value: v, label, short }) => (
            <OptionButton key={v} v={v} label={label} short={short} />
          ))}
        </div>
      )}

      {questionType === 'binary' && (
        <div className="grid grid-cols-2 gap-3">
          {[{ v: 'D', label: 'Doğru' }, { v: 'Y', label: 'Yanlış' }].map(({ v, label }) => {
            const selected = isSelected(v);
            return (
              <button
                key={v}
                onClick={() => onChange(v)}
                className={`touch-feedback flex items-center justify-center gap-2 py-4 rounded-xl border font-semibold text-sm transition-all duration-200 ${
                  selected
                    ? 'border-transparent text-white shadow-lg scale-[1.02]'
                    : 'border-white/15 text-white/70 hover:bg-white/5 hover:-translate-y-0.5 bg-white/5'
                }`}
                style={selected ? { backgroundColor: accentColor + '33', borderColor: accentColor } : {}}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                  style={selected ? { backgroundColor: accentColor, color: 'white' } : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {selected ? <Check size={12} /> : v}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {(questionType === 'mc' || questionType === 'mc_single' || questionType === 'visual') && options && (
        <div className="space-y-2">
          {Object.entries(options).map(([key, label]) => {
            const selected = isSelected(key);
            return (
              <button
                key={key}
                onClick={() => onChange(key)}
                className={`touch-feedback w-full flex items-start gap-4 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                  selected
                    ? 'border-transparent text-white shadow-lg scale-[1.01]'
                    : 'border-white/15 text-white/70 hover:border-white/30 hover:-translate-y-0.5 bg-white/5'
                } ${!selected && value !== undefined ? 'opacity-70' : ''}`}
                style={selected ? { backgroundColor: accentColor + '33', borderColor: accentColor } : {}}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 mt-0.5 transition-all duration-200"
                  style={selected ? { backgroundColor: accentColor, color: 'white' } : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  {selected ? <Check size={14} /> : key}
                </span>
                <span className="text-sm sm:text-base leading-relaxed">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
