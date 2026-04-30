-- ============================================================
-- MIGRATION: Genetik Rapor Yükleme Sistemi (Faz 5)
-- Tarih: 2026-04-30
-- Amaç: Rus ekipten gelen genetik rapor PDF'lerini sisteme kaydet.
--
-- KVKK Uyumluluğu (kritik):
--   • Genetik veri 6698 sayılı KVKK madde 6 kapsamında ÖZEL NİTELİKLİ
--     KİŞİSEL VERİ. Sıkı koruma gerekir.
--   • Erişim matrisi:
--     - admin (sistem yöneticisi)         → görüntüleme + yükleme + silme
--     - school_admin (okul yöneticisi)    → görüntüleme + yükleme + silme (kendi okuluna)
--     - teacher (öğretmen)                 → görüntüleme + indirme (kendi öğrencileri)
--     - student (öğrenci)                  → ASLA HİÇBİR ŞEY — kendi raporunu dahi göremez
--     - parent (veli)                      → ASLA HİÇBİR ŞEY — çocuğunun raporunu göremez
--   • Yetki kontrolü API endpoint'lerinde merkezi (mevcut kodbase pattern'i).
--   • Storage bucket private (public access yok), erişim signed URL ile.
-- ============================================================

-- ----- 1) genetic_reports tablosu (idempotent) -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'genetic_reports'
  ) THEN
    CREATE TABLE genetic_reports (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      file_path       TEXT NOT NULL UNIQUE,
      original_filename TEXT NOT NULL,
      file_size       BIGINT NOT NULL,
      mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
      uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
      uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes           TEXT,

      CONSTRAINT genetic_reports_file_size_positive CHECK (file_size > 0),
      CONSTRAINT genetic_reports_file_size_max CHECK (file_size <= 10485760)  -- 10 MB
    );

    COMMENT ON TABLE genetic_reports IS 'KVKK m.6 özel nitelikli kişisel veri. Erişim sıkı kontrollü.';
    COMMENT ON COLUMN genetic_reports.file_path IS 'Supabase Storage genetic-reports bucket içindeki path';
    COMMENT ON COLUMN genetic_reports.uploaded_by IS 'Yükleyen kullanıcı (admin veya school_admin)';
  END IF;
END $$;

-- ----- 2) Index'ler -----
CREATE INDEX IF NOT EXISTS idx_genetic_reports_student_id
  ON genetic_reports (student_id);

CREATE INDEX IF NOT EXISTS idx_genetic_reports_uploaded_at
  ON genetic_reports (uploaded_at DESC);

-- ----- 3) RLS — sadece servis rolü için tam erişim, diğerleri tamamen kapalı -----
-- Yetki kontrolü API endpoint'lerinde merkezi. Hiçbir client doğrudan bu
-- tabloyu okuyamaz/yazamaz — hep API üzerinden gider.
ALTER TABLE genetic_reports ENABLE ROW LEVEL SECURITY;

-- Mevcut tüm politikaları kaldır (idempotent re-run için)
DROP POLICY IF EXISTS "deny_all_to_anon" ON genetic_reports;
DROP POLICY IF EXISTS "deny_all_to_authenticated" ON genetic_reports;
DROP POLICY IF EXISTS "service_role_full_access" ON genetic_reports;

-- Service role (server-side admin client) tam erişim
CREATE POLICY "service_role_full_access"
  ON genetic_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon ve authenticated rollerine erişim verilmez (API üzerinden gidecekler).
-- Default-deny RLS davranışı uygulanır (ENABLE RLS + policy yok = deny all).

-- ----- 4) Storage bucket: genetic-reports (private) -----
-- Bucket private. Erişim sadece signed URL ile (API endpoint'inden üretilir).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'genetic-reports',
  'genetic-reports',
  false,
  10485760,                               -- 10 MB max
  ARRAY['application/pdf']                -- sadece PDF
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- ----- 5) Storage bucket policy'leri — sadece service role -----
-- Anon ve authenticated rollere bucket erişimi yok. Tüm upload/download
-- işlemleri server-side (admin client) üzerinden yapılır. API endpoint'i
-- yetki kontrolünden sonra signed URL üretir.

DROP POLICY IF EXISTS "genetic_reports_service_role_select" ON storage.objects;
DROP POLICY IF EXISTS "genetic_reports_service_role_insert" ON storage.objects;
DROP POLICY IF EXISTS "genetic_reports_service_role_update" ON storage.objects;
DROP POLICY IF EXISTS "genetic_reports_service_role_delete" ON storage.objects;

CREATE POLICY "genetic_reports_service_role_select"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'genetic-reports');

CREATE POLICY "genetic_reports_service_role_insert"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'genetic-reports');

CREATE POLICY "genetic_reports_service_role_update"
  ON storage.objects
  FOR UPDATE
  TO service_role
  USING (bucket_id = 'genetic-reports');

CREATE POLICY "genetic_reports_service_role_delete"
  ON storage.objects
  FOR DELETE
  TO service_role
  USING (bucket_id = 'genetic-reports');

-- ============================================================
-- Migration tamamlandı.
--
-- Sonraki adım (Mehmet için): Bu migration'ı Supabase SQL Editor'da
-- çalıştır. "Success. No rows returned" mesajı bekleniyor.
-- API endpoint'leri ve UI bu migration üzerine kuruluyor.
-- ============================================================
