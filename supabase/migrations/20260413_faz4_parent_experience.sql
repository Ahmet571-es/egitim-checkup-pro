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
