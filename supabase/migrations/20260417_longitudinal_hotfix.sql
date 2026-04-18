-- ============================================================
-- Eğitim Check-Up Pro — Boylamsal Takip Hotfix Migration
-- attempt_number kolonu + student_test_history tablosu
-- Bu migration idempotent — istediğin kadar çalıştırabilirsin
-- ============================================================

-- 1. student_test_history tablosu (yoksa oluştur)
CREATE TABLE IF NOT EXISTS student_test_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  attempt_number INT NOT NULL DEFAULT 1,
  score NUMERIC(6,2) DEFAULT 0,
  sub_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eksik kolon olabilir (eski bir hali varsa) — hepsini ekle
ALTER TABLE student_test_history ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1;
ALTER TABLE student_test_history ADD COLUMN IF NOT EXISTS score NUMERIC(6,2) DEFAULT 0;
ALTER TABLE student_test_history ADD COLUMN IF NOT EXISTS sub_scores JSONB DEFAULT '{}';
ALTER TABLE student_test_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_sth_student ON student_test_history(student_id);
CREATE INDEX IF NOT EXISTS idx_sth_student_test ON student_test_history(student_id, test_type);
CREATE INDEX IF NOT EXISTS idx_sth_created ON student_test_history(created_at);
CREATE INDEX IF NOT EXISTS idx_sth_attempt ON student_test_history(student_id, test_type, attempt_number);

-- 2. test_results tablosuna attempt_number ve previous_score kolonları
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS previous_score NUMERIC(6,2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tr_attempt ON test_results(student_id, test_type, attempt_number);

-- 3. RLS
ALTER TABLE student_test_history ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri temizle (idempotent rerun için)
DROP POLICY IF EXISTS "Students can read own test history" ON student_test_history;
DROP POLICY IF EXISTS "Students can insert own test history" ON student_test_history;
DROP POLICY IF EXISTS "Teachers can read class students test history" ON student_test_history;
DROP POLICY IF EXISTS "School admins can read school test history" ON student_test_history;
DROP POLICY IF EXISTS "Admin full access on student_test_history" ON student_test_history;
DROP POLICY IF EXISTS "Parents can read children test history" ON student_test_history;

-- Öğrenci: kendi verisini görebilir
CREATE POLICY "Students can read own test history"
  ON student_test_history FOR SELECT
  USING (student_id = auth.uid());

-- Öğrenci: kendi verisini ekleyebilir
CREATE POLICY "Students can insert own test history"
  ON student_test_history FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Öğretmen: kendisine atanmış öğrencilerin verisini görebilir
CREATE POLICY "Teachers can read assigned students test history"
  ON student_test_history FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'school_admin', 'admin')
  );

-- Veli: kendi çocuklarının verisini görebilir
CREATE POLICY "Parents can read children test history"
  ON student_test_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.student_id = student_test_history.student_id
        AND ps.parent_id = auth.uid()
    )
  );

-- 4. Mevcut test_results kayıtlarında attempt_number yoksa backfill et
-- (her test_type için kronolojik sıra: 1. deneme, 2. deneme ...)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY student_id, test_type
           ORDER BY completed_at NULLS LAST, created_at
         ) AS rn
  FROM test_results
  WHERE attempt_number IS NULL OR attempt_number = 1
)
UPDATE test_results t
SET attempt_number = ranked.rn
FROM ranked
WHERE t.id = ranked.id AND t.attempt_number IS DISTINCT FROM ranked.rn;
