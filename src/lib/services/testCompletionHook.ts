/**
 * Test Tamamlama Hook'u
 * Test bittiğinde otomatik: XP ekle, rozet kontrol et, geçmişi kaydet
 */

import { createClient } from '@/lib/supabase/client';

const XP_TEST_COMPLETE = 50;
const XP_IMPROVEMENT = 30;

/** Test tamamlandığında çağrılacak ana fonksiyon */
/**
 * scores (JSONB) içinden karşılaştırılabilir tek bir sayı çıkarır.
 * Bu tabloda `score` diye bir sütun YOK — sorgular 'score' seçtiği için
 * Supabase 400 (42703) döndürüyor ve gelişim/rozet mantığı sessizce çalışmıyordu.
 */
function mainScoreOf(row: { scores?: unknown } | null | undefined): number {
  const s = row?.scores;
  if (typeof s === 'number') return s;
  if (s && typeof s === 'object') {
    const o = s as Record<string, unknown>;
    const m = o._main;
    if (typeof m === 'number') return m;
    if (typeof m === 'string') { const n = parseFloat(m.replace(/[^0-9.-]/g, '')); if (!isNaN(n)) return n; }
    const nums = Object.entries(o)
      .filter(([k, v]) => !k.startsWith('_') && typeof v === 'number')
      .map(([, v]) => v as number);
    if (nums.length) return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }
  return 0;
}

