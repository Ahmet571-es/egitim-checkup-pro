-- ============================================================
-- Eğitim Check-Up Pro — Öğretmen Kayıt Onay Sistemi
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. E-posta doğrulama kodları (geçici — 10 dk ömürlü)
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);

-- Eski kodları otomatik sil (opsiyonel cron ile)
-- DELETE FROM verification_codes WHERE expires_at < now();

-- 2. Profiles tablosuna is_approved kolonu (öğretmen onayı için)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_approved boolean DEFAULT true;
  END IF;
END $$;

-- Mevcut öğretmenler otomatik onaylı
UPDATE profiles SET is_approved = true WHERE role = 'teacher' AND is_approved IS NULL;

-- Yeni öğretmenler varsayılan olarak ONAYSIZ
-- (Kayıt sırasında is_approved = false olarak ayarlanacak)

-- 3. Profiles tablosuna branch kolonu (öğretmen branşı)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'branch'
  ) THEN
    ALTER TABLE profiles ADD COLUMN branch text;
  END IF;
END $$;
