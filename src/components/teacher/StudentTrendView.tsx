'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ChevronDown,
  BarChart2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StudentTrend } from '@/lib/services/longitudinal';
import { getStudentAllTrends } from '@/lib/services/longitudinal';

// ── Test renkleri & etiketleri ──────────────────────────────
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
  holland: 'Meslek Testi',
  'coklu-zeka': 'Coklu Zeka',
  'sinav-kaygisi': 'Sinav Kaygisi',
  'calisma-davranisi': 'Calisma Davranisi',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hizli Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sag-Sol Beyin',
};

interface StudentOption {
  id: string;
  full_name: string;
}

function TrendArrow({ direction }: { direction: string }) {
  if (direction === 'improving')
    return <TrendingUp size={16} className="text-emerald-500" />;
  if (direction === 'declining')
    return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-gray-400 dark:text-slate-500" />;
}

export default function StudentTrendView() {
  const supabase = useMemo(() => createClient(), []);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [trends, setTrends] = useState<StudentTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Ogretmenin siniflarindaki ogrencileri getir
  useEffect(() => {
    async function loadStudents() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingStudents(false);
        return;
      }

      // Ogretmenin siniflari
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id);

      if (!classes || classes.length === 0) {
        setLoadingStudents(false);
        return;
      }

      const classIds = classes.map((c) => c.id);

      // Siniftaki ogrenciler
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id, profiles!class_students_student_id_fkey(id, full_name)')
        .in('class_id', classIds);

      const uniqueMap = new Map<string, string>();
      for (const cs of classStudents ?? []) {
        const profile = cs.profiles as unknown as { id: string; full_name: string };
        if (profile && !uniqueMap.has(profile.id)) {
          uniqueMap.set(profile.id, profile.full_name);
        }
      }

      const opts = Array.from(uniqueMap.entries()).map(([id, full_name]) => ({
        id,
        full_name,
      }));
      opts.sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr'));
      setStudents(opts);
      setLoadingStudents(false);
    }
    loadStudents();
  }, [supabase]);

  // Secilen ogrencinin trendlerini getir
  useEffect(() => {
    if (!selectedStudentId) {
      setTrends([]);
      return;
    }
    async function loadTrends() {
      setLoading(true);
      const result = await getStudentAllTrends(selectedStudentId);
      setTrends(result);
      setLoading(false);
    }
    loadTrends();
  }, [selectedStudentId]);

  // Grafik verisi
  const chartData = useMemo(() => {
    if (trends.length === 0) return [];
    const dateMap = new Map<string, Record<string, unknown>>();

    for (const trend of trends) {
      for (const attempt of trend.attempts) {
        const dateKey = new Date(attempt.created_at).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
        });
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey, _ts: new Date(attempt.created_at).getTime() });
        }
        dateMap.get(dateKey)![trend.testType] = attempt.score;
      }
    }

    return Array.from(dateMap.values()).sort(
      (a, b) => (a._ts as number) - (b._ts as number)
    );
  }, [trends]);

  return (
    <div className="space-y-5">
      {/* Baslik */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Users size={20} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100">
            Ogrenci Gelisim Takibi
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Ogrenci secin ve tum testlerdeki gelisimini gorun
          </p>
        </div>
      </div>

      {/* Ogrenci Secici */}
      <div className="relative max-w-md">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full appearance-none bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-slate-700/60 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0f2847] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm"
          disabled={loadingStudents}
        >
          <option value="">
            {loadingStudents ? 'Yukleniyor...' : 'Ogrenci secin...'}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-3 text-gray-400 dark:text-slate-500 pointer-events-none"
        />
      </div>

      {/* Icerik */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedStudentId && trends.length === 0 ? (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-10 text-center">
          <BarChart2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">
            Bu ogrencinin henuz gelisim verisi yok.
          </p>
        </div>
      ) : selectedStudentId && trends.length > 0 ? (
        <>
          {/* Grafik */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-4 shadow-sm">
            <div className="w-full" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                  />
                  <Tooltip />
                  {trends.map((t) => (
                    <Line
                      key={t.testType}
                      type="monotone"
                      dataKey={t.testType}
                      name={TEST_LABELS[t.testType] ?? t.testType}
                      stroke={TEST_COLORS[t.testType] ?? '#6b7280'}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detay Tablosu */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f2847] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Test
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                      Son Skor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                      Onceki Skor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                      Degisim %
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((t, idx) => {
                    const change =
                      t.attempts.length >= 2 && t.firstScore !== 0
                        ? Math.round(
                            ((t.latestScore - t.firstScore) /
                              Math.abs(t.firstScore)) *
                              100
                          )
                        : 0;
                    const prevScore =
                      t.attempts.length >= 2
                        ? t.attempts[t.attempts.length - 2].score
                        : t.firstScore;

                    return (
                      <tr
                        key={t.testType}
                        className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${
                          idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-800/60/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor:
                                (TEST_COLORS[t.testType] ?? '#6b7280') + '15',
                              color: TEST_COLORS[t.testType] ?? '#6b7280',
                            }}
                          >
                            {TEST_LABELS[t.testType] ?? t.testType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-[#0f2847] dark:text-slate-100">
                          {Math.round(t.latestScore)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 dark:text-slate-400">
                          {Math.round(prevScore)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${
                              change > 0
                                ? 'text-emerald-600'
                                : change < 0
                                  ? 'text-red-600'
                                  : 'text-gray-500 dark:text-slate-400'
                            }`}
                          >
                            {change > 0 ? '+' : ''}
                            {change}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TrendArrow direction={t.direction} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
