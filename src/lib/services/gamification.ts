/**
 * Faz 6: Gamification Servisi
 * XP hesaplama, seviye sistemi, rozet kontrolü, liderlik tablosu
 */

import { createClient } from '@/lib/supabase/client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

export interface StudentBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface StudentXP {
  student_id: string;
  total_xp: number;
  current_level: string;
  tests_completed: number;
  tasks_completed: number;
}

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  total_xp: number;
  current_level: string;
  badge_count: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  week_number: number;
  is_active: boolean;
  progress?: number;
  is_completed?: boolean;
}

// Seviye tanımları
export const LEVELS = [
  { name: 'Çaylak', minXP: 0, maxXP: 99, color: 'from-gray-400 to-gray-500', emoji: '🌱' },
  { name: 'Kaşif', minXP: 100, maxXP: 299, color: 'from-emerald-400 to-emerald-600', emoji: '🔭' },
  { name: 'Uzman', minXP: 300, maxXP: 599, color: 'from-blue-400 to-blue-600', emoji: '🎓' },
  { name: 'Üstad', minXP: 600, maxXP: 999, color: 'from-violet-400 to-violet-600', emoji: '⭐' },
  { name: 'Efsane', minXP: 1000, maxXP: Infinity, color: 'from-amber-400 to-amber-600', emoji: '👑' },
];

export function getLevelInfo(xp: number) {
  const level = LEVELS.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progressInLevel = xp - level.minXP;
  const levelRange = (nextLevel ? nextLevel.minXP : level.maxXP) - level.minXP;
  const progressPercent = nextLevel ? Math.min(100, (progressInLevel / levelRange) * 100) : 100;
  return { ...level, progressPercent, nextLevel, xpToNext: nextLevel ? nextLevel.minXP - xp : 0 };
}

// XP kazanma miktarları
export const XP_REWARDS = {
  TEST_COMPLETE: 50,
  TASK_COMPLETE: 20,
  STREAK_BONUS: 10,
  IMPROVEMENT: 30,
};

/** Öğrencinin XP bilgisini getir */
export async function getStudentXP(studentId: string): Promise<StudentXP | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  return data;
}

/** XP ekle ve seviye güncelle */
export async function addXP(studentId: string, amount: number, reason: 'test' | 'task' | 'streak' | 'badge' | 'challenge'): Promise<{ newXP: number; levelUp: boolean; newLevel: string }> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('student_xp')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  const oldXP = existing?.total_xp || 0;
  const newXP = oldXP + amount;
  const oldLevel = getLevelInfo(oldXP);
  const newLevel = getLevelInfo(newXP);
  const levelUp = oldLevel.name !== newLevel.name;

  const updates: Record<string, unknown> = {
    total_xp: newXP,
    current_level: newLevel.name,
    updated_at: new Date().toISOString(),
  };

  if (reason === 'test') updates.tests_completed = (existing?.tests_completed || 0) + 1;
  if (reason === 'task') updates.tasks_completed = (existing?.tasks_completed || 0) + 1;

  if (existing) {
    await supabase.from('student_xp').update(updates).eq('student_id', studentId);
  } else {
    await supabase.from('student_xp').insert({ student_id: studentId, ...updates });
  }

  return { newXP, levelUp, newLevel: newLevel.name };
}

/** Tüm rozetleri ve öğrencinin kazandıklarını getir */
export async function getBadges(studentId: string): Promise<{ all: Badge[]; earned: string[] }> {
  const supabase = createClient();

  const { data: allBadges } = await supabase
    .from('badges')
    .select('*')
    .order('category', { ascending: true });

  const { data: earnedBadges } = await supabase
    .from('student_badges')
    .select('badge_id')
    .eq('student_id', studentId);

  return {
    all: allBadges || [],
    earned: (earnedBadges || []).map(b => b.badge_id),
  };
}

/** Sınıf liderlik tablosu */
export async function getLeaderboard(studentId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  // Öğrencinin sınıf arkadaşlarını bul
  const { data: myClasses } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId);

  if (!myClasses || myClasses.length === 0) return [];

  const classIds = myClasses.map(c => c.class_id);

  const { data: classmates } = await supabase
    .from('class_students')
    .select('student_id, student:profiles!class_students_student_id_fkey(full_name)')
    .in('class_id', classIds);

  if (!classmates) return [];

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

  return (xpData || []).map(x => ({
    student_id: x.student_id,
    student_name: nameMap.get(x.student_id) || 'Bilinmeyen',
    total_xp: x.total_xp,
    current_level: x.current_level,
    badge_count: badgeMap.get(x.student_id) || 0,
  }));
}

/** Bu haftanın meydan okumasını getir */
export async function getWeeklyChallenge(studentId: string): Promise<WeeklyChallenge | null> {
  const supabase = createClient();
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const { data: challenge } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('week_number', weekNumber)
    .eq('is_active', true)
    .maybeSingle();

  if (!challenge) return null;

  const { data: participation } = await supabase
    .from('student_challenges')
    .select('progress, is_completed')
    .eq('student_id', studentId)
    .eq('challenge_id', challenge.id)
    .maybeSingle();

  return {
    ...challenge,
    progress: participation?.progress || 0,
    is_completed: participation?.is_completed || false,
  };
}
