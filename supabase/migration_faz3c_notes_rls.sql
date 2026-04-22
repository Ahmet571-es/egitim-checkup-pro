-- ============================================================================
-- Migration: FAZ 3C — parent_teacher_notes RLS sıkılaştırması
--
-- Sorun: Mevcut 'parent_own_notes' policy 'FOR ALL USING (...)' ama
--   WITH CHECK kısıtı yok. INSERT'te Supabase USING'i WITH CHECK olarak da
--   kullanır, ama davranış her versiyonda garanti DEĞİL. Ayrıca aynı USING
--   ifadesi, bir velinin teacher_id'si başka bir öğretmene ait NOT yazmasına
--   (spoofing) izin verebilir — auth.uid() = parent_id koşulu geçtiğinde
--   teacher_id'nin spoof olup olmadığı kontrol edilmiyor.
--
-- Çözüm:
--   1. Eski 'parent_own_notes' policy kaldır
--   2. Ayrı SELECT/INSERT/UPDATE/DELETE policy'leri koy
--   3. INSERT için WITH CHECK:
--      - Parent yazıyorsa: parent_id = auth.uid() VE student
--        parent_students'ta parent'a bağlı olmalı (kendi çocuğu)
--      - Teacher yazıyorsa: teacher_id = auth.uid()
--   4. UPDATE için SELECT'te aynı koşul (sadece is_read flag güncellemesi)
--
-- Idempotent: DROP IF EXISTS + CREATE. Tablo yoksa hata; tablo
--   FAZ 4 migration'ında oluşturulmuş olmalı.
-- ============================================================================

-- Eski politikayı kaldır
DROP POLICY IF EXISTS "parent_own_notes" ON parent_teacher_notes;
DROP POLICY IF EXISTS "ptn_select_own" ON parent_teacher_notes;
DROP POLICY IF EXISTS "ptn_insert_parent" ON parent_teacher_notes;
DROP POLICY IF EXISTS "ptn_insert_teacher" ON parent_teacher_notes;
DROP POLICY IF EXISTS "ptn_update_recipient" ON parent_teacher_notes;
DROP POLICY IF EXISTS "ptn_delete_author" ON parent_teacher_notes;

-- SELECT: konuşmanın tarafı olanlar (parent veya teacher)
CREATE POLICY "ptn_select_own"
  ON parent_teacher_notes FOR SELECT
  USING (
    auth.uid() = parent_id OR auth.uid() = teacher_id
  );

-- INSERT — Parent yazıyorsa: çocuğu kendisiyle bağlı olmalı
CREATE POLICY "ptn_insert_parent"
  ON parent_teacher_notes FOR INSERT
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_id = auth.uid()
        AND student_id = parent_teacher_notes.student_id
    )
  );

-- INSERT — Teacher yazıyorsa: kendi id'siyle yazsın
CREATE POLICY "ptn_insert_teacher"
  ON parent_teacher_notes FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

-- UPDATE — konuşmanın tarafı. Pratikte sadece is_read flag değişir.
CREATE POLICY "ptn_update_recipient"
  ON parent_teacher_notes FOR UPDATE
  USING (
    auth.uid() = parent_id OR auth.uid() = teacher_id
  );

-- DELETE — yazarın kendi notunu silebilmesi (gelecekte kullanılabilir)
CREATE POLICY "ptn_delete_author"
  ON parent_teacher_notes FOR DELETE
  USING (
    (parent_id = auth.uid()) OR (teacher_id = auth.uid())
  );

-- ============================================================================
-- Doğrulama:
--   Supabase SQL Editor'da:
--   SELECT polname, cmd FROM pg_policies WHERE tablename = 'parent_teacher_notes';
--   → 5 satır dönmeli: ptn_select_own (r), ptn_insert_parent (a),
--     ptn_insert_teacher (a), ptn_update_recipient (w), ptn_delete_author (d)
-- ============================================================================
