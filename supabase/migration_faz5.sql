-- ============================================================
-- Eğitim Check-Up Pro — Faz 5: iyzico Ödeme + Lisans + KVKK
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. PAYMENTS: iyzico işlem kaydı
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,                 -- baslangic / profesyonel / kurumsal
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,         -- TRY
  currency TEXT NOT NULL DEFAULT 'TRY',
  conversation_id TEXT NOT NULL,          -- iyzico conversation_id
  payment_id TEXT,                        -- iyzico payment_id
  status TEXT NOT NULL DEFAULT 'pending', -- pending / success / failed
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_conversation ON payments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on payments" ON payments;
CREATE POLICY "Admin full access on payments"
  ON payments FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "School admin read own payments" ON payments;
CREATE POLICY "School admin read own payments"
  ON payments FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

-- 2. SCHOOLS: kvkk onay alanı
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS kvkk_accepted_at TIMESTAMPTZ;

-- 3. LICENSES: Faz 5 alanları
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_key TEXT DEFAULT 'trial';

-- 4. Otomatik trial başlatma: okul oluşturulunca licenses'a trial satırı eklensin
CREATE OR REPLACE FUNCTION create_trial_license()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO licenses (school_id, plan_name, plan_key, max_students, start_date, end_date, status, price)
  VALUES (NEW.id, 'Deneme', 'trial', 50, NOW(), NOW() + INTERVAL '14 days', 'trial', 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_trial_license ON schools;
CREATE TRIGGER trg_create_trial_license
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_license();

-- 5. Expired güncelleyici (cron veya manuel çağrı için)
CREATE OR REPLACE FUNCTION refresh_license_status()
RETURNS INT AS $$
DECLARE
  n INT;
BEGIN
  UPDATE schools
     SET license_status = 'expired',
         updated_at = NOW()
   WHERE license_end_date < NOW()
     AND license_status <> 'expired';
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE licenses
     SET status = 'expired'
   WHERE end_date < NOW()
     AND status <> 'expired';
  RETURN n;
END;
$$ LANGUAGE plpgsql;

-- 6. get_student_count helper
CREATE OR REPLACE FUNCTION get_school_student_count(p_school_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM profiles
   WHERE school_id = p_school_id AND role = 'student' AND is_active = TRUE;
$$ LANGUAGE sql STABLE;
