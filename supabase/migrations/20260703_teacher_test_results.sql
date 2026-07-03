-- ============================================================
-- Öğretmen Kişisel Testleri — teacher_test_results
-- ------------------------------------------------------------
-- Öğretmenlerin kendi çözdüğü psikometrik test sonuçlarını tutar.
-- Öğrenci verisinden (test_results), sınıf istatistiklerinden ve
-- gamification'dan TAMAMEN izoledir.
--
-- Gizlilik: Sonuçlar SADECE testi çözen öğretmene görünür.
-- Yönetici, okul yöneticisi, veli ve öğrenci erişemez.
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_test_results (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_type    TEXT NOT NULL,
  raw_answers  JSONB DEFAULT '{}',
  scores       JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_test_results_teacher
  ON teacher_test_results(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_test_results_teacher_type
  ON teacher_test_results(teacher_id, test_type);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE teacher_test_results ENABLE ROW LEVEL SECURITY;

-- Öğretmen SADECE kendi sonuçlarını görebilir / ekleyebilir /
-- güncelleyebilir / silebilir. Başka hiçbir rol erişemez.
DROP POLICY IF EXISTS "Ogretmen kendi test sonuclarini yonetir" ON teacher_test_results;
CREATE POLICY "Ogretmen kendi test sonuclarini yonetir"
  ON teacher_test_results
  FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
