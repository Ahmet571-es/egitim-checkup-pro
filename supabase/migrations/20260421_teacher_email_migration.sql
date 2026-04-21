-- ============================================================
-- MIGRATION: Öğretmen auth.users.email → gerçek email geçişi
-- Tarih: 2026-04-21
--
-- SEBEP:
--   Öğretmen kayıt akışı artık gerçek email kullanıyor (FAZ 1 refactor).
--   Önceden öğretmen kaydı `firstname_lastname@ogretmen.egitimcheckup.com`
--   formatında sentetik email üretiyordu, gerçek email ise
--   user_metadata.real_email'de saklanıyordu.
--
-- BU MIGRATION:
--   - Sentetik email'li mevcut öğretmenleri tespit eder
--   - user_metadata.real_email dolu ise auth.users.email'i günceller
--   - profiles.email'i de senkronize eder
--   - Çakışma kontrolü yapar (aynı real_email başka bir user'da varsa atla)
--
-- GÜVENLİK:
--   - auth.users güncelleme direkt SQL ile yapılıyor (Supabase SECURITY DEFINER
--     yetkili postgres rolünden çalışıyor — SQL Editor bu role sahip)
--   - email_change_confirmed_at set edilerek email onay zorunluluğu atlanıyor
--   - Çakışma olursa atlıyor, hata vermiyor
--
-- GERİ ALINAMAZ:
--   - Bu migration çalıştıktan sonra öğretmenler artık eski
--     `ad_soyad@ogretmen.egitimcheckup.com` email'iyle giriş yapamaz
--   - Gerçek email adresleriyle giriş yapmaları gerekir
-- ============================================================

-- ----- Adım 1: Güncellenecek öğretmenleri logla -----
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth.users u
  WHERE u.email LIKE '%@ogretmen.egitimcheckup.com'
    AND u.raw_user_meta_data->>'real_email' IS NOT NULL
    AND u.raw_user_meta_data->>'real_email' <> ''
    AND u.raw_user_meta_data->>'real_email' <> u.email;

  RAISE NOTICE '[teacher-email-migration] % öğretmen gerçek email''e taşınacak', v_count;
END $$;

-- ----- Adım 2: Çakışma kontrolü yapılacak — aynı real_email başka user'da varsa atla -----
-- (Güvenli UPDATE: sadece real_email'i başka bir user'da olmayan kayıtları güncelle)
UPDATE auth.users u
SET
  email = LOWER(TRIM(u.raw_user_meta_data->>'real_email')),
  email_confirmed_at = COALESCE(u.email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE u.email LIKE '%@ogretmen.egitimcheckup.com'
  AND u.raw_user_meta_data->>'real_email' IS NOT NULL
  AND u.raw_user_meta_data->>'real_email' <> ''
  AND u.raw_user_meta_data->>'real_email' <> u.email
  -- çakışma kontrolü: aynı real_email başka bir user'da olmasın
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u2
    WHERE LOWER(u2.email) = LOWER(TRIM(u.raw_user_meta_data->>'real_email'))
      AND u2.id <> u.id
  );

-- ----- Adım 3: profiles.email'i auth.users.email ile senkronize et -----
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email <> u.email
  AND p.role = 'teacher';

-- ----- Adım 4: auth.identities tablosundaki email de güncellensin (Supabase internal) -----
-- identities.identity_data->>'email' kullanıcının identity provider kaydında tutuluyor
-- (Supabase email/password provider için bu değer login ile doğrudan ilgili değildir,
--  ancak tutarlılık için güncelliyoruz — çakışma kontrolü aynı şekilde)
UPDATE auth.identities i
SET identity_data = jsonb_set(
      identity_data,
      '{email}',
      to_jsonb(u.email)
    ),
    updated_at = NOW()
FROM auth.users u
WHERE i.user_id = u.id
  AND i.provider = 'email'
  AND (i.identity_data->>'email') <> u.email;

-- ----- Adım 5: Sonuç raporu -----
DO $$
DECLARE
  v_updated integer;
  v_remaining integer;
BEGIN
  SELECT COUNT(*) INTO v_updated
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.role = 'teacher'
    AND u.email NOT LIKE '%@ogretmen.egitimcheckup.com';

  SELECT COUNT(*) INTO v_remaining
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.role = 'teacher'
    AND u.email LIKE '%@ogretmen.egitimcheckup.com';

  RAISE NOTICE '[teacher-email-migration] Tamamlandı. % öğretmen gerçek email''de, % öğretmen hâlâ sentetik email''de (real_email metadata yok veya çakışma var)', v_updated, v_remaining;
END $$;

-- ============================================================
-- NOTLAR:
--  - Hâlâ sentetik email'de kalan öğretmenler varsa (real_email yoksa),
--    onlar yine de eski sentetik email'leriyle giriş yapabilirler.
--  - Yeni kayıtlar gerçek email ile kaydedilir (form refactor).
--  - Öğrencilerin email'lerine DOKUNULMADI; onlar eski fake email'leriyle
--    giriş yapabilirler. Yeni öğrenci kayıtları gerçek email ile olur.
-- ============================================================
