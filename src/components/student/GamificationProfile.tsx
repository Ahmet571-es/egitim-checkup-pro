'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLevelInfo, LEVELS, type Badge } from '@/lib/services/gamification';
import { Loader2, Lock, Trophy, Star, Flame } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  test: 'Test Rozetleri',
  kocluk: 'Koçluk Rozetleri',
  gelisim: 'Gelişim Rozetleri',
  streak: 'Seri Rozetleri',
  ozel: 'Özel Rozetler',
};

export default function GamificationProfile() {
  const [xp, setXP] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: xpData } = await supabase
      .from('student_xp')
      .select('total_xp')
      .eq('student_id', user.id)
      .single();

    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('category');

    const { data: earnedBadges } = await supabase
      .from('student_badges')
      .select('badge_id')
      .eq('student_id', user.id);

    const { data: streakData } = await supabase
      .from('coaching_streaks')
      .select('current_streak')
      .eq('student_id', user.id)
      .single();

    setXP(xpData?.total_xp || 0);
    setBadges(allBadges || []);
    setEarnedIds((earnedBadges || []).map(b => b.badge_id));
    setStreak(streakData?.current_streak || 0);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const level = getLevelInfo(xp);
  const earnedCount = earnedIds.length;
  const totalBadges = badges.length;
  const categories = [...new Set(badges.map(b => b.category))];

  return (
    <div className="space-y-6">
      {/* Profil Kartı */}
      <div className={`bg-gradient-to-br ${level.color} rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />

        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-lg">
            {level.emoji}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white/80">Seviye</p>
            <h2 className="text-3xl font-extrabold">{level.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
              <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {xp} XP</span>
              <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> {earnedCount} rozet</span>
              <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {streak} gün seri</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        {level.nextLevel && (
          <div className="mt-5 relative">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>{level.name}</span>
              <span>{level.nextLevel.name} ({level.xpToNext} XP kaldı)</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${level.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Seviye Yol Haritası */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#0f2847] mb-4">Seviye Yol Haritası</h3>
        <div className="flex items-center justify-between gap-2">
          {LEVELS.map((lvl, i) => {
            const isActive = lvl.name === level.name;
            const isPast = xp >= lvl.minXP && !isActive;
            return (
              <div key={lvl.name} className="flex-1 text-center">
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-lg mb-1 transition-all ${
                  isActive ? `bg-gradient-to-br ${lvl.color} text-white shadow-lg scale-110` :
                  isPast ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300'
                }`}>
                  {lvl.emoji}
                </div>
                <p className={`text-[10px] font-bold ${isActive ? 'text-violet-600' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                  {lvl.name}
                </p>
                <p className="text-[9px] text-gray-400">{lvl.minXP}+</p>
                {i < LEVELS.length - 1 && (
                  <div className={`absolute h-0.5 ${isPast ? 'bg-violet-300' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rozetler */}
      {categories.map(cat => {
        const catBadges = badges.filter(b => b.category === cat);
        return (
          <div key={cat} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f2847] mb-4">
              {CATEGORY_LABELS[cat] || cat}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {catBadges.filter(b => earnedIds.includes(b.id)).length}/{catBadges.length}
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {catBadges.map(badge => {
                const earned = earnedIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`relative rounded-xl border p-3 text-center transition-all ${
                      earned
                        ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    {!earned && (
                      <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-300" />
                    )}
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className={`text-xs font-bold ${earned ? 'text-[#0f2847]' : 'text-gray-400'}`}>
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                      {badge.description}
                    </p>
                    <p className="text-[10px] font-semibold text-amber-500 mt-1">+{badge.xp_reward} XP</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
