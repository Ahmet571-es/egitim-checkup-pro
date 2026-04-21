-- ============================================================================
-- Migration: FAZ 3B — Öğrenci kodu ile veli-çocuk eşleştirme
-- Amaç: Öğrencilere tekil 6 haneli alfanumerik kod ata. Veli kayıt sırasında
--       bu kodu girerek çocuğuna otomatik bağlanır (parent_students insert).
-- ============================================================================

-- 1. profiles tablosuna student_code sütunu ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS student_code TEXT UNIQUE;

-- 2. Tekil kod üreten yardımcı fonksiyon
--    Format: 6 karakter, karışması kolay karakterler (O/0, I/1/L) hariç.
--    Collision olasılığı çok düşük (32^6 ≈ 1 milyar), yine de EXISTS döngüsüyle garantili.
CREATE OR REPLACE FUNCTION generate_unique_student_code()
RETURNS TEXT AS $$
DECLARE
  charset TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; -- 31 karakter
  candidate TEXT;
  tries INT := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(charset, 1 + floor(random() * length(charset))::int, 1);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE student_code = candidate) THEN
      RETURN candidate;
    END IF;

    tries := tries + 1;
    IF tries > 50 THEN
      RAISE EXCEPTION 'student_code üretilemedi (50 denemeden sonra)';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Yeni öğrenci oluşturulduğunda otomatik kod ata (eğer zaten yoksa)
CREATE OR REPLACE FUNCTION assign_student_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND (NEW.student_code IS NULL OR NEW.student_code = '') THEN
    NEW.student_code := generate_unique_student_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_student_code ON profiles;
CREATE TRIGGER trg_assign_student_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_student_code_on_insert();

-- 4. Rol öğrenciye çevrilirse (update ile) kod yoksa yine ata
CREATE OR REPLACE FUNCTION assign_student_code_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student'
     AND (OLD.role IS DISTINCT FROM 'student' OR OLD.student_code IS NULL)
     AND (NEW.student_code IS NULL OR NEW.student_code = '') THEN
    NEW.student_code := generate_unique_student_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_student_code_update ON profiles;
CREATE TRIGGER trg_assign_student_code_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_student_code_on_role_change();

-- 5. Mevcut öğrencilere geriye dönük kod ata (one-shot)
UPDATE profiles
SET student_code = generate_unique_student_code()
WHERE role = 'student' AND (student_code IS NULL OR student_code = '');

-- 6. student_code için RLS: öğrenci kendi kodunu görür, öğretmen/okul admini
--    kendi okulundakileri görür. Veli kaydı endpoint'i service role ile
--    doğrulama yapacak (RLS bypass).
--
-- Not: RLS politikaları zaten profiles tablosunda kurulu; student_code ayrı
-- sütun olduğu için mevcut politikalar onu da kapsar.

-- 7. Performans: lookup için index (unique constraint zaten index oluşturur,
--    ama explicit olarak not alıyoruz).
-- CREATE INDEX ... gereksiz (UNIQUE sütun zaten index'li).

-- ============================================================================
-- Doğrulama sorgusu (Supabase SQL Editor'da çalıştırarak kontrol):
--
--   SELECT id, full_name, role, student_code
--   FROM profiles
--   WHERE role = 'student'
--   LIMIT 10;
--
-- Yeni bir öğrenci ekle (tetikleyici çalışmalı):
--
--   INSERT INTO profiles (id, email, full_name, role, school_id)
--   VALUES (gen_random_uuid(), 'test@test.com', 'Test Öğrenci', 'student', NULL);
--   -- → student_code otomatik dolmuş olmalı
-- ============================================================================
