'use client';

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore } from '@/lib/services/correlation';
import { calculateRiskScore, getRiskLevel } from '@/lib/services/riskScore';

interface RiskStats {
  kritik: number;
  izlenmeli: number;
  saglikli: number;
  total: number;
}

interface ClassRiskBreakdown {
  className: string;
  kritik: number;
  izlenmeli: number;
  saglikli: number;
}

const PIE_COLORS = ['#dc2626', '#f59e0b', '#059669'];

export default function RiskDistribution() {
  const [stats, setStats] = useState<RiskStats>({ kritik: 0, izlenmeli: 0, saglikli: 0, total: 0 });
  const [classBreakdown, setClassBreakdown] = useState<ClassRiskBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.school_id) { setLoading(false); return; }

      // Okuldaki sınıflar
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name');

      if (!classes || classes.length === 0) { setLoading(false); return; }

      let totalKritik = 0;
      let totalIzlenmeli = 0;
      let totalSaglikli = 0;
      const breakdown: ClassRiskBreakdown[] = [];

      for (const cls of classes) {
        const { data: students } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', cls.id);

        if (!students || students.length === 0) continue;

        let clsKritik = 0;
        let clsIzlenmeli = 0;
        let clsSaglikli = 0;

        for (const s of students) {
          const { data: results } = await supabase
            .from('test_results')
            .select('test_type, scores')
            .eq('student_id', s.student_id)
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
          if (risk.level === 'kritik') { clsKritik++; totalKritik++; }
          else if (risk.level === 'izlenmeli') { clsIzlenmeli++; totalIzlenmeli++; }
          else { clsSaglikli++; totalSaglikli++; }
        }

        if (clsKritik + clsIzlenmeli + clsSaglikli > 0) {
          breakdown.push({
            className: cls.name,
            kritik: clsKritik,
            izlenmeli: clsIzlenmeli,
            saglikli: clsSaglikli,
          });
        }
      }

      setStats({
        kritik: totalKritik,
        izlenmeli: totalIzlenmeli,
        saglikli: totalSaglikli,
        total: totalKritik + totalIzlenmeli + totalSaglikli,
      });
      // Kritik sayısına göre sırala
      breakdown.sort((a, b) => b.kritik - a.kritik);
      setClassBreakdown(breakdown);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-100 dark:bg-slate-700/60 rounded" />
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Kritik', value: stats.kritik, color: '#dc2626' },
    { name: 'İzlenmeli', value: stats.izlenmeli, color: '#f59e0b' },
    { name: 'Sağlıklı', value: stats.saglikli, color: '#059669' },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-1">Risk Dağılımı</h2>
      <p className="text-gray-500 dark:text-slate-400 text-xs mb-4">Okul genelinde öğrenci risk seviyeleri</p>

      {stats.total === 0 ? (
        <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Henüz yeterli veri bulunmuyor.</p>
      ) : (
        <>
          {/* Özet kartlar */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-red-700">{stats.kritik}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Kritik</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-700">{stats.izlenmeli}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">İzlenmeli</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">{stats.saglikli}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Sağlıklı</p>
            </div>
          </div>

          {/* Pasta grafik */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} öğrenci`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sınıf bazlı kırılım */}
          {classBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-2">Sınıf Bazlı Risk Kırılımı</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, classBreakdown.length * 35)}>
                <BarChart data={classBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="className" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kritik" name="Kritik" fill="#dc2626" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="izlenmeli" name="İzlenmeli" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="saglikli" name="Sağlıklı" fill="#059669" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
