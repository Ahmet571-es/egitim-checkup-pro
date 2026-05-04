-- ════════════════════════════════════════════════════════════════════
-- PASSWORD RESET REQUESTS — Manuel şifre sıfırlama talepleri
-- ════════════════════════════════════════════════════════════════════
--
-- Kullanıcı (öğrenci/öğretmen/veli) "Şifremi unuttum" butonuna basar →
-- bu tabloya bir satır düşer → yönetici /admin/password-resets
-- sayfasından görür → yeni şifre belirler ve kullanıcıya iletir.
--
-- Bu tablo Resend/Supabase email servislerini bypass eder. Mail
-- altyapısı çalışmasa bile şifre sıfırlama mümkün.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'cancelled')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_requests_status_idx
  ON password_reset_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS password_reset_requests_email_idx
  ON password_reset_requests (email);

-- RLS politikası: sadece adminler okur/yazar (frontend admin client kullanır)
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Hiç kimseye direkt SELECT/INSERT/UPDATE yetkisi yok — sadece
-- backend admin client (service role) erişir. RLS deny default.

COMMENT ON TABLE password_reset_requests IS
  'Manuel şifre sıfırlama talepleri. Kullanıcı talep eder → admin görür → admin yeni şifre belirler.';
