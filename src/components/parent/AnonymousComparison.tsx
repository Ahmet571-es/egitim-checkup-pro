'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';
import { BarChart3, Loader2, Users, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Tipler ──────────────────────────────────────────────────
interface ComparisonData {
  testType: string;
  testLabel: string;
  studentScore: number;
  classAverage: number;
  percentile: number;
}

interface AnonymousComparisonProps {
  childId: string;
}

// ── Yüzdelik dilim hesaplama ────────────────────────────────
function calculatePercentile(studentScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 50;
  const belowCount = allScores.filter((s) => s < studentScore).length;
  return Math.round((belowCount / allScores.length) * 100);
}

// ── Destekleyici mesaj ──────────────────────────────────────
function getSupportMessage(percentile: number): { message: string; color: string } {
  if (percentile >= 75) {
    return { message: 'Harika! Çocuğunuz sınıf ortalamasının üzerinde performans gösteriyor.', color: 'text-emerald-600' };
  }
  if (percentile >= 50) {
    return { message: 'Güzel! Çocuğunuz sınıf ortalaması civarında ilerliyor.', color: 'text-blue-600' };
  }
  if (percentile >= 25) {
    return { message: 'Endişelenmeyin, küçük desteklerle büyük gelişim gösterebilir.', color: 'text-amber-600' };
  }
  return { message: 'Bu alan geliştirilmeye açık. Birlikte çalışarak ilerleme kaydedebilirsiniz.', color: 'text-pink-600' };
}

export default function AnonymousComparison({ childId }: AnonymousComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
      const supabase = createClient();

      // Çocuğun sınıf bilgisini bul
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', childId)
        .limit(1);

      if (!classStudents || classStudents.length === 0) {
        setLoading(false);
        return;
      }

      const classId = classStudents[0].class_id;

      // Sınıftaki tüm öğrencileri al
      const { data: classMembers } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (!classMembers || classMembers.length < 2) {
        setLoading(false);
        return;
      }

      const allStudentIds = classMembers.map((m) => m.student_id);

      // Tüm sınıfın test sonuçlarını getir
      const { data: allResults } = await supabase
        .from('test_results')
        .select('student_id, test_type, scores')
        .in('student_id', allStudentIds)
        .not('completed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (!allResults || allResults.length === 0) {
        setLoading(false);
        return;
      }

      // Her öğrenci ve test tipi için son sonucu al
      const latestByStudentTest = new Map<string, { score: number }>();
      for (const r of allResults) {
        const key = `${r.student_id}__${r.test_type}`;
        if (!latestByStudentTest.has(key)) {
          const score = extractNormalizedScore(r.test_type, r.scores as Record<string, unknown>);
          if (score !== null) {
            latestByStudentTest.set(key, { score });
          }
        }
      }

      // Çocuğun sonuçlarını bul ve sınıf ile karşılaştır
      const testTypes = [...new Set(allResults.map((r) => r.test_type))];
      const comparison: ComparisonData[] = [];

      for (const testType of testTypes) {
        const studentKey = `${childId}__${testType}`;
        const studentData = latestByStudentTest.get(studentKey);
        if (!studentData) continue;

        // Sınıf ortalaması ve tüm skorlar
        const classScores: number[] = [];
        for (const sid of allStudentIds) {
          const k = `${sid}__${testType}`;
          const d = latestByStudentTest.get(k);
          if (d) classScores.push(d.score);
        }

        if (classScores.length < 2) continue;

        const classAvg = Math.round(classScores.reduce((a, b) => a + b, 0) / classScores.length);
        const percentile = calculatePercentile(studentData.score, classScores);

        comparison.push({
          testType,
          testLabel: TEST_LABELS[testType] ?? testType,
          studentScore: Math.round(studentData.score),
          classAverage: classAvg,
          percentile,
        });
      }

      setData(comparison);
      setLoading(false);
      } catch (err) {
        console.error('Veri yuklenemedi:', err);
        setLoading(false);
      }
    }
    load();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  const chartData = data.map((d) => ({
    name: d.testLabel.length > 10 ? d.testLabel.substring(0, 10) + '...' : d.testLabel,
    fullName: d.testLabel,
    'Çocuğunuz': d.studentScore,
    'Sınıf Ortalaması': d.classAverage,
  }));

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-pink-500" />
        <h2 className="font-extrabold text-[#0f2847] text-base">Sınıf Karşılaştırması</h2>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">Anonim veriler</span>
      </div>

      {/* Grafik */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Çocuğunuz" fill="#ec4899" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Sınıf Ortalaması" fill="#d1d5db" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Yüzdelik Dilim Kartları */}
      <div className="px-6 pb-4 space-y-2">
        {data.map((d) => {
          const support = getSupportMessage(d.percentile);
          return (
            <div
              key={d.testType}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0f2847]">{d.testLabel}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-600">
                    %{d.percentile} dilim
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${support.color}`}>{support.message}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold text-[#0f2847]">{d.studentScore}</p>
                <p className="text-[10px] text-gray-400">ort: {d.classAverage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
