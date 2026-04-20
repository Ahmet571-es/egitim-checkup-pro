-- ============================================================
-- MIGRATION: integrated_reports ve holistic_reports tablolarına
-- hangi testlerin kullanıldığı bilgisini ekle
-- Tarih: 2026-04-20
-- Amaç: Öğretmen raporu açmadan, hangi testlerin analiz edildiğini görsün.
-- ============================================================

-- ── integrated_reports.source_test_types ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrated_reports' AND column_name = 'source_test_types'
  ) THEN
    ALTER TABLE integrated_reports ADD COLUMN source_test_types TEXT[] DEFAULT NULL;
    COMMENT ON COLUMN integrated_reports.source_test_types IS 'Raporun üretildiği test tiplerinin listesi (örn: ["enneagram","vark","holland"])';
  END IF;
END $$;

-- ── holistic_reports.source_test_types ──────────────────
-- (Harmanlanmış raporda zaten selected_test_types vardır ama farklı isim olabilir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holistic_reports' AND column_name = 'source_test_types'
  ) THEN
    ALTER TABLE holistic_reports ADD COLUMN source_test_types TEXT[] DEFAULT NULL;
    COMMENT ON COLUMN holistic_reports.source_test_types IS 'Raporun üretildiği test tiplerinin listesi';
  END IF;
END $$;

-- ============================================================
-- Notlar:
-- - Mevcut raporlarda bu kolon NULL kalır — UI "bilgi mevcut değil" göstermeli
-- - Yeni üretilen raporlarda otomatik dolar
-- - Array olması, sorguda IN veya ANY() kullanımını kolaylaştırır
-- ============================================================
