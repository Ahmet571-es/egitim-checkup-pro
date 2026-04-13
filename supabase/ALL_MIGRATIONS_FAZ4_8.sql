-- ============================================================
-- FAZ 4: Veli Deneyimi & Bildirim Sistemi — Migration
-- ============================================================

-- 1) Veli-Öğretmen Not Sistemi
CREATE TABLE IF NOT EXISTS parent_teacher_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES parent_teacher_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE parent_teacher_notes ENABLE ROW LEVEL SECURITY;

-- Veli kendi notlarını görebilir ve yazabilir
CREATE POLICY "parent_own_notes" ON parent_teacher_notes
  FOR ALL USING (
    auth.uid() = parent_id OR auth.uid() = teacher_id
  );

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_ptn_parent ON parent_teacher_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_ptn_teacher ON parent_teacher_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ptn_student ON parent_teacher_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_ptn_unread ON parent_teacher_notes(teacher_id, is_read) WHERE is_read = FALSE;

-- 2) Bildirim Tercihleri
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_test_complete BOOLEAN DEFAULT TRUE,
  email_report_ready BOOLEAN DEFAULT TRUE,
  email_teacher_note BOOLEAN DEFAULT TRUE,
  email_weekly_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_prefs" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 3) Onboarding durumu (profiles tablosuna ekle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
-- ============================================================
-- Eğitim Check-Up Pro — Faz 5: AI Koçluk Sistemi
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. COACHING_TASKS: Haftalık kişiselleştirilmiş görevler
CREATE TABLE IF NOT EXISTS coaching_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nefes_gevşeme', 'çalışma_tekniği', 'dikkat_egzersizi', 'motivasyon', 'sosyal_beceri')),
  source_test TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  week_number INTEGER NOT NULL DEFAULT EXTRACT(WEEK FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_tasks_student ON coaching_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_tasks_week ON coaching_tasks(student_id, week_number);
CREATE INDEX IF NOT EXISTS idx_coaching_tasks_completed ON coaching_tasks(student_id, is_completed);

ALTER TABLE coaching_tasks ENABLE ROW LEVEL SECURITY;

-- Öğrenci kendi görevlerini görebilir
CREATE POLICY "Öğrenci kendi görevlerini görür" ON coaching_tasks
  FOR SELECT USING (auth.uid() = student_id);

-- Öğrenci kendi görevlerini tamamlayabilir
CREATE POLICY "Öğrenci görevini tamamlar" ON coaching_tasks
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- API ile görev oluşturma (service role)
CREATE POLICY "Service role görev oluşturur" ON coaching_tasks
  FOR INSERT WITH CHECK (true);

-- Öğretmen kendi sınıfındaki öğrencilerin görevlerini görebilir
CREATE POLICY "Öğretmen sınıf görevlerini görür" ON coaching_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.student_id = coaching_tasks.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- 2. COACHING_STREAKS: Görev tamamlama serisi
CREATE TABLE IF NOT EXISTS coaching_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  total_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_streaks_student ON coaching_streaks(student_id);

ALTER TABLE coaching_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenci kendi streak'ini görür" ON coaching_streaks
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Öğretmen sınıf streak'lerini görür" ON coaching_streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.student_id = coaching_streaks.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- 3. AI_CHAT_USAGE: Günlük mesaj limiti takibi
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, usage_date)
);

ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenci kendi kullanımını görür" ON ai_chat_usage
  FOR ALL USING (auth.uid() = student_id);
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
-- ============================================================
-- Eğitim Check-Up Pro — Faz 7: Güvenlik, Erişilebilirlik & API
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. AUDIT_LOGS: Veri erişim kaydı
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin audit logları görebilir" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Audit log ekleme" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 2. USER_PREFERENCES: Erişilebilirlik tercihleri
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  large_font BOOLEAN NOT NULL DEFAULT false,
  voice_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi tercihlerini yönetir" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 3. API_KEYS: Public API erişim anahtarları
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Varsayılan',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  requests_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Okul yöneticisi kendi API key'lerini yönetir" ON api_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = api_keys.school_id AND role IN ('admin', 'school_admin'))
  );
-- ============================================================
-- Eğitim Check-Up Pro — Faz 8: İleri AI & İş Modeli
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. WHITE-LABEL: Okul markalama
CREATE TABLE IF NOT EXISTS school_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#7c3aed',
  secondary_color TEXT NOT NULL DEFAULT '#0f2847',
  school_display_name TEXT,
  custom_footer TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Okul yöneticisi kendi markalamasını yönetir" ON school_branding
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = school_branding.school_id AND role IN ('admin', 'school_admin'))
  );

CREATE POLICY "Okul üyeleri markayı görebilir" ON school_branding
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = school_branding.school_id)
  );

-- 2. GUIDANCE_PLANS: Rehberlik planları
CREATE TABLE IF NOT EXISTS guidance_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  plan_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guidance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğretmen kendi planlarını yönetir" ON guidance_plans
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Yönetici tüm planları görebilir" ON guidance_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'school_admin'))
  );
