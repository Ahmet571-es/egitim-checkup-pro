-- ============================================================
-- Egitim Check-Up Pro - FAZ 1: Boylamsal Takip & Gelisim Grafikleri
-- Supabase SQL Editor'da calistirilacak migration
-- ============================================================

-- 1. STUDENT_TEST_HISTORY TABLOSU
-- Ogrencilerin test gecmisini ve boylamsal verilerini tutar
CREATE TABLE IF NOT EXISTS student_test_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  score NUMERIC(6,2) DEFAULT 0,
  sub_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_sth_student ON student_test_history(student_id);
CREATE INDEX IF NOT EXISTS idx_sth_student_test ON student_test_history(student_id, test_type);
CREATE INDEX IF NOT EXISTS idx_sth_created ON student_test_history(created_at);

-- 2. TEST_RESULTS TABLOSUNA YENi ALANLAR EKLE
-- attempt_number: kacinci deneme oldugunu belirtir
-- previous_score: onceki denemenin skorunu saklar
ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;

ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS previous_score NUMERIC(6,2) DEFAULT NULL;

-- Index: attempt_number ile sorgular
CREATE INDEX IF NOT EXISTS idx_tr_attempt ON test_results(student_id, test_type, attempt_number);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE student_test_history ENABLE ROW LEVEL SECURITY;

-- Ogrenci: kendi verisini gorebilir
CREATE POLICY "Students can read own test history"
  ON student_test_history FOR SELECT
  USING (student_id = auth.uid());

-- Ogrenci: kendi verisini ekleyebilir
CREATE POLICY "Students can insert own test history"
  ON student_test_history FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Ogretmen: kendi sinifindaki ogrencilerin verisini gorebilir
CREATE POLICY "Teachers can read class students test history"
  ON student_test_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = student_test_history.student_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Okul yoneticisi: kendi okulundaki tum ogrencilerin verisini gorebilir
CREATE POLICY "School admins can read school test history"
  ON student_test_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = student_test_history.student_id
        AND p.school_id = (
          SELECT school_id FROM profiles WHERE id = auth.uid()
        )
        AND (
          SELECT role FROM profiles WHERE id = auth.uid()
        ) = 'school_admin'
    )
  );

-- Platform admin: tum verileri gorebilir
CREATE POLICY "Admin full access on student_test_history"
  ON student_test_history FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Veli: kendi cocuklarinin verisini gorebilir
CREATE POLICY "Parents can read children test history"
  ON student_test_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.student_id = student_test_history.student_id
        AND ps.parent_id = auth.uid()
    )
  );
