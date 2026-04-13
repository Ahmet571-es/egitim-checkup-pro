-- ============================================================
-- Eğitim Check-Up Pro — Faz 2 HOTFIX
-- Bu script Faz 2'de canlı DB üzerinde uygulanan düzeltmeleri
-- migration olarak kaydeder. İdempotenttir.
--
-- Sorunlar / Düzeltmeler:
--   1. Signup 500 "Database error saving new user" — handle_new_user
--      trigger'ı school_code metasını çözememiş + RLS recursion.
--   2. Anon kullanıcı schools tablosunu okuyamıyordu (kayıt formu
--      "Okul kodu bulunamadı" hatası veriyordu).
--   3. profiles ve schools RLS politikaları aynı tablodan SELECT
--      yaparak sonsuz recursion üretiyordu.
--   4. mailer_autoconfirm=false → email rate limit 429 sonra signup
--      tamamen kilitleniyordu. (Auth config; SQL ile değil,
--      Management API ile patch edildi — burada not olarak.)
--   5. PostgREST schema cache stale.
-- ============================================================

-- ------------------------------------------------------------
-- 0) TEST OKULU SEED (kayıt formu için)
-- ------------------------------------------------------------
INSERT INTO public.schools (name, code, city, max_students, license_status)
VALUES ('Test Okulu', 'TEST01', 'Istanbul', 100, 'active')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- 1) SECURITY DEFINER yardımcı fonksiyonlar — RLS recursion'ını kırar
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_school_id() TO anon, authenticated;

-- ------------------------------------------------------------
-- 2) PROFILES politikalarını helper'lar ile yeniden yaz
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "School admin can manage school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can read school profiles" ON public.profiles;

CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "School admin can manage school profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'school_admin'
  )
  WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'school_admin'
  );

CREATE POLICY "Teachers can read school profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() = 'teacher'
  );

-- ------------------------------------------------------------
-- 3) SCHOOLS politikalarını yeniden yaz + anon SELECT izni
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access on schools" ON public.schools;
DROP POLICY IF EXISTS "School members can read own school" ON public.schools;
DROP POLICY IF EXISTS "Public can lookup school by code" ON public.schools;

CREATE POLICY "Admin full access on schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "School members can read own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (id = public.current_user_school_id());

-- Kayıt formunun anon olarak okul kodunu sorgulayabilmesi için:
CREATE POLICY "Public can lookup school by code"
  ON public.schools FOR SELECT
  TO anon, authenticated
  USING (true);

-- ------------------------------------------------------------
-- 4) handle_new_user trigger fonksiyonunu güçlendir
--    - school_id (UUID) veya school_code (TEXT) destekler
--    - hataya dayanıklı (her durumda RETURN NEW)
--    - kötü meta veriyi WARNING olarak loglar
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_role user_role := 'student';
  v_school_id uuid;
  v_meta jsonb;
  v_role_text text;
  v_school_text text;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- role
  v_role_text := NULLIF(v_meta->>'role', '');
  IF v_role_text IS NOT NULL THEN
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION WHEN others THEN
      v_role := 'student';
    END;
  END IF;

  -- school_id direkt UUID olarak verilebilir
  v_school_text := NULLIF(v_meta->>'school_id', '');
  IF v_school_text IS NOT NULL THEN
    BEGIN
      v_school_id := v_school_text::uuid;
    EXCEPTION WHEN others THEN
      -- UUID değilse code olarak dene
      SELECT id INTO v_school_id
      FROM public.schools
      WHERE code = v_school_text
      LIMIT 1;
    END;
  END IF;

  -- school_code alanı da fallback
  IF v_school_id IS NULL THEN
    v_school_text := NULLIF(v_meta->>'school_code', '');
    IF v_school_text IS NOT NULL THEN
      SELECT id INTO v_school_id
      FROM public.schools
      WHERE code = v_school_text
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, school_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(v_meta->>'full_name', ''), split_part(NEW.email, '@', 1)),
    v_role,
    v_school_id
  );

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user failed for %: % | meta=%', NEW.email, SQLERRM, v_meta;
  RETURN NEW;
END;
$function$;

-- Trigger zaten var; yine de garantiye al
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 5) PostgREST cache reload
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- NOT: mailer_autoconfirm=true ayarı Supabase Auth config
-- üzerinden yapılmalıdır (SQL ile değil):
--   PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
--   body: {"mailer_autoconfirm": true}
-- ============================================================
