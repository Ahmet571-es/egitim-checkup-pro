-- ============================================================
-- MIGRATION: Paket Bazlı Bütüncül Raporlar (Faz 9)
-- Tarih: 2026-04-30
-- Amaç: 5 paket × 3 versiyon (öğretmen/veli/öğrenci) rapor sistemi.
--
-- holistic_reports tablosuna 2 yeni kolon eklenir:
--   • audience: 'teacher' | 'parent' | 'student'  (KVKK matrisi)
--   • package_type: 'potansiyel-mizac' | 'akademik-performans' | ...
--
-- KVKK matrisi:
--   • teacher versiyon: tam veri + genetik PDF gömülür (Faz 6 pdf-merger)
--   • parent versiyon: skorlar VAR, ham cevap YOK, genetik PDF GÖMÜLMEZ
--   • student versiyon: skor YOK, etiketleme YOK, "henüz" çerçevesi,
--                       genetik PDF GÖMÜLMEZ
-- ============================================================

-- ----- 1) audience kolonu (idempotent) -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holistic_reports' AND column_name = 'audience'
  ) THEN
    ALTER TABLE holistic_reports
      ADD COLUMN audience TEXT
      CHECK (audience IS NULL OR audience IN ('teacher', 'parent', 'student'));

    COMMENT ON COLUMN holistic_reports.audience IS 'Faz 9: rapor kim için (teacher/parent/student) — NULL ise eski Faz 6 raporu';
  END IF;
END $$;

-- ----- 2) package_type kolonu (idempotent) -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holistic_reports' AND column_name = 'package_type'
  ) THEN
    ALTER TABLE holistic_reports ADD COLUMN package_type TEXT;
    COMMENT ON COLUMN holistic_reports.package_type IS 'Faz 9: 5 paketten biri (potansiyel-mizac, akademik-performans, sinav-strateji, kariyer-gelecek, vip)';
  END IF;
END $$;

-- ----- 3) Index — paket bazlı sorgular için -----
CREATE INDEX IF NOT EXISTS idx_holistic_reports_audience_package
  ON holistic_reports (student_id, package_type, audience)
  WHERE package_type IS NOT NULL;

-- ----- 4) RLS — service_role tam erişim (mevcut policy korunur) -----
-- holistic_reports tablosu mevcut Faz 6 sisteminde RLS'li. Yeni kolonlar
-- aynı policy'nin altına düşer. Yetki kontrolü API endpoint'inde merkezi.

-- ============================================================
-- Migration tamamlandı.
-- ============================================================
