-- ════════════════════════════════════════════════════════════════════
-- OTP BRUTE-FORCE KORUMASI — verification_codes deneme sayacı
-- ════════════════════════════════════════════════════════════════════
--
-- Şifre sıfırlama / e-posta doğrulama kodları 6 haneli (1M kombinasyon).
-- Sunucu tarafında deneme sınırı olmadan, saldırgan tek geçerli koda karşı
-- sınırsız tahmin göndererek hesabı ele geçirebiliyordu.
--
-- Bu migration 'attempts' kolonu ekler. Uygulama katmanı (src/lib/auth/otp.ts):
--   - her yanlış denemede attempts++;
--   - attempts 5'e ulaşınca kodu iptal eder (used=true).
--
-- İDEMPOTENT: birden çok kez çalıştırılabilir.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- Cooldown ve doğrulama sorguları (email + created_at) için index.
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_created
  ON verification_codes (email, created_at DESC);

COMMENT ON COLUMN verification_codes.attempts IS
  'Bu kod icin yapilan hatali dogrulama denemesi sayisi. 5''e ulasinca kod iptal edilir (used=true).';
