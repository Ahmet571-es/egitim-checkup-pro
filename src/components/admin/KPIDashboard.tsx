'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { calculateRiskScore } from '@/lib/services/riskScore';

interface KPIData {
  totalStudents: number;
  completedTests: number;
  avgRiskScore: number;
  topRiskFlag: string;
  weeklyTests: number;
  monthlyTests: number;
  activeStudents7d: number;
  testTrend: Array<{ date: string; count: number }>;
}

export default function KPIDashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('id', userData.user.id)
        .single();

      const schoolId = profile?.school_id;
      const isAdmin = profile?.role === 'admin';

      // Toplam öğrenci
      let studentQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true);
      if (schoolId && !isAdmin) {
        studentQuery = studentQuery.eq('school_id', schoolId);
      }
      const { count: totalStudents } = await studentQuery;

      // Tamamlanan test
      const { count: completedTests } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true });

      // Bu hafta tamamlanan testler
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weeklyTests } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Bu ay tamamlanan testler
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { count: monthlyTests } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Son 7 günde aktif öğrenci
      const { data: activeStudentsData } = await supabase
        .from('test_results')
        .select('student_id')
        .gte('created_at', weekAgo.toISOString());
      const uniqueActiveStudents = new Set(activeStudentsData?.map(r => r.student_id) || []);

      // Test trendi (son 14 gün, günlük)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { data: trendData } = await supabase
        .from('test_results')
        .select('created_at')
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at');

      const trendMap: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trendMap[key] = 0;
      }
      if (trendData) {
        for (const r of trendData) {
          const key = r.created_at.split('T')[0];
          if (trendMap[key] !== undefined) trendMap[key]++;
        }
      }
      const testTrend = Object.entries(trendMap).map(([date, count]) => ({
        date: date.substring(5), // MM-DD
        count,
      }));

      // Risk ortalaması (sample — en son 50 öğrenci)
      let avgRisk = 50;
      const flagCounts: Record<string, number> = {};

      let studentsQuery = supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('is_active', true)
        .limit(50);
      if (schoolId && !isAdmin) {
        studentsQuery = studentsQuery.eq('school_id', schoolId);
      }
      const { data: sampleStudents } = await studentsQuery;

      if (sampleStudents && sampleStudents.length > 0) {
        let totalRisk = 0;
        let riskCount = 0;

        for (const s of sampleStudents) {
          const { data: results } = await supabase
            .from('test_results')
            .select('test_type, scores')
            .eq('student_id', s.id)
            .order('created_at', { ascending: false });

          if (!results || results.length === 0) continue;

          const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
          for (const row of results) {
            if (!latestByType.has(row.test_type)) {
              latestByType.set(row.test_type, {
                test_type: row.test_type,
                scores: row.scores as Record<string, unknown>,
              });
            }
          }

          const risk = calculateRiskScore(Array.from(latestByType.values()));
          totalRisk += risk.overallScore;
          riskCount++;

          for (const flag of risk.flags) {
            flagCounts[flag.message] = (flagCounts[flag.message] || 0) + 1;
          }
        }

        if (riskCount > 0) avgRisk = Math.round(totalRisk / riskCount);
      }

      // En sık risk flag
      let topFlag = 'Veri yetersiz';
      let maxFlagCount = 0;
      for (const [msg, count] of Object.entries(flagCounts)) {
        if (count > maxFlagCount) {
          topFlag = msg;
          maxFlagCount = count;
        }
      }

      setKpi({
        totalStudents: totalStudents || 0,
        completedTests: completedTests || 0,
        avgRiskScore: avgRisk,
        topRiskFlag: topFlag,
        weeklyTests: weeklyTests || 0,
        monthlyTests: monthlyTests || 0,
        activeStudents7d: uniqueActiveStudents.size,
        testTrend,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!kpi) return null;

  const riskColor = kpi.avgRiskScore < 30 ? 'text-red-700' : kpi.avgRiskScore <= 60 ? 'text-amber-700' : 'text-emerald-700';
  const riskBg = kpi.avgRiskScore < 30 ? 'bg-red-50 border-red-200' : kpi.avgRiskScore <= 60 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0f2847] mb-1">Anahtar Performans Göstergeleri</h2>
        <p className="text-gray-500 text-xs mb-4">Okul geneli özet istatistikler</p>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Toplam Öğrenci</p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{kpi.totalStudents}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tamamlanan Test</p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{kpi.completedTests}</p>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${riskBg}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ort. Risk Skoru</p>
          <p className={`text-2xl font-extrabold mt-1 ${riskColor}`}>{kpi.avgRiskScore}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Aktif (7 gün)</p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{kpi.activeStudents7d}</p>
        </div>
      </div>

      {/* İkinci sıra: haftalık, aylık, risk flag */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bu Hafta Test</p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{kpi.weeklyTests}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bu Ay Test</p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{kpi.monthlyTests}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">En Sık Risk</p>
          <p className="text-xs font-semibold text-gray-700 mt-2 line-clamp-2">{kpi.topRiskFlag}</p>
        </div>
      </div>

      {/* Mini trend grafik */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Son 14 Gün Test Trendi</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={kpi.testTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} width={30} />
            <Tooltip formatter={(value: number) => [`${value} test`, '']} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3, fill: '#7c3aed' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
