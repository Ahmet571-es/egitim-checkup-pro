'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS,
  type CoachingTask, type CoachingStreak,
} from '@/lib/services/coaching';
import { CheckCircle2, Circle, Flame, Trophy, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export default function CoachingDashboard() {
  const [tasks, setTasks] = useState<CoachingTask[]>([]);
  const [streak, setStreak] = useState<CoachingStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Hafta numarası
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    const { data: taskData } = await supabase
      .from('coaching_tasks')
      .select('*')
      .eq('student_id', user.id)
      .eq('week_number', weekNumber)
      .order('created_at');

    const { data: streakData } = await supabase
      .from('coaching_streaks')
      .select('*')
      .eq('student_id', user.id)
      .maybeSingle();

    setTasks(taskData || []);
    setStreak(streakData);
    setLoading(false);
  }

  async function generateTasks() {
    setGenerating(true);
    try {
      const res = await fetch('/api/coaching/generate-tasks', { method: 'POST' });
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      } else {
        alert(data.error || 'Görevler oluşturulamadı');
      }
    } catch {
      alert('Bağlantı hatası');
    }
    setGenerating(false);
  }

  async function toggleComplete(taskId: string) {
    setCompletingId(taskId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.is_completed) return;

    // Tamamla
    await supabase
      .from('coaching_tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);

    // Streak güncelle
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('coaching_streaks')
      .select('*')
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = existing.current_streak;
      if (existing.last_completed_date === yesterday) newStreak += 1;
      else if (existing.last_completed_date !== today) newStreak = 1;

      await supabase.from('coaching_streaks').update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existing.longest_streak),
        last_completed_date: today,
        total_completed: existing.total_completed + 1,
      }).eq('student_id', user.id);

      setStreak({ ...existing, current_streak: newStreak, longest_streak: Math.max(newStreak, existing.longest_streak), total_completed: existing.total_completed + 1 });
    } else {
      await supabase.from('coaching_streaks').insert({
        student_id: user.id, current_streak: 1, longest_streak: 1, last_completed_date: today, total_completed: 1,
      });
      setStreak({ student_id: user.id, current_streak: 1, longest_streak: 1, last_completed_date: today, total_completed: 1 });
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t));
    setCompletingId(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);

    // Gamification: görev tamamlama XP'si
    try {
      const { data: xpData } = await supabase.from('student_xp').select('*').eq('student_id', user.id).maybeSingle();
      const oldXP = xpData?.total_xp || 0;
      const newXP = oldXP + 20; // Görev tamamlama +20 XP
      const tasksCount = (xpData?.tasks_completed || 0) + 1;
      const levels = [
        { name: 'Çaylak', min: 0 }, { name: 'Kaşif', min: 100 },
        { name: 'Uzman', min: 300 }, { name: 'Üstad', min: 600 }, { name: 'Efsane', min: 1000 }
      ];
      const newLevel = [...levels].reverse().find(l => newXP >= l.min)?.name || 'Çaylak';

      if (xpData) {
        await supabase.from('student_xp').update({ total_xp: newXP, current_level: newLevel, tasks_completed: tasksCount }).eq('student_id', user.id);
      } else {
        await supabase.from('student_xp').insert({ student_id: user.id, total_xp: newXP, current_level: newLevel, tasks_completed: tasksCount });
      }
    } catch (xpErr) {
      console.warn('XP güncelleme hatası:', xpErr);
    }
  }

  const completed = tasks.filter(t => t.is_completed).length;
  const total = tasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Konfeti animasyonu */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Streak & İlerleme Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Seri</span>
          </div>
          <p className="text-3xl font-extrabold">{streak?.current_streak || 0} gün</p>
          <p className="text-xs opacity-75 mt-1">En uzun: {streak?.longest_streak || 0} gün</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Bu Hafta</span>
          </div>
          <p className="text-3xl font-extrabold">{completed}/{total}</p>
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Toplam</span>
          </div>
          <p className="text-3xl font-extrabold">{streak?.total_completed || 0}</p>
          <p className="text-xs opacity-75 mt-1">tamamlanan görev</p>
        </div>
      </div>

      {/* Görevler */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#0f2847]">Bu Haftanın Görevleri</h2>
          <button
            onClick={generateTasks}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {tasks.length === 0 ? 'Görev Oluştur' : 'Yenile'}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-violet-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Henüz bu hafta için görevin yok.</p>
            <p className="text-gray-400 text-xs mt-1">Yukarıdaki butona tıklayarak AI koçundan görev iste!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const cat = task.category as keyof typeof CATEGORY_LABELS;
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    task.is_completed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-violet-300 hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => !task.is_completed && toggleComplete(task.id)}
                    disabled={task.is_completed || completingId === task.id}
                    className="mt-0.5 shrink-0"
                  >
                    {completingId === task.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                    ) : task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 hover:text-violet-500 transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.task_text}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[cat] || 'bg-gray-50 text-gray-600'}`}>
                        {CATEGORY_ICONS[cat] || '📋'} {CATEGORY_LABELS[cat] || task.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {'⭐'.repeat(task.difficulty)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
