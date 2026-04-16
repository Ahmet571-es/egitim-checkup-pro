-- ============================================================
-- Eğitim Check-Up Pro — Harmanlanmış (Bütüncül) Rapor Sistemi
-- Çoklu kayıt desteği: kullanıcı her seçim kombinasyonu için ayrı rapor üretebilir
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- holistic_reports tablosu (çoklu kayıt destekli)
CREATE TABLE IF NOT EXISTS holistic_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  report_text TEXT NOT NULL,
  selected_test_types JSONB DEFAULT '[]'::jsonb,
  test_count INT DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eğer tablo zaten varsa, eksik kolonları ekle (idempotent)
ALTER TABLE holistic_reports ADD COLUMN IF NOT EXISTS selected_test_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE holistic_reports ADD COLUMN IF NOT EXISTS test_count INT DEFAULT 0;
ALTER TABLE holistic_reports ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE holistic_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE holistic_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_holistic_reports_student ON holistic_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_holistic_reports_school ON holistic_reports(school_id);
CREATE INDEX IF NOT EXISTS idx_holistic_reports_generated ON holistic_reports(generated_at DESC);

-- RLS
ALTER TABLE holistic_reports ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (idempotent rerun için)
DROP POLICY IF EXISTS "Teachers can manage holistic reports" ON holistic_reports;
DROP POLICY IF EXISTS "Students can read own holistic reports" ON holistic_reports;
DROP POLICY IF EXISTS "Admins can manage all holistic reports" ON holistic_reports;

CREATE POLICY "Teachers can manage holistic reports"
  ON holistic_reports FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'school_admin', 'admin')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'school_admin', 'admin')
  );

CREATE POLICY "Students can read own holistic reports"
  ON holistic_reports FOR SELECT
  USING (student_id = auth.uid());

-- NOT: API tarafında createAdminClient() (service role) kullanıldığı için
-- RLS bypass edilir; politikalar sadece doğrudan erişim için güvenlik sağlar.
