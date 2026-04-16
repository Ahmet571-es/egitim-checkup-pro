-- ============================================================
-- Eğitim Check-Up Pro — Öğrenci Aktarım Log Tablosu
-- Öğrencinin hangi öğretmenden hangi öğretmene aktarıldığı kaydı
-- ============================================================

CREATE TABLE IF NOT EXISTS transfer_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_logs_student ON transfer_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_from ON transfer_logs(from_teacher_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_to ON transfer_logs(to_teacher_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_performed ON transfer_logs(performed_at DESC);

-- RLS
ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers and admins can read transfer logs" ON transfer_logs;

CREATE POLICY "Teachers and admins can read transfer logs"
  ON transfer_logs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'school_admin', 'admin')
  );

-- API createAdminClient() kullandığı için INSERT zaten bypass olur.
