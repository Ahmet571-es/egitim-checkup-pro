/**
 * Faz 5: AI Koçluk Servisi
 * Kişiselleştirilmiş görev oluşturma, streak yönetimi
 */

import { createClient } from '@/lib/supabase/client';

export type TaskCategory = 'nefes_gevşeme' | 'çalışma_tekniği' | 'dikkat_egzersizi' | 'motivasyon' | 'sosyal_beceri';

export interface CoachingTask {
  id: string;
  student_id: string;
  task_text: string;
  category: TaskCategory;
  source_test: string | null;
  difficulty: number;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  week_number: number;
  created_at: string;
}

export interface CoachingStreak {
  student_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completed: number;
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  'nefes_gevşeme': 'Nefes & Gevşeme',
  'çalışma_tekniği': 'Çalışma Tekniği',
  'dikkat_egzersizi': 'Dikkat Egzersizi',
  'motivasyon': 'Motivasyon',
  'sosyal_beceri': 'Sosyal Beceri',
};

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  'nefes_gevşeme': '🧘',
  'çalışma_tekniği': '📚',
  'dikkat_egzersizi': '🎯',
  'motivasyon': '💪',
  'sosyal_beceri': '🤝',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  'nefes_gevşeme': 'bg-blue-50 text-blue-700 border-blue-200',
  'çalışma_tekniği': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'dikkat_egzersizi': 'bg-amber-50 text-amber-700 border-amber-200',
  'motivasyon': 'bg-violet-50 text-violet-700 border-violet-200',
  'sosyal_beceri': 'bg-pink-50 text-pink-700 border-pink-200',
};

/** Bu haftanın görevlerini getir */
export async function getWeeklyTasks(studentId: string): Promise<CoachingTask[]> {
  const supabase = createClient();
  const currentWeek = getISOWeek(new Date());

  const { data, error } = await supabase
    .from('coaching_tasks')
    .select('*')
    .eq('student_id', studentId)
    .eq('week_number', currentWeek)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Görevler alınamadı:', error);
    return [];
  }
  return data || [];
}

/** Streak bilgisini getir */
export async function getStreak(studentId: string): Promise<CoachingStreak | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('coaching_streaks')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Görevi tamamla ve streak güncelle */
export async function completeTask(taskId: string, studentId: string): Promise<boolean> {
  const supabase = createClient();

  // Görevi tamamla
  const { error: taskError } = await supabase
    .from('coaching_tasks')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('student_id', studentId);

  if (taskError) {
    console.error('Görev tamamlanamadı:', taskError);
    return false;
  }

  // Streak güncelle
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('coaching_streaks')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) {
    const lastDate = existing.last_completed_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = existing.current_streak;

    if (lastDate === yesterday) {
      newStreak += 1;
    } else if (lastDate !== today) {
      newStreak = 1;
    }

    await supabase
      .from('coaching_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existing.longest_streak),
        last_completed_date: today,
        total_completed: existing.total_completed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId);
  } else {
    await supabase
      .from('coaching_streaks')
      .insert({
        student_id: studentId,
        current_streak: 1,
        longest_streak: 1,
        last_completed_date: today,
        total_completed: 1,
      });
  }

  return true;
}

/** Günlük AI chat kullanımını kontrol et */
export async function checkChatLimit(studentId: string): Promise<{ allowed: boolean; remaining: number }> {
  const DAILY_LIMIT = 5;
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('ai_chat_usage')
    .select('message_count')
    .eq('student_id', studentId)
    .eq('usage_date', today)
    .maybeSingle();

  const used = data?.message_count || 0;
  return { allowed: used < DAILY_LIMIT, remaining: DAILY_LIMIT - used };
}

/** AI chat kullanımını artır */
export async function incrementChatUsage(studentId: string): Promise<void> {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('ai_chat_usage')
    .select('id, message_count')
    .eq('student_id', studentId)
    .eq('usage_date', today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('ai_chat_usage')
      .update({ message_count: existing.message_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('ai_chat_usage')
      .insert({ student_id: studentId, usage_date: today, message_count: 1 });
  }
}

/** Sınıftaki öğrencilerin koçluk istatistiklerini getir */
export async function getClassCoachingStats(classIds: string[]): Promise<Array<{
  student_id: string;
  student_name: string;
  tasks_this_week: number;
  completed_this_week: number;
  current_streak: number;
  last_activity: string | null;
}>> {
  if (classIds.length === 0) return [];

  const supabase = createClient();
  const currentWeek = getISOWeek(new Date());

  // Sınıftaki öğrencileri getir
  const { data: classStudents } = await supabase
    .from('class_students')
    .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
    .in('class_id', classIds);

  if (!classStudents || classStudents.length === 0) return [];

  const studentIds = classStudents.map(cs => cs.student_id);

  // Görevleri getir
  const { data: tasks } = await supabase
    .from('coaching_tasks')
    .select('student_id, is_completed')
    .in('student_id', studentIds)
    .eq('week_number', currentWeek);

  // Streak'leri getir
  const { data: streaks } = await supabase
    .from('coaching_streaks')
    .select('student_id, current_streak, last_completed_date')
    .in('student_id', studentIds);

  const taskMap = new Map<string, { total: number; completed: number }>();
  for (const t of (tasks || [])) {
    const entry = taskMap.get(t.student_id) || { total: 0, completed: 0 };
    entry.total += 1;
    if (t.is_completed) entry.completed += 1;
    taskMap.set(t.student_id, entry);
  }

  const streakMap = new Map<string, { streak: number; lastDate: string | null }>();
  for (const s of (streaks || [])) {
    streakMap.set(s.student_id, { streak: s.current_streak, lastDate: s.last_completed_date });
  }

  return classStudents.map(cs => {
    const taskInfo = taskMap.get(cs.student_id) || { total: 0, completed: 0 };
    const streakInfo = streakMap.get(cs.student_id) || { streak: 0, lastDate: null };
    const studentData = cs.student as unknown as { full_name: string } | null;
    return {
      student_id: cs.student_id,
      student_name: studentData?.full_name || 'Bilinmeyen',
      tasks_this_week: taskInfo.total,
      completed_this_week: taskInfo.completed,
      current_streak: streakInfo.streak,
      last_activity: streakInfo.lastDate,
    };
  });
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