export async function onTestCompleted(studentId: string, testType: string, score: number): Promise<{
  xpGained: number;
  newBadges: string[];
  levelUp: boolean;
  newLevel: string;
}> {
  const supabase = createClient();
  let totalXP = 0;
  const newBadges: string[] = [];

  try {
    // 1. XP ekle (test tamamlama)
    totalXP += XP_TEST_COMPLETE;

    // 2. Gelişim kontrolü (tekrar testte ilerleme varsa bonus)
    const { data: prevResults } = await supabase
      .from('test_results')
      .select('scores')
      .eq('student_id', studentId)
      .eq('test_type', testType)
      .order('created_at', { ascending: false })
      .limit(2);

    if (prevResults && prevResults.length >= 2) {
      const prevScore = mainScoreOf(prevResults[1]);
      if (score > prevScore) {
        totalXP += XP_IMPROVEMENT;
      }
    }

    // 3. XP güncelle
    const { data: existingXP } = await supabase
      .from('student_xp')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const oldXP = existingXP?.total_xp || 0;
    const newXP = oldXP + totalXP;
    const testsCompleted = (existingXP?.tests_completed || 0) + 1;
    const newLevel = calculateLevel(newXP);
    const levelUp = existingXP ? calculateLevel(oldXP) !== newLevel : false;

    if (existingXP) {
      await supabase.from('student_xp').update({
        total_xp: newXP,
        current_level: newLevel,
        tests_completed: testsCompleted,
        updated_at: new Date().toISOString(),
      }).eq('student_id', studentId);
    } else {
      await supabase.from('student_xp').insert({
        student_id: studentId,
        total_xp: newXP,
        current_level: newLevel,
        tests_completed: testsCompleted,
      });
    }

    // 4. Rozet kontrolü
    const earnedBadges = await checkAndAwardBadges(supabase, studentId, testsCompleted, testType, score);
    newBadges.push(...earnedBadges);

    // 5. Rozet XP bonusu
    if (newBadges.length > 0) {
      const { data: badgeData } = await supabase
        .from('badges')
        .select('xp_reward')
        .in('name', newBadges);

      const badgeXP = (badgeData || []).reduce((sum, b) => sum + (b.xp_reward || 0), 0);
      if (badgeXP > 0) {
        totalXP += badgeXP;
        await supabase.from('student_xp').update({
          total_xp: newXP + badgeXP,
          current_level: calculateLevel(newXP + badgeXP),
        }).eq('student_id', studentId);
      }
    }

    // 6. Test geçmişine kaydet (boylamsal takip)
    const attemptNumber = prevResults ? prevResults.length : 1;
    try {
      await supabase.from('student_test_history').insert({
        student_id: studentId,
        test_type: testType,
        attempt_number: attemptNumber,
        score: score,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Tablo yoksa sessiz geç
    }

    // 7. E-posta bildirimi tetikle (server-side, hata olursa sessiz geç)
    try {
      await fetch('/api/notifications/test-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, testType, score }),
      });
    } catch {
      // E-posta hatası test akışını etkilemesin
    }

    return { xpGained: totalXP, newBadges, levelUp, newLevel };
  } catch (err) {
    console.error('onTestCompleted hatası:', err);
    return { xpGained: 0, newBadges: [], levelUp: false, newLevel: 'Çaylak' };
  }
}

/** Rozet kazanma kontrolü */
async function checkAndAwardBadges(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  testsCompleted: number,
  testType: string,
  score: number,
): Promise<string[]> {
  const earned: string[] = [];

  // Mevcut rozetleri al
  const { data: existingBadges } = await supabase
    .from('student_badges')
    .select('badge_id, badge:badges!student_badges_badge_id_fkey(name)')
    .eq('student_id', studentId);

  const ownedNames = new Set((existingBadges || []).map(b => {
    const badge = b.badge as unknown as { name: string } | null;
    return badge?.name || '';
  }));

  // Tüm rozetleri al
  const { data: allBadges } = await supabase.from('badges').select('*');
  if (!allBadges) return earned;

  for (const badge of allBadges) {
    if (ownedNames.has(badge.name)) continue;

    let shouldAward = false;

    switch (badge.requirement_type) {
      case 'tests_completed':
        shouldAward = testsCompleted >= badge.requirement_value;
        break;
      case 'high_score_d2':
        shouldAward = testType === 'd2_dikkat' && score >= badge.requirement_value;
        break;
      case 'high_score_okuma':
        shouldAward = testType === 'hizli_okuma' && score >= badge.requirement_value;
        break;
      case 'improvement_shown':
        // Gelişim gösterildi mi kontrol (basit: skor > 0 ve tekrar test)
        const { data: attempts } = await supabase
          .from('test_results')
          .select('scores')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (attempts && attempts.length >= 2) {
          let improvements = 0;
          for (let i = 0; i < attempts.length - 1; i++) {
            if (mainScoreOf(attempts[i]) > mainScoreOf(attempts[i + 1])) improvements++;
          }
          shouldAward = improvements >= badge.requirement_value;
        }
        break;
      case 'all_tests_completed':
        const { data: uniqueTests } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', studentId);
        const uniqueCount = new Set((uniqueTests || []).map(t => t.test_type)).size;
        shouldAward = uniqueCount >= badge.requirement_value;
        break;
      case 'tasks_completed':
        const { data: streakData } = await supabase
          .from('coaching_streaks')
          .select('total_completed')
          .eq('student_id', studentId)
          .maybeSingle();
        shouldAward = (streakData?.total_completed || 0) >= badge.requirement_value;
        break;
      case 'streak_days':
        const { data: streak } = await supabase
          .from('coaching_streaks')
          .select('longest_streak')
          .eq('student_id', studentId)
          .maybeSingle();
        shouldAward = (streak?.longest_streak || 0) >= badge.requirement_value;
        break;
    }

    if (shouldAward) {
      const { error } = await supabase.from('student_badges').insert({
        student_id: studentId,
        badge_id: badge.id,
      });
      if (!error) earned.push(badge.name);
    }
  }

  return earned;
}

function calculateLevel(xp: number): string {
  if (xp >= 1000) return 'Efsane';
  if (xp >= 600) return 'Üstad';
  if (xp >= 300) return 'Uzman';
  if (xp >= 100) return 'Kaşif';
  return 'Çaylak';
}
