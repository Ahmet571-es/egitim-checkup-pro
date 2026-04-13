'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { calculateGrowthScore } from '@/lib/services/longitudinal';

interface TestScoreComparisonProps {
  testName: string;
  currentScore: number;
  previousScore: number;
  currentAttempt: number;
}

export default function TestScoreComparison({
  testName,
  currentScore,
  previousScore,
  currentAttempt,
}: TestScoreComparisonProps) {
  const growth = calculateGrowthScore(currentScore, previousScore);
  const isImproved = growth.changePercent > 0;
  const isDeclined = growth.changePercent < 0;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
      {/* Baslik */}
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} className="text-violet-500" />
        <h3 className="font-extrabold text-[#0f2847] text-sm">
          Gelisim Karsilastirmasi
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          {currentAttempt}. deneme
        </span>
      </div>

      {/* Skor karsilastirma */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Onceki */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Onceki</p>
          <p className="text-xl font-extrabold text-gray-600">
            {Math.round(previousScore)}
          </p>
        </div>

        {/* Ok */}
        <div className="flex items-center justify-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isImproved
                ? 'bg-emerald-50'
                : isDeclined
                  ? 'bg-red-50'
                  : 'bg-gray-50'
            }`}
          >
            {isImproved ? (
              <TrendingUp size={24} className="text-emerald-500" />
            ) : isDeclined ? (
              <TrendingDown size={24} className="text-red-500" />
            ) : (
              <Minus size={24} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* Simdiki */}
        <div
          className={`rounded-xl p-3 text-center ${
            isImproved
              ? 'bg-emerald-50'
              : isDeclined
                ? 'bg-red-50'
                : 'bg-gray-50'
          }`}
        >
          <p className="text-xs text-gray-400 mb-1">Simdiki</p>
          <p
            className={`text-xl font-extrabold ${
              isImproved
                ? 'text-emerald-700'
                : isDeclined
                  ? 'text-red-700'
                  : 'text-gray-700'
            }`}
          >
            {Math.round(currentScore)}
          </p>
        </div>
      </div>

      {/* Degisim */}
      <div
        className={`rounded-xl p-3 text-center ${
          isImproved
            ? 'bg-emerald-50 border border-emerald-100'
            : isDeclined
              ? 'bg-red-50 border border-red-100'
              : 'bg-gray-50 border border-gray-100'
        }`}
      >
        <p
          className={`text-lg font-extrabold ${
            isImproved
              ? 'text-emerald-600'
              : isDeclined
                ? 'text-red-600'
                : 'text-gray-600'
          }`}
        >
          {growth.changePercent > 0 ? '+' : ''}
          {growth.changePercent}%
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isImproved
            ? 'Tebrikler! Gelisim gosterdin!'
            : isDeclined
              ? 'Endiselenme, bir dahaki sefere daha iyi olacak!'
              : 'Skorun sabit kaldi.'}
        </p>
      </div>
    </div>
  );
}
