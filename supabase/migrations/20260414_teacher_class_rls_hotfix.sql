-- ============================================================
-- Eğitim Check-Up Pro — Öğretmen Sınıf Yönetimi RLS Hotfix
-- Tarih: 2026-04-14
-- 
-- SORUN: Öğretmenler sınıf oluşturamıyor, öğrenci atayamıyor.
--   - classes tablosunda yalnızca SELECT politikası var
--   - class_students tablosunda yalnızca SELECT politikası var
--   - classes.school_id NOT NULL → school_id'si NULL öğretmen sınıf oluşturamıyor
--
-- ÇÖZÜM: INSERT/UPDATE/DELETE politikaları + school_id nullable
-- ============================================================

-- 1) classes.school_id NOT NULL kısıtlamasını kaldır
ALTER TABLE classes ALTER COLUMN school_id DROP NOT NULL;

-- 2) Öğretmen kendi sınıflarını oluşturabilsin (INSERT)
DROP POLICY IF EXISTS "Teachers can create own classes" ON classes;
CREATE POLICY "Teachers can create own classes" ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND public.current_user_role() = 'teacher'
  );

-- 3) Öğretmen kendi sınıflarını güncelleyebilsin (UPDATE)
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND public.current_user_role() = 'teacher'
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND public.current_user_role() = 'teacher'
  );

-- 4) Öğretmen kendi sınıflarını silebilsin (DELETE)
DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
CREATE POLICY "Teachers can delete own classes" ON classes
  FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid()
    AND public.current_user_role() = 'teacher'
  );

-- 5) Öğretmen kendi sınıflarına öğrenci atayabilsin (INSERT)
DROP POLICY IF EXISTS "Teachers can add students to own classes" ON class_students;
CREATE POLICY "Teachers can add students to own classes" ON class_students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() = 'teacher'
    AND class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- 6) Öğretmen kendi sınıflarından öğrenci çıkarabilsin (DELETE)
DROP POLICY IF EXISTS "Teachers can remove students from own classes" ON class_students;
CREATE POLICY "Teachers can remove students from own classes" ON class_students
  FOR DELETE
  TO authenticated
  USING (
    public.current_user_role() = 'teacher'
    AND class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- 7) Öğretmenin tüm öğrenci profillerini görebilmesi (öğrenci atama listesi için)
-- Mevcut politika sadece aynı okuldaki profilleri gösteriyor.
-- Bu politika role='student' olan tüm profilleri öğretmene açar.
DROP POLICY IF EXISTS "Teachers can read all student profiles" ON profiles;
CREATE POLICY "Teachers can read all student profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'teacher'
    AND role = 'student'
  );

-- 8) PostgREST schema cache'i yenile
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- NOT: Bu migration'ı Supabase SQL Editor'da çalıştırın:
-- https://supabase.com/dashboard/project/orvrjtcxowdrcdrctgqc
-- ============================================================
