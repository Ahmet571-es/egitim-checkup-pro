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
