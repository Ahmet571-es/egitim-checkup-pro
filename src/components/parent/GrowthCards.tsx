'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { calculateGrowthScore } from '@/lib/services/longitudinal';

// ── Tipler ──────────────────────────────────────────────────
interface TestGrowthData {
  testType: string;
  testLabel: string;
  testIcon: string;
  testColor: string;
  latestScore: number;
  previousScore: number;
  attemptCount: number;
  direction: 'improving' | 'declining' | 'stable';
}

interface GrowthCardsProps {
  growthData: TestGrowthData[];
}

const DIRECTION_CONFIG = {
  improving: {
    label: 'Yükseliyor',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-500',
    Icon: TrendingUp,
  },
  declining: {
    label: 'Düşüyor',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-100',
    iconColor: 'text-red-500',
    Icon: TrendingDown,
  },
  stable: {
    label: 'Sabit',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-100',
    iconColor: 'text-gray-400',
    Icon: Minus,
  },
};

export default function GrowthCards({ growthData }: GrowthCardsProps) {
  if (!growthData || growthData.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-8 text-center">
        <BarChart2 size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold text-sm">
          Henüz gelişim verisi yok
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Çocuğunuz testleri tamamladıkça gelişim kartları burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Baslik */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <BarChart2 size={20} className="text-pink-600" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0f2847]">
            Gelişim Özeti
          </h2>
          <p className="text-xs text-gray-400">
            Çocuğunuzun test bazlı ilerleme durumu
          </p>
        </div>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {growthData.map((item) => {
          const growth = calculateGrowthScore(
            item.latestScore,
            item.previousScore
          );
          const config = DIRECTION_CONFIG[item.direction];
          const { Icon } = config;

          return (
            <div
              key={item.testType}
              className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden`}
            >
              {/* Ust renk cizgi */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: item.testColor }}
              />

              <div className="p-4">
                {/* Test baslik */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.testIcon}</span>
                    <span className="text-sm font-bold text-[#0f2847]">
                      {item.testLabel}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text} border ${config.border}`}
                  >
                    <Icon size={12} />
                    {config.label}
                  </span>
                </div>

                {/* Skorlar */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-extrabold text-[#0f2847]">
                      {Math.round(item.latestScore)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Son skor
                    </p>
                  </div>

                  <div className="text-center">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                        growth.changePercent > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : growth.changePercent < 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon size={14} className={config.iconColor} />
                      <span className="text-sm font-bold">
                        {growth.changePercent > 0 ? '+' : ''}
                        {Math.round(growth.changePercent)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-400">
                      {Math.round(item.previousScore)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Önceki skor
                    </p>
                  </div>
                </div>

                {/* Deneme sayisi */}
                <div className="mt-3 pt-2 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 text-center">
                    Toplam {item.attemptCount} deneme yapıldı
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
