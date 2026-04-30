-- ============================================================
-- MIGRATION: Harmanlanmış (Holistic) Rapor ↔ Genetik PDF Ek Bağlantısı (Faz 6)
-- Tarih: 2026-04-30
-- Amaç: Öğretmen, harmanlanmış rapora genetik rapor PDF'lerini sürükle-bırak
--       ile ek olarak bağlayabilsin. Final PDF'te ek sayfa olarak gömülür.
--
-- KVKK m.6 — Genetik veri özel kategori. Bu attachment tablosunda yalnızca
-- bağlantı bilgisi (UUID'ler) tutulur, PDF içeriği genetic_reports tablosunda
-- kalır. Erişim kuralları aynı: öğretmen kendi öğrencisi için bağlantı
-- kurabilir; veli/öğrenci asla erişemez (yetki API'de kontrol edilir).
-- ============================================================

-- ----- 1) holistic_report_attachments tablosu -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'holistic_report_attachments'
  ) THEN
    CREATE TABLE holistic_report_attachments (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      holistic_report_id  UUID NOT NULL REFERENCES holistic_reports(id) ON DELETE CASCADE,
      genetic_report_id   UUID NOT NULL REFERENCES genetic_reports(id) ON DELETE CASCADE,
      section_name        TEXT,        -- opsiyonel: "Mizaç", "Akademik Yatkınlık" vb. — şu an boş
      position            INTEGER NOT NULL DEFAULT 0,    -- sıralama
      attached_by         UUID NOT NULL REFERENCES auth.users(id),
      attached_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      -- Bir rapora aynı genetik PDF iki kez eklenemez
      CONSTRAINT holistic_report_attachments_unique
        UNIQUE (holistic_report_id, genetic_report_id)
    );

    COMMENT ON TABLE holistic_report_attachments IS 'Faz 6: Harmanlanmış rapor ↔ genetik PDF ek bağlantıları';
    COMMENT ON COLUMN holistic_report_attachments.position IS 'Sürükle-bırak ile belirlenen sıra (0 = en üstte)';
  END IF;
END $$;

-- ----- 2) Index'ler -----
CREATE INDEX IF NOT EXISTS idx_holistic_attachments_report
  ON holistic_report_attachments (holistic_report_id, position);

CREATE INDEX IF NOT EXISTS idx_holistic_attachments_genetic
  ON holistic_report_attachments (genetic_report_id);

-- ----- 3) RLS — service_role tam, diğerleri default-deny -----
ALTER TABLE holistic_report_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON holistic_report_attachments;

CREATE POLICY "service_role_full_access"
  ON holistic_report_attachments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- API endpoint'leri yetki kontrolünü merkezi yapar.

-- ============================================================
-- Migration tamamlandı.
--
-- Sonraki adım (Mehmet için): Bu migration'ı Supabase SQL Editor'da
-- çalıştır. "Success. No rows returned" mesajı bekleniyor.
-- Faz 6 API endpoint'leri ve UI bu migration üzerine kuruluyor.
-- ============================================================
