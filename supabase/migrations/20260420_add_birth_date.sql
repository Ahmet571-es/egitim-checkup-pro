-- ============================================================
-- MIGRATION: profiles tablosuna birth_date kolonu ekle
-- Tarih: 2026-04-20
-- Amaç: Öğrencilerin doğum tarihlerini saklayarak yaş tabanlı
-- testlerde (Burdon Dikkat Testi vb.) doğru süre hesabı yapabilmek
-- ============================================================

-- ----- 1) birth_date kolonunu ekle (idempotent) -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date DATE;
    COMMENT ON COLUMN profiles.birth_date IS 'Öğrencinin doğum tarihi — yaş tabanlı test süreleri ve norm değerleri için';
  END IF;
END $$;

-- ----- 2) Index (yaş gruplarına göre sorgulama için) -----
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON profiles (birth_date) WHERE birth_date IS NOT NULL;

-- ----- 3) handle_new_user trigger'ını güncelle -----
-- Yeni kayıtlarda metadata'daki birth_date profiles tablosuna da yazılır
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, school_id, grade, is_graduated, birth_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    CASE
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL
        AND NEW.raw_user_meta_data->>'school_id' <> ''
        THEN (NEW.raw_user_meta_data->>'school_id')::UUID
      ELSE NULL
    END,
    NULLIF(NEW.raw_user_meta_data->>'grade', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_graduated')::BOOLEAN, FALSE),
    -- YENİ: metadata'dan birth_date'i al, boşsa NULL
    CASE
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL
        AND NEW.raw_user_meta_data->>'birth_date' <> ''
        AND NEW.raw_user_meta_data->>'birth_date' <> '—'
        THEN (NEW.raw_user_meta_data->>'birth_date')::DATE
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- 4) Mevcut kullanıcıları backfill et -----
-- auth.users.raw_user_meta_data'daki birth_date'leri profiles'e taşı
-- (sadece profiles.birth_date NULL olan satırlarda)
UPDATE profiles p
SET birth_date = CASE
  WHEN (u.raw_user_meta_data->>'birth_date') IS NOT NULL
    AND (u.raw_user_meta_data->>'birth_date') <> ''
    AND (u.raw_user_meta_data->>'birth_date') <> '—'
  THEN (u.raw_user_meta_data->>'birth_date')::DATE
  ELSE NULL
END
FROM auth.users u
WHERE p.id = u.id
  AND p.birth_date IS NULL
  AND (u.raw_user_meta_data->>'birth_date') IS NOT NULL
  AND (u.raw_user_meta_data->>'birth_date') <> ''
  AND (u.raw_user_meta_data->>'birth_date') <> '—';

-- ============================================================
-- Notlar:
-- - Yeni kayıtlarda birth_date otomatik olarak profiles'e yazılır (trigger)
-- - Mevcut kullanıcıların birth_date'i metadata'dan backfill edildi (step 4)
-- - Backfill sonrası NULL kalanlar için öğrenci profil sayfasında uyarı gösterilir
-- - Yaş hesabı runtime'da yapılır: src/lib/utils/age.ts → calculateAge()
-- ============================================================
