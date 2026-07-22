import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

// 52 haftalık dönen meydan okuma havuzu
const CHALLENGE_POOL = [
  { title: 'Dikkat Şampiyonu', description: 'Bu hafta D2 Dikkat Testinde en yüksek skorunu al', challenge_type: 'high_score', target_value: 70, xp_reward: 150 },
  { title: 'Hız Ustası', description: 'Hızlı Okuma testinde dakikada 200+ kelime oku', challenge_type: 'speed_reading', target_value: 200, xp_reward: 120 },
  { title: 'Görev Makinesi', description: 'Bu hafta 5 koçluk görevinin hepsini tamamla', challenge_type: 'tasks_all', target_value: 5, xp_reward: 100 },
  { title: 'Erken Kuş', description: 'Sabah 8:00 öncesi bir görev tamamla', challenge_type: 'early_task', target_value: 1, xp_reward: 80 },
  { title: 'Tam Kadro', description: 'Bu hafta en az 3 farklı test çöz', challenge_type: 'multi_test', target_value: 3, xp_reward: 200 },
  { title: 'Gelişim Yıldızı', description: 'Herhangi bir testte önceki skorunu geç', challenge_type: 'improvement', target_value: 1, xp_reward: 150 },
  { title: 'Streak Avcısı', description: '5 gün üst üste en az 1 görev tamamla', challenge_type: 'streak', target_value: 5, xp_reward: 180 },
  { title: 'AI Koçluk Meraklısı', description: 'AI koçuna 3 soru sor', challenge_type: 'ai_chat', target_value: 3, xp_reward: 80 },
  { title: 'Keşifçi', description: '360° profilini oluştur', challenge_type: 'profile_360', target_value: 1, xp_reward: 120 },
  { title: 'Nefes Ustası', description: '5 gün boyunca nefes egzersizi yap', challenge_type: 'breathing', target_value: 5, xp_reward: 100 },
  { title: 'Çalışkan Arı', description: 'Bu hafta toplam 3 saat çalış (Pomodoro ile)', challenge_type: 'study_hours', target_value: 3, xp_reward: 150 },
  { title: 'Sosyal Kelebek', description: 'Bir arkadaşına test çözmesini öner', challenge_type: 'social', target_value: 1, xp_reward: 60 },
];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function POST() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const year = now.getFullYear();

    // Bu hafta zaten challenge var mı?
    const { data: existing } = await supabase
      .from('weekly_challenges')
      .select('id')
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: 'Bu hafta için meydan okuma zaten var', challenge_id: existing.id });
    }

    // Havuzdan sırayla seç (hafta numarasına göre döner)
    const challenge = CHALLENGE_POOL[weekNumber % CHALLENGE_POOL.length];

    const { data: created, error } = await supabase
      .from('weekly_challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        challenge_type: challenge.challenge_type,
        target_value: challenge.target_value,
        xp_reward: challenge.xp_reward,
        week_number: weekNumber,
        year: year,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return serverError('admin/weekly-challenge', error, 500);
    }

    return NextResponse.json({ message: 'Haftalık meydan okuma oluşturuldu', challenge: created });
  } catch (err) {
    console.error('Weekly challenge error:', err);
    return NextResponse.json({ error: 'Meydan okuma oluşturulamadı.' }, { status: 500 });
  }
}
