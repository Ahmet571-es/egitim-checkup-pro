-- ============================================================================
-- Migration: Realtime publication for parent_teacher_notes
--
-- Sorun: Supabase Realtime, sadece 'supabase_realtime' publication'ına
--   eklenen tablolar için INSERT/UPDATE/DELETE event'leri yayınlar. Yeni
--   oluşturulan tablolar otomatik eklenmez.
--
-- Çözüm: ALTER PUBLICATION ile tabloyu publication'a ekle. Bu olmadan
--   /parent/messages ve teacher dashboard'daki realtime subscription'lar
--   kurulur ama hiç event almaz (fallback: polling + pathname refresh).
--
-- Idempotent: Tablo zaten publication'daysa hata döner ama tablo yoksa
--   hata. Güvenli şekilde çalıştırmak için DO block ile exception handle.
-- ============================================================================

DO $$
BEGIN
  -- Tablo supabase_realtime publication'ında değilse ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'parent_teacher_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE parent_teacher_notes;
  END IF;
END$$;

-- ============================================================================
-- Doğrulama:
--   SELECT * FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' AND tablename = 'parent_teacher_notes';
--   → 1 satır dönmeli
-- ============================================================================
