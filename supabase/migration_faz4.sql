-- ============================================================
-- Eğitim Check-Up Pro — Faz 4: AI Rapor + Entegre Raporlar
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- integrated_reports tablosu (3'lü rapor sistemi)
CREATE TABLE IF NOT EXISTS integrated_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  teacher_report TEXT,
  student_report TEXT,
  parent_report TEXT,
  test_count INT DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrated_reports_student ON integrated_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_integrated_reports_school ON integrated_reports(school_id);

-- RLS
ALTER TABLE integrated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage integrated reports"
  ON integrated_reports FOR ALL
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'school_admin', 'admin')
  );

CREATE POLICY "Students can read own integrated reports"
  ON integrated_reports FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read children integrated reports"
  ON integrated_reports FOR SELECT
  USING (
    student_id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- test_results tablosuna ai_report alanları yoksa ekle
ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS ai_report TEXT,
  ADD COLUMN IF NOT EXISTS ai_report_generated_at TIMESTAMPTZ;
