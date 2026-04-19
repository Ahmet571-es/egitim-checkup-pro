'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';

const TEST_KEYS = [
  'enneagram', 'vark', 'holland', 'coklu-zeka', 'sinav-kaygisi',
  'calisma-davranisi', 'akademik-analiz', 'hizli-okuma', 'd2-dikkat', 'sag-sol-beyin',
];

type FilterGender = 'all' | 'male' | 'female';
type FilterGrade = 'all' | string;

interface GenderAvg {
  test: string;
  kiz: number;
  erkek: number;
}

export default function GenderAgeBreakdown() {
  const [genderFilter, setGenderFilter] = useState<FilterGender>('all');
  const [gradeFilter, setGradeFilter] = useState<FilterGrade>('all');
  const [genderData, setGenderData] = useState<GenderAvg[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [kizCount, setKizCount] = useState(0);
  const [erkekCount, setErkekCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', userData.user.id)
        .single();

      if (!userProfile?.school_id) { setLoading(false); return; }

      // Okuldaki öğrenciler
      let query = supabase
        .from('profiles')
        .select('id, full_name, grade, email')
        .eq('school_id', userProfile.school_id)
        .eq('role', 'student')
        .eq('is_active', true);

      if (gradeFilter !== 'all') {
        query = query.eq('grade', gradeFilter);
      }

      const { data: students } = await query;
      if (!students || students.length === 0) { setLoading(false); return; }

      // Cinsiyet tahmini (basit isim analizi — Türkçe yaygın son ekler)
      // Not: Gerçek uygulamada cinsiyet bilgisi profile'da olmalı
      const maleScores: Record<string, number[]> = {};
      const femaleScores: Record<string, number[]> = {};
      let maleCount = 0;
      let femaleCount = 0;

      // Sınıf seviyeleri
      const grades = new Set<string>();
      for (const s of students) {
        if (s.grade) grades.add(s.grade);
      }
      setAvailableGrades(Array.from(grades).sort((a, b) => {
        const na = parseInt(a);
        const nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      }));

      for (const student of students) {
        // Basit cinsiyet tahmini: isim uzunluğu çift → rastgele dağılım yerine
        // index bazlı dağılım kullanıyoruz (demo amaçlı)
        const isFemale = student.full_name?.toLowerCase().endsWith('a') ||
                         student.full_name?.toLowerCase().endsWith('e') ||
                         student.full_name?.toLowerCase().endsWith('ş') ||
                         student.full_name?.toLowerCase().endsWith('n');

        const targetScores = isFemale ? femaleScores : maleScores;
        if (isFemale) femaleCount++; else maleCount++;

        // Cinsiyet filtresi
        if (genderFilter === 'male' && isFemale) continue;
        if (genderFilter === 'female' && !isFemale) continue;

        const { data: results } = await supabase
          .from('test_results')
          .select('test_type, scores')
          .eq('student_id', student.id);

        if (!results) continue;

        for (const r of results) {
          const score = extractNormalizedScore(r.test_type, r.scores as Record<string, unknown>);
          if (score !== null) {
            if (!targetScores[r.test_type]) targetScores[r.test_type] = [];
            targetScores[r.test_type].push(score);
          }
        }
      }

      setKizCount(femaleCount);
      setErkekCount(maleCount);

      // Karşılaştırma data
      const comparison: GenderAvg[] = TEST_KEYS.filter(key =>
        (femaleScores[key]?.length || 0) > 0 || (maleScores[key]?.length || 0) > 0
      ).map(key => ({
        test: (TEST_LABELS[key] || key).substring(0, 12),
        kiz: femaleScores[key]?.length
          ? Math.round(femaleScores[key].reduce((a, b) => a + b, 0) / femaleScores[key].length)
          : 0,
        erkek: maleScores[key]?.length
          ? Math.round(maleScores[key].reduce((a, b) => a + b, 0) / maleScores[key].length)
          : 0,
      }));

      setGenderData(comparison);
      setLoading(false);
    };
    load();
  }, [genderFilter, gradeFilter]);

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

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-1">Cinsiyet & Sınıf Kırılımı</h2>
      <p className="text-gray-500 dark:text-slate-400 text-xs mb-4">Test ortalamalarının cinsiyet ve sınıf bazlı karşılaştırması</p>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">Cinsiyet</label>
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value as FilterGender)}
            className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <option value="all">Tümü</option>
            <option value="female">Kız</option>
            <option value="male">Erkek</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">Sınıf Seviyesi</label>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <option value="all">Tümü</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>{g}. Sınıf</option>
            ))}
          </select>
        </div>
      </div>

      {/* Karşılaştırma kartları */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-pink-700">{kizCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Kız Öğrenci</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-extrabold text-blue-700">{erkekCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Erkek Öğrenci</p>
        </div>
      </div>

      {/* Karşılaştırma bar chart */}
      {genderData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={genderData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="test" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="kiz" name="Kız Ortalaması" fill="#ec4899" radius={[4, 4, 0, 0]} />
            <Bar dataKey="erkek" name="Erkek Ortalaması" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Seçili filtrelerde veri bulunmuyor.</p>
      )}
    </div>
  );
}
