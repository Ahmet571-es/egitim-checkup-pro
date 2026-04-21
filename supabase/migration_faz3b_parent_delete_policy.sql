-- ============================================================================
-- Migration: FAZ 3B hotfix — Veli kendi bağlantısını silebilsin
--
-- Sorun: parent_students tablosunda veli için sadece SELECT policy vardı.
--   /parent/my-children sayfasındaki "çıkar" butonu client'tan DELETE
--   çağırıyordu, RLS silent-block ediyordu (0 satır etkilendi, hata yok),
--   kullanıcı başarı toast'u görüyor ama bağlantı kaldırılmıyordu.
--
-- Çözüm: Veli kendi parent_students satırını silebilmeli.
--   Sadece parent_id = auth.uid() olan satırlar.
-- ============================================================================

-- Idempotent: varsa önce kaldır, sonra yeniden oluştur
DROP POLICY IF EXISTS "Parents can delete own links" ON parent_students;

CREATE POLICY "Parents can delete own links"
  ON parent_students FOR DELETE
  USING (parent_id = auth.uid());

-- Not: INSERT politikası gerekli DEĞİL. /api/parent/link-child endpoint'i
-- service role (admin client) ile insert yapar — RLS bypass. Bu tasarım
-- tercihi: kod doğrulaması ve idempotent duplicate kontrolü server-side
-- yapılsın, client insert yetkisine sahip olmasın.

-- Doğrulama:
--   Bir veli hesabı ile giriş yap, bir çocuk ekle, "çıkar" butonuna tıkla.
--   Tabloda satırın gerçekten silindiğini kontrol et:
--
--   SELECT * FROM parent_students
--   WHERE parent_id = '<veli-uuid>'
--   ORDER BY created_at DESC;
