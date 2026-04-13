'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';

interface ClassOption {
  id: string;
  name: string;
}

interface ClassAverage {
  classId: string;
  className: string;
  averages: Record<string, number>;
  studentCount: number;
}

const COLORS = [
  '#7c3aed', '#059669', '#d97706', '#dc2626', '#2563eb',
  '#db2777', '#0891b2', '#65a30d', '#9333ea', '#ea580c',
];

const TEST_KEYS = [
  'enneagram', 'vark', 'holland', 'coklu-zeka', 'sinav-kaygisi',
  'calisma-davranisi', 'akademik-analiz', 'hizli-okuma', 'd2-dikkat', 'sag-sol-beyin',
];

export default function ClassComparison() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [classAverages, setClassAverages] = useState<ClassAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [strongest, setStrongest] = useState<{ className: string; test: string; score: number } | null>(null);
  const [weakest, setWeakest] = useState<{ className: string; test: string; score: number } | null>(null);

  // Sınıfları yükle
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase.auth.getUser();
      if (!profile?.user) return;

      const { data: teacherClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', profile.user.id)
        .order('name');

      if (teacherClasses && teacherClasses.length > 0) {
        setClasses(teacherClasses);
        // İlk 2 sınıfı otomatik seç
        setSelectedIds(teacherClasses.slice(0, Math.min(2, teacherClasses.length)).map(c => c.id));
      }
      setLoading(false);
    };
    load();
  }, []);

  // Ortalama hesapla
  const fetchAverages = useCallback(async () => {
    if (selectedIds.length === 0) {
      setClassAverages([]);
      return;
    }

    const supabase = createClient();
    const averages: ClassAverage[] = [];

    for (const classId of selectedIds) {
      const cls = classes.find(c => c.id === classId);
      if (!cls) continue;

      // Sınıf öğrencilerini çek
      const { data: students } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      if (!students || students.length === 0) continue;

      const studentIds = students.map(s => s.student_id);

      // Tüm test sonuçlarını çek
      const { data: results } = await supabase
        .from('test_results')
        .select('student_id, test_type, scores')
        .in('student_id', studentIds);

      if (!results) continue;

      // Her test tipi için ortalama
      const testScores: Record<string, number[]> = {};
      for (const r of results) {
        const score = extractNormalizedScore(r.test_type, r.scores as Record<string, unknown>);
        if (score !== null) {
          if (!testScores[r.test_type]) testScores[r.test_type] = [];
          testScores[r.test_type].push(score);
        }
      }

      const avg: Record<string, number> = {};
      for (const [testType, scores] of Object.entries(testScores)) {
        avg[testType] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }

      averages.push({
        classId,
        className: cls.name,
        averages: avg,
        studentCount: studentIds.length,
      });
    }

    setClassAverages(averages);

    // En güçlü ve en zayıf alan tespiti
    let best: { className: string; test: string; score: number } | null = null;
    let worst: { className: string; test: string; score: number } | null = null;

    for (const ca of averages) {
      for (const [test, score] of Object.entries(ca.averages)) {
        if (!best || score > best.score) {
          best = { className: ca.className, test, score };
        }
        if (!worst || score < worst.score) {
          worst = { className: ca.className, test, score };
        }
      }
    }

    setStrongest(best);
    setWeakest(worst);
  }, [selectedIds, classes]);

  useEffect(() => {
    fetchAverages();
  }, [fetchAverages]);

  const toggleClass = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Radar data
  const radarData = TEST_KEYS.map(key => {
    const entry: Record<string, string | number> = {
      test: TEST_LABELS[key] || key,
    };
    for (const ca of classAverages) {
      entry[ca.className] = ca.averages[key] || 0;
    }
    return entry;
  });

  // Bar chart data
  const barData = TEST_KEYS.filter(key =>
    classAverages.some(ca => ca.averages[key] !== undefined)
  ).map(key => {
    const entry: Record<string, string | number> = {
      test: (TEST_LABELS[key] || key).substring(0, 12),
    };
    for (const ca of classAverages) {
      entry[ca.className] = ca.averages[key] || 0;
    }
    return entry;
  });

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f2847] mb-2">Sınıf Karşılaştırma</h2>
        <p className="text-gray-500 text-sm">Henüz sınıfınız bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#0f2847] mb-1">Sınıf Karşılaştırma</h2>
      <p className="text-gray-500 text-xs mb-4">Sınıflarınızın test ortalamaları karşılaştırması</p>

      {/* Sınıf seçim dropdown (çoklu) */}
      <div className="flex flex-wrap gap-2 mb-5">
        {classes.map((cls, idx) => (
          <button
            key={cls.id}
            onClick={() => toggleClass(cls.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedIds.includes(cls.id)
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={
              selectedIds.includes(cls.id)
                ? { backgroundColor: COLORS[idx % COLORS.length] }
                : undefined
            }
          >
            {cls.name}
          </button>
        ))}
      </div>

      {classAverages.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Seçili sınıflarda henüz test verisi yok.</p>
      ) : (
        <>
          {/* En güçlü / en zayıf alan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {strongest && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">En Güçlü Alan</p>
                <p className="text-sm font-bold text-emerald-800">
                  {strongest.className} — {TEST_LABELS[strongest.test] || strongest.test}
                </p>
                <p className="text-lg font-extrabold text-emerald-700">{strongest.score}</p>
              </div>
            )}
            {weakest && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1">En Zayıf Alan</p>
                <p className="text-sm font-bold text-red-800">
                  {weakest.className} — {TEST_LABELS[weakest.test] || weakest.test}
                </p>
                <p className="text-lg font-extrabold text-red-700">{weakest.score}</p>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Radar Karşılaştırma</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="test" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {classAverages.map((ca, idx) => (
                  <Radar
                    key={ca.classId}
                    name={ca.className}
                    dataKey={ca.className}
                    stroke={COLORS[classes.findIndex(c => c.id === ca.classId) % COLORS.length]}
                    fill={COLORS[classes.findIndex(c => c.id === ca.classId) % COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Test Bazlı Karşılaştırma</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="test" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {classAverages.map((ca, idx) => (
                  <Bar
                    key={ca.classId}
                    dataKey={ca.className}
                    fill={COLORS[classes.findIndex(c => c.id === ca.classId) % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
