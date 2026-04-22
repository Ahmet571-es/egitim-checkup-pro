-- ============================================================================
-- Migration: parent_students tablosuna öğretmen onay mekanizması
--
-- Patron'un isteği: "Veli, öğrenci kodu ile kendi kendine bağlandığında
--   öğretmen bu bağlantıyı onaylamadan veli çocuğun tam verisine
--   erişememeli."
--
-- Değişiklik:
--   - approved_at: NULL → onay bekleniyor, değeri doluysa onaylanmış
--   - approved_by: onaylayan öğretmenin id'si (veya okul yöneticisinin)
--
-- Geriye dönük uyumluluk:
--   - Mevcut satırlar için approved_at = created_at set et (eski kayıtlar
--     otomatik onaylanmış say)
--
-- Idempotent: IF NOT EXISTS kontrolü.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parent_students' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE parent_students
      ADD COLUMN approved_at TIMESTAMPTZ NULL,
      ADD COLUMN approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

    -- Mevcut kayıtlar: geriye dönük olarak onaylanmış kabul et
    UPDATE parent_students
    SET approved_at = created_at
    WHERE approved_at IS NULL;
  END IF;
END$$;

-- Index: öğretmen panelinde "onay bekleyen velileri listele" sorgusu için
CREATE INDEX IF NOT EXISTS idx_parent_students_pending
  ON parent_students(student_id)
  WHERE approved_at IS NULL;

-- ============================================================================
-- Doğrulama:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'parent_students';
--   → approved_at (timestamp) ve approved_by (uuid) görünmeli
-- ============================================================================
