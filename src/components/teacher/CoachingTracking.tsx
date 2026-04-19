'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Flame, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface StudentCoachingInfo {
  student_id: string;
  student_name: string;
  tasks_this_week: number;
  completed_this_week: number;
  current_streak: number;
  last_activity: string | null;
}

export default function CoachingTracking() {
  const [students, setStudents] = useState<StudentCoachingInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Öğretmenin sınıflarını getir
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    const classIds = (classes || []).map(c => c.id);
    if (classIds.length === 0) {
      setLoading(false);
      return;
    }

    // Sınıftaki öğrenciler
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
      .in('class_id', classIds);

    if (!classStudents || classStudents.length === 0) {
      setLoading(false);
      return;
    }

    const studentIds = classStudents.map(cs => cs.student_id);

    // Hafta numarası
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    // Görevler
    const { data: tasks } = await supabase
      .from('coaching_tasks')
      .select('student_id, is_completed')
      .in('student_id', studentIds)
      .eq('week_number', weekNumber);

    // Streak'ler
    const { data: streaks } = await supabase
      .from('coaching_streaks')
      .select('student_id, current_streak, last_completed_date')
      .in('student_id', studentIds);

    const taskMap = new Map<string, { total: number; completed: number }>();
    for (const t of (tasks || [])) {
      const e = taskMap.get(t.student_id) || { total: 0, completed: 0 };
      e.total += 1;
      if (t.is_completed) e.completed += 1;
      taskMap.set(t.student_id, e);
    }

    const streakMap = new Map<string, { streak: number; lastDate: string | null }>();
    for (const s of (streaks || [])) {
      streakMap.set(s.student_id, { streak: s.current_streak, lastDate: s.last_completed_date });
    }

    const result: StudentCoachingInfo[] = classStudents.map(cs => {
      const ti = taskMap.get(cs.student_id) || { total: 0, completed: 0 };
      const si = streakMap.get(cs.student_id) || { streak: 0, lastDate: null };
      const sd = cs.student as unknown as { full_name: string } | null;
      return {
        student_id: cs.student_id,
        student_name: sd?.full_name || 'Bilinmeyen',
        tasks_this_week: ti.total,
        completed_this_week: ti.completed,
        current_streak: si.streak,
        last_activity: si.lastDate,
      };
    });

    // Tamamlama oranına göre sırala (düşük olan üstte)
    result.sort((a, b) => {
      const rateA = a.tasks_this_week > 0 ? a.completed_this_week / a.tasks_this_week : -1;
      const rateB = b.tasks_this_week > 0 ? b.completed_this_week / b.tasks_this_week : -1;
      return rateA - rateB;
    });

    setStudents(result);
    setLoading(false);
    } catch (err) {
      console.error('Koçluk verisi yüklenemedi:', err);
      setLoading(false);
    }
  }

  function getStatusColor(student: StudentCoachingInfo): string {
    if (student.tasks_this_week === 0) return 'text-gray-400 dark:text-slate-500';
    const rate = student.completed_this_week / student.tasks_this_week;
    if (rate === 0) return 'text-red-500';
    if (rate < 1) return 'text-amber-500';
    return 'text-emerald-500';
  }

  function getStatusIcon(student: StudentCoachingInfo) {
    if (student.tasks_this_week === 0) return <Clock className="w-4 h-4 text-gray-300" />;
    const rate = student.completed_this_week / student.tasks_this_week;
    if (rate === 0) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (rate < 1) return <Clock className="w-4 h-4 text-amber-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
        Henüz koçluk verisi yok.
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm p-6">
      <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100 mb-4">Koçluk Takip</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/60">
              <th className="text-left py-3 px-2">Öğrenci</th>
              <th className="text-center py-3 px-2">Bu Hafta</th>
              <th className="text-center py-3 px-2">Seri</th>
              <th className="text-center py-3 px-2">Son Aktivite</th>
              <th className="text-center py-3 px-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.student_id} className="border-b border-gray-50 hover:bg-gray-50 dark:bg-slate-800/60/50">
                <td className="py-3 px-2 font-medium text-gray-700 dark:text-slate-300">{s.student_name}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`font-bold ${getStatusColor(s)}`}>
                    {s.completed_this_week}/{s.tasks_this_week}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  {s.current_streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                      <Flame className="w-3.5 h-3.5" /> {s.current_streak}
                    </span>
                  )}
                  {s.current_streak === 0 && <span className="text-gray-300">—</span>}
                </td>
                <td className="py-3 px-2 text-center text-xs text-gray-400 dark:text-slate-500">
                  {s.last_activity || '—'}
                </td>
                <td className="py-3 px-2 text-center">
                  {getStatusIcon(s)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
