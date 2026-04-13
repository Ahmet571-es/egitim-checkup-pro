-- ============================================================
-- Eğitim Check-Up Pro — Faz 6: Gamification Sistemi
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. BADGES: Rozet tanımları
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('test', 'kocluk', 'gelisim', 'streak', 'ozel')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes rozetleri görebilir" ON badges FOR SELECT USING (true);

-- 20 Rozet Tanımla
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
  ('İlk Adım', 'İlk testini tamamladın!', '🎯', 'test', 'tests_completed', 1, 50),
  ('Keşifçi', '5 farklı test tamamladın', '🔭', 'test', 'tests_completed', 5, 100),
  ('Test Ustası', '10 test tamamladın', '🏅', 'test', 'tests_completed', 10, 200),
  ('Maratoncu', '25 test tamamladın', '🏃', 'test', 'tests_completed', 25, 500),
  ('Dikkat Ustası', 'D2 Dikkat Testinde yüksek skor', '👁️', 'test', 'high_score_d2', 70, 150),
  ('Hız Kurşunu', 'Hızlı Okuma testinde yüksek skor', '⚡', 'test', 'high_score_okuma', 70, 150),
  ('Kaygı Avcısı', 'Sınav kaygısı skorun düştü', '🧘', 'gelisim', 'anxiety_decreased', 10, 200),
  ('Gelişim Şampiyonu', 'Tekrar testte ilerleme gösterdin', '📈', 'gelisim', 'improvement_shown', 1, 150),
  ('Süper Gelişim', '3 farklı testte ilerleme', '🚀', 'gelisim', 'improvement_shown', 3, 300),
  ('Koçluk Yıldızı', '10 koçluk görevi tamamladın', '⭐', 'kocluk', 'tasks_completed', 10, 150),
  ('Görev Kahramanı', '25 koçluk görevi tamamladın', '🦸', 'kocluk', 'tasks_completed', 25, 300),
  ('Süper Koç', '50 koçluk görevi tamamladın', '🏆', 'kocluk', 'tasks_completed', 50, 500),
  ('Kararlı', '7 gün üst üste görev tamamladın', '🔥', 'streak', 'streak_days', 7, 200),
  ('Vazgeçmeyen', '14 gün üst üste görev tamamladın', '💎', 'streak', 'streak_days', 14, 400),
  ('Efsane Seri', '30 gün üst üste görev tamamladın', '👑', 'streak', 'streak_days', 30, 1000),
  ('Erken Kuş', 'Sabah 8 öncesi görev tamamladın', '🐦', 'ozel', 'early_bird', 1, 50),
  ('Gece Kuşu', 'Gece 22 sonrası görev tamamladın', '🦉', 'ozel', 'night_owl', 1, 50),
  ('Sosyal Kelebek', 'Sınıf liderlik tablosunda ilk 3', '🦋', 'ozel', 'leaderboard_top3', 1, 200),
  ('360 Derece', '360° profil raporunu oluşturdun', '🎯', 'ozel', 'profile_360_created', 1, 100),
  ('Tam Kadro', '10 testin hepsini tamamladın', '🌟', 'ozel', 'all_tests_completed', 10, 500)
ON CONFLICT (name) DO NOTHING;

-- 2. STUDENT_BADGES: Kazanılan rozetler
CREATE TABLE IF NOT EXISTS student_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenci kendi rozetlerini görür" ON student_badges
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Rozet ekleme" ON student_badges
  FOR INSERT WITH CHECK (true);

-- 3. STUDENT_XP: Deneyim puanı ve seviye
CREATE TABLE IF NOT EXISTS student_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'Çaylak',
  tests_completed INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_xp_student ON student_xp(student_id);
CREATE INDEX IF NOT EXISTS idx_student_xp_total ON student_xp(total_xp DESC);
ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenci kendi XP'sini görür" ON student_xp
  FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Sınıf arkadaşları XP görebilir" ON student_xp
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students cs1
      JOIN class_students cs2 ON cs1.class_id = cs2.class_id
      WHERE cs1.student_id = auth.uid()
      AND cs2.student_id = student_xp.student_id
    )
  );

-- 4. WEEKLY_CHALLENGES: Haftalık meydan okumalar
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  badge_reward UUID REFERENCES badges(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_number, year)
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes challenge görebilir" ON weekly_challenges FOR SELECT USING (true);

-- 5. STUDENT_CHALLENGES: Meydan okuma katılımları
CREATE TABLE IF NOT EXISTS student_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, challenge_id)
);

ALTER TABLE student_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Öğrenci kendi challenge'ını görür" ON student_challenges
  FOR ALL USING (auth.uid() = student_id);
