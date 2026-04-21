-- ============================================================
-- MIGRATION: handle_new_user trigger'ını bulletproof yap
-- Tarih: 2026-04-21
--
-- SORUN:
--   Öğretmen kayıt formunda "Database error saving new user" hatası.
--   Mekanik: auth.users INSERT → on_auth_user_created trigger çalışır
--   → handle_new_user() içinde herhangi bir SQL exception olursa
--   Supabase tüm kaydı rollback eder ve bu generic mesajı döner.
--
-- NEDEN:
--   20260420_add_birth_date.sql versiyonunda EXCEPTION handler YOK.
--   Üstelik öğretmen-spesifik alanlar (branch, phone, is_approved)
--   hiç yazılmıyor → is_approved DEFAULT TRUE ile kaydediliyor
--   → onay sistemi bypass oluyor (ayrı bug).
--
-- ÇÖZÜM:
--   1. Her cast'i ayrı BEGIN/EXCEPTION bloğuna al (defensive)
--   2. Outer EXCEPTION WHEN others → trigger ASLA kaydı çökertmez
--   3. Öğretmen için branch + phone metadata'dan yaz
--   4. Öğretmen için is_approved = metadata.is_approved (varsayılan FALSE)
--   5. ON CONFLICT (id) DO UPDATE → orphan profile varsa temiz update
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  v_meta         jsonb;
  v_role         user_role := 'student';
  v_role_text    text;
  v_school_id    uuid;
  v_school_text  text;
  v_full_name    text;
  v_grade        text;
  v_is_graduated boolean := FALSE;
  v_birth_date   date;
  v_branch       text;
  v_phone        text;
  v_is_approved  boolean := TRUE;  -- öğrenci/veli default onaylı
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  -- ---------- role (enum cast, hataya dayanıklı) ----------
  v_role_text := NULLIF(v_meta->>'role', '');
  IF v_role_text IS NOT NULL THEN
    BEGIN
      v_role := v_role_text::user_role;
    EXCEPTION WHEN others THEN
      v_role := 'student';
    END;
  END IF;

  -- ---------- full_name ----------
  v_full_name := COALESCE(
    NULLIF(v_meta->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- ---------- school_id (UUID cast, code fallback) ----------
  v_school_text := NULLIF(v_meta->>'school_id', '');
  IF v_school_text IS NOT NULL THEN
    BEGIN
      v_school_id := v_school_text::uuid;
    EXCEPTION WHEN others THEN
      -- UUID değilse school code olarak dene
      BEGIN
        SELECT id INTO v_school_id
        FROM public.schools
        WHERE code = v_school_text
        LIMIT 1;
      EXCEPTION WHEN others THEN
        v_school_id := NULL;
      END;
    END;
  END IF;

  -- school_code alanı da fallback
  IF v_school_id IS NULL THEN
    v_school_text := NULLIF(v_meta->>'school_code', '');
    IF v_school_text IS NOT NULL THEN
      BEGIN
        SELECT id INTO v_school_id
        FROM public.schools
        WHERE code = v_school_text
        LIMIT 1;
      EXCEPTION WHEN others THEN
        v_school_id := NULL;
      END;
    END IF;
  END IF;

  -- ---------- grade (text: "1".."12" veya "mezun") ----------
  v_grade := NULLIF(v_meta->>'grade', '');

  -- ---------- is_graduated (boolean cast) ----------
  BEGIN
    v_is_graduated := COALESCE(
      (NULLIF(v_meta->>'is_graduated', ''))::boolean,
      FALSE
    );
  EXCEPTION WHEN others THEN
    v_is_graduated := FALSE;
  END;

  -- ---------- birth_date (date cast, em-dash ve boş korunuyor) ----------
  BEGIN
    IF v_meta->>'birth_date' IS NOT NULL
       AND v_meta->>'birth_date' <> ''
       AND v_meta->>'birth_date' <> '—'
       AND v_meta->>'birth_date' <> '-' THEN
      v_birth_date := (v_meta->>'birth_date')::date;
    END IF;
  EXCEPTION WHEN others THEN
    v_birth_date := NULL;
  END;

  -- ---------- branch (öğretmen) ----------
  v_branch := NULLIF(v_meta->>'branch', '');

  -- ---------- phone ----------
  v_phone := NULLIF(v_meta->>'phone', '');

  -- ---------- is_approved ----------
  -- Öğretmen: metadata'dan oku (varsayılan FALSE → onay beklemeli)
  -- Öğrenci/Veli: TRUE (mevcut davranış korunuyor)
  IF v_role = 'teacher' THEN
    BEGIN
      v_is_approved := COALESCE(
        (NULLIF(v_meta->>'is_approved', ''))::boolean,
        FALSE
      );
    EXCEPTION WHEN others THEN
      v_is_approved := FALSE;
    END;
  END IF;

  -- ---------- INSERT (idempotent, ON CONFLICT ile orphan-safe) ----------
  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, role, school_id,
      grade, is_graduated, birth_date,
      branch, phone, is_approved
    )
    VALUES (
      NEW.id, NEW.email, v_full_name, v_role, v_school_id,
      v_grade, v_is_graduated, v_birth_date,
      v_branch, COALESCE(v_phone, ''), v_is_approved
    )
    ON CONFLICT (id) DO UPDATE SET
      email        = EXCLUDED.email,
      full_name    = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
      role         = EXCLUDED.role,
      school_id    = COALESCE(EXCLUDED.school_id, profiles.school_id),
      grade        = COALESCE(EXCLUDED.grade, profiles.grade),
      is_graduated = EXCLUDED.is_graduated,
      birth_date   = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
      branch       = COALESCE(EXCLUDED.branch, profiles.branch),
      phone        = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
      is_approved  = EXCLUDED.is_approved;
  EXCEPTION WHEN others THEN
    -- INSERT hatasını yakala — trigger'ı düşürme
    RAISE WARNING '[handle_new_user] profiles INSERT failed | user_id=% email=% | % (SQLSTATE=%) | meta=%',
      NEW.id, NEW.email, SQLERRM, SQLSTATE, v_meta;
  END;

  RETURN NEW;

EXCEPTION WHEN others THEN
  -- MUTLAK GÜVENCE: trigger hiçbir durumda auth.users INSERT'ini engellemez
  RAISE WARNING '[handle_new_user] unexpected error | user_id=% email=% | % (SQLSTATE=%) | meta=%',
    NEW.id, NEW.email, SQLERRM, SQLSTATE, COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  RETURN NEW;
END;
$function$;

-- Trigger garantiye alınıyor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PostgREST cache'i anında yenile
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- BACKFILL: Mevcut öğretmen profillerinde branch/phone/is_approved boşsa
--           auth.users.raw_user_meta_data'dan geri yükle
-- ============================================================
UPDATE public.profiles p
SET
  branch      = COALESCE(p.branch, NULLIF(u.raw_user_meta_data->>'branch', '')),
  phone       = COALESCE(NULLIF(p.phone, ''), NULLIF(u.raw_user_meta_data->>'phone', ''), ''),
  is_approved = COALESCE(
    (NULLIF(u.raw_user_meta_data->>'is_approved', ''))::boolean,
    p.is_approved
  )
FROM auth.users u
WHERE p.id = u.id
  AND p.role = 'teacher'
  AND (
    p.branch IS NULL
    OR NULLIF(p.phone, '') IS NULL
    OR u.raw_user_meta_data ? 'is_approved'
  );

-- ============================================================
-- Notlar:
--  - Trigger artık bulletproof: hiçbir exception auth.users'ı rollback etmez
--  - Öğretmen kayıtlarında branch, phone, is_approved artık profiles'a yazılır
--  - Öğretmen için is_approved default FALSE → onay sistemi düzgün çalışır
--  - Hata olursa Supabase Postgres Logs'ta "[handle_new_user]" prefix'li
--    WARNING olarak görünür; teşhis kolaylaşır
--  - Eski öğretmen kayıtları backfill edildi (branch/phone/is_approved)
-- ============================================================
