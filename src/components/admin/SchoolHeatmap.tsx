'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';

const TEST_KEYS = [
  'enneagram', 'vark', 'holland', 'coklu-zeka', 'sinav-kaygisi',
  'calisma-davranisi', 'akademik-analiz', 'hizli-okuma', 'd2-dikkat', 'sag-sol-beyin',
];

interface HeatmapCell {
  classId: string;
  className: string;
  testType: string;
  average: number;
  studentCount: number;
}

interface ClassRow {
  classId: string;
  className: string;
  cells: Record<string, HeatmapCell>;
}

function getHeatColor(score: number): string {
  if (score >= 80) return 'bg-emerald-600 text-white';
  if (score >= 65) return 'bg-emerald-400 text-white';
  if (score >= 50) return 'bg-yellow-400 text-gray-900';
  if (score >= 35) return 'bg-orange-400 text-white';
  if (score >= 20) return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

function getHeatBg(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 65) return '#34d399';
  if (score >= 50) return '#facc15';
  if (score >= 35) return '#fb923c';
  if (score >= 20) return '#f87171';
  return '#dc2626';
}

export default function SchoolHeatmap() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ cell: HeatmapCell; x: number; y: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Kullanıcının okul bilgisini al
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.school_id) { setLoading(false); return; }

      // Okuldaki tüm sınıfları çek
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name');

      if (!classes || classes.length === 0) { setLoading(false); return; }

      const classRows: ClassRow[] = [];

      for (const cls of classes) {
        // Sınıf öğrencileri
        const { data: students } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', cls.id);

        if (!students || students.length === 0) continue;

        const studentIds = students.map(s => s.student_id);

        // Test sonuçları
        const { data: results } = await supabase
          .from('test_results')
          .select('student_id, test_type, scores')
          .in('student_id', studentIds);

        if (!results) continue;

        const cells: Record<string, HeatmapCell> = {};

        for (const testKey of TEST_KEYS) {
          const testResults = results.filter(r => r.test_type === testKey);
          const scores: number[] = [];

          for (const r of testResults) {
            const s = extractNormalizedScore(r.test_type, r.scores as Record<string, unknown>);
            if (s !== null) scores.push(s);
          }

          if (scores.length > 0) {
            cells[testKey] = {
              classId: cls.id,
              className: cls.name,
              testType: testKey,
              average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              studentCount: scores.length,
            };
          }
        }

        if (Object.keys(cells).length > 0) {
          classRows.push({ classId: cls.id, className: cls.name, cells });
        }
      }

      setRows(classRows);
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

  if (rows.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-2">Okul Geneli Isı Haritası</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Henüz yeterli veri bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm relative">
      <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-1">Okul Geneli Isı Haritası</h2>
      <p className="text-gray-500 dark:text-slate-400 text-xs mb-4">Sınıflar × Testler matris görünümü</p>

      {/* Renk lejandı */}
      <div className="flex items-center gap-1 mb-4 text-[10px] font-medium text-gray-500 dark:text-slate-400">
        <span>Düşük</span>
        <div className="w-5 h-3 rounded bg-red-600" />
        <div className="w-5 h-3 rounded bg-red-400" />
        <div className="w-5 h-3 rounded bg-orange-400" />
        <div className="w-5 h-3 rounded bg-yellow-400" />
        <div className="w-5 h-3 rounded bg-emerald-400" />
        <div className="w-5 h-3 rounded bg-emerald-600" />
        <span>Yüksek</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-slate-400 py-2 px-2 min-w-[100px]">Sınıf</th>
              {TEST_KEYS.map(key => (
                <th key={key} className="text-center text-[9px] font-semibold text-gray-500 dark:text-slate-400 py-2 px-1 min-w-[60px]">
                  {(TEST_LABELS[key] || key).substring(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.classId} className="border-t border-gray-100 dark:border-slate-700/60">
                <td className="text-[12px] font-semibold text-gray-700 dark:text-slate-300 py-1.5 px-2">{row.className}</td>
                {TEST_KEYS.map(key => {
                  const cell = row.cells[key];
                  return (
                    <td key={key} className="py-1.5 px-1 text-center">
                      {cell ? (
                        <div
                          className={`inline-block w-10 h-8 rounded-md flex items-center justify-center text-[11px] font-bold cursor-pointer transition-transform hover:scale-110 ${getHeatColor(cell.average)}`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({ cell, x: rect.left, y: rect.top - 80 });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {cell.average}
                        </div>
                      ) : (
                        <div className="inline-block w-10 h-8 rounded-md bg-gray-100 dark:bg-slate-700/60 flex items-center justify-center text-[10px] text-gray-300">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-gray-900 text-white rounded-xl px-4 py-3 text-xs shadow-xl pointer-events-none"
             style={{ left: tooltip.x, top: tooltip.y }}>
          <p className="font-bold mb-1">{tooltip.cell.className}</p>
          <p className="text-gray-300">{TEST_LABELS[tooltip.cell.testType] || tooltip.cell.testType}</p>
          <p className="text-lg font-extrabold mt-1">{tooltip.cell.average}<span className="text-gray-400 dark:text-slate-500 text-[10px] ml-1">/ 100</span></p>
          <p className="text-gray-400 dark:text-slate-500 text-[10px] mt-1">{tooltip.cell.studentCount} öğrenci verisi</p>
        </div>
      )}
    </div>
  );
}
