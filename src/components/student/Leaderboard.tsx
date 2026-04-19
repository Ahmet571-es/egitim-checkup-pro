'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo, type LeaderboardEntry } from '@/lib/services/gamification';
import { Loader2, Trophy, Medal, Crown } from 'lucide-react';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myId, setMyId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);

    // Sınıf arkadaşları
    const { data: myClasses } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', user.id);

    if (!myClasses || myClasses.length === 0) {
      setLoading(false);
      return;
    }

    const classIds = myClasses.map(c => c.class_id);
    const { data: classmates } = await supabase
      .from('class_students')
      .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
      .in('class_id', classIds);

    if (!classmates) { setLoading(false); return; }

    const studentIds = [...new Set(classmates.map(c => c.student_id))];

    const { data: xpData } = await supabase
      .from('student_xp')
      .select('student_id, total_xp, current_level')
      .in('student_id', studentIds)
      .order('total_xp', { ascending: false });

    const { data: badgeCounts } = await supabase
      .from('student_badges')
      .select('student_id')
      .in('student_id', studentIds);

    const badgeMap = new Map<string, number>();
    for (const b of (badgeCounts || [])) {
      badgeMap.set(b.student_id, (badgeMap.get(b.student_id) || 0) + 1);
    }

    const nameMap = new Map<string, string>();
    for (const c of classmates) {
      const sd = c.student as unknown as { full_name: string } | null;
      if (sd) nameMap.set(c.student_id, sd.full_name);
    }

    const result = (xpData || []).map(x => ({
      student_id: x.student_id,
      student_name: nameMap.get(x.student_id) || 'Bilinmeyen',
      total_xp: x.total_xp,
      current_level: x.current_level,
      badge_count: badgeMap.get(x.student_id) || 0,
    }));

    setEntries(result);
    setLoading(false);
    } catch (err) {
      console.error('Liderlik tablosu yüklenemedi:', err);
      setLoading(false);
    }
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 dark:text-slate-500" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400 dark:text-slate-500">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">
        Henüz liderlik tablosu verisi yok.
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-bold text-[#0f2847] dark:text-slate-100">Sınıf Liderlik Tablosu</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isMe = entry.student_id === myId;
          const level = getLevelInfo(entry.total_xp);
          return (
            <div
              key={entry.student_id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isMe ? 'bg-violet-50 border border-violet-200' : 'hover:bg-gray-50 dark:bg-slate-800/60'
              }`}
            >
              <div className="w-8 text-center">{rankIcon(i + 1)}</div>

              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center text-sm`}>
                {level.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-violet-700' : 'text-gray-700 dark:text-slate-300'}`}>
                  {entry.student_name} {isMe && '(Sen)'}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{entry.current_level}</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-[#0f2847] dark:text-slate-100">{entry.total_xp} XP</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{entry.badge_count} rozet</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
