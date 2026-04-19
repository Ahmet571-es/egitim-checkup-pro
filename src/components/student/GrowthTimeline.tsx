'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { StudentTrend } from '@/lib/services/longitudinal';
import { getStudentAllTrends } from '@/lib/services/longitudinal';

// ── Test renkleri ───────────────────────────────────────────
const TEST_COLORS: Record<string, string> = {
  enneagram: '#8b5cf6',
  vark: '#10b981',
  holland: '#f59e0b',
  'coklu-zeka': '#6366f1',
  'sinav-kaygisi': '#ef4444',
  'calisma-davranisi': '#0ea5e9',
  'akademik-analiz': '#059669',
  'hizli-okuma': '#f97316',
  'd2-dikkat': '#dc2626',
  'sag-sol-beyin': '#7c3aed',
};

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram',
  vark: 'VARK',
  holland: 'Holland',
  'coklu-zeka': 'Coklu Zeka',
  'sinav-kaygisi': 'Sinav Kaygisi',
  'calisma-davranisi': 'Calisma Davranisi',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hizli Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sag-Sol Beyin',
};

// ── Trend ikonu ─────────────────────────────────────────────
function TrendIcon({ direction }: { direction: string }) {
  if (direction === 'improving')
    return <TrendingUp size={16} className="text-emerald-500" />;
  if (direction === 'declining')
    return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-gray-400 dark:text-slate-500" />;
}

function TrendBadge({ direction }: { direction: string }) {
  const config = {
    improving: { label: 'Yukseliyor', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    declining: { label: 'Dusuyor', bg: 'bg-red-50', text: 'text-red-700' },
    stable: { label: 'Sabit', bg: 'bg-gray-50 dark:bg-slate-800/60', text: 'text-gray-600 dark:text-slate-300' },
  };
  const c = config[direction as keyof typeof config] ?? config.stable;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <TrendIcon direction={direction} />
      {c.label}
    </span>
  );
}

// ── Ozel Tooltip ────────────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  payload: {
    attempt: number;
    [key: string]: unknown;
  };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const attempt = payload[0]?.payload?.attempt;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700/60 p-3 min-w-[160px]">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 mb-1">
          <span className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}
          </span>
          <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
            {Math.round(entry.value)} puan
          </span>
        </div>
      ))}
      {attempt && (
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 pt-1 border-t border-gray-50">
          {attempt}. deneme
        </p>
      )}
    </div>
  );
}

// ── Ana Komponent ───────────────────────────────────────────
export default function GrowthTimeline() {
  const supabase = useMemo(() => createClient(), []);
  const [trends, setTrends] = useState<StudentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const allTrends = await getStudentAllTrends(user.id);
        setTrends(allTrends);

        // Varsayilan: tum testleri sec
        setSelectedTests(new Set(allTrends.map((t) => t.testType)));
      } catch (err) {
        console.error('Gelişim verisi yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  // Grafik verisi olustur
  const chartData = useMemo(() => {
    if (trends.length === 0) return [];

    // Tum denemeleri birlestir (tarih bazli)
    const dateMap = new Map<string, Record<string, unknown>>();

    for (const trend of trends) {
      if (!selectedTests.has(trend.testType)) continue;
      for (const attempt of trend.attempts) {
        const dateKey = new Date(attempt.created_at).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        });
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey, _ts: new Date(attempt.created_at).getTime() });
        }
        const entry = dateMap.get(dateKey)!;
        entry[trend.testType] = attempt.score;
        entry[`${trend.testType}_attempt`] = attempt.attempt_number;
        entry.attempt = attempt.attempt_number;
      }
    }

    return Array.from(dateMap.values()).sort(
      (a, b) => (a._ts as number) - (b._ts as number)
    );
  }, [trends, selectedTests]);

  const toggleTest = (testType: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testType)) next.delete(testType);
      else next.add(testType);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-10 text-center">
        <BarChart2 size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-slate-400 font-semibold">Henuz gelisim verisi yok</p>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
          Testleri tamamladikca gelisim grafigin burada gorunecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Baslik */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <BarChart2 size={20} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100">
            Gelisim Grafigin
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Tum testlerdeki ilerlemeni takip et
          </p>
        </div>
      </div>

      {/* Test Filtreleri */}
      <div className="flex flex-wrap gap-2">
        {trends.map((t) => (
          <button
            key={t.testType}
            onClick={() => toggleTest(t.testType)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              selectedTests.has(t.testType)
                ? 'border-transparent text-white shadow-sm'
                : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/30'
            }`}
            style={
              selectedTests.has(t.testType)
                ? { backgroundColor: TEST_COLORS[t.testType] ?? '#6b7280' }
                : undefined
            }
          >
            {TEST_LABELS[t.testType] ?? t.testType}
          </button>
        ))}
      </div>

      {/* Grafik */}
      {chartData.length > 0 && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-4 shadow-sm">
          <div className="w-full" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {trends
                  .filter((t) => selectedTests.has(t.testType))
                  .map((t) => (
                    <Line
                      key={t.testType}
                      type="monotone"
                      dataKey={t.testType}
                      name={TEST_LABELS[t.testType] ?? t.testType}
                      stroke={TEST_COLORS[t.testType] ?? '#6b7280'}
                      strokeWidth={2}
                      dot={{ r: 4, fill: TEST_COLORS[t.testType] ?? '#6b7280' }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trend Ozet Kartlari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trends.map((t) => {
          const growth =
            t.attempts.length >= 2
              ? Math.round(
                  ((t.latestScore - t.firstScore) /
                    (t.firstScore !== 0 ? Math.abs(t.firstScore) : 1)) *
                    100
                )
              : 0;

          return (
            <div
              key={t.testType}
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: (TEST_COLORS[t.testType] ?? '#6b7280') + '15',
                    color: TEST_COLORS[t.testType] ?? '#6b7280',
                  }}
                >
                  {TEST_LABELS[t.testType] ?? t.testType}
                </span>
                <TrendBadge direction={t.direction} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-[#0f2847] dark:text-slate-100">
                    {Math.round(t.latestScore)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">Son skor</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      growth > 0
                        ? 'text-emerald-600'
                        : growth < 0
                          ? 'text-red-600'
                          : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {growth > 0 ? '+' : ''}
                    {growth}%
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {t.attempts.length} deneme
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
