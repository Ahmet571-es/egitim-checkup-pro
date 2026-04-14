-- ============================================================
-- Eğitim Check-Up Pro — test_results.school_id nullable hotfix
-- Tarih: 2026-04-15
--
-- SORUN: Okul kodu olmadan kayıt olan öğrenciler test sonucunu
--   kaydedemiyor. Hata: 23502 - "null value in column \"school_id\"
--   of relation \"test_results\" violates not-null constraint"
--
-- Aynı yaklaşım classes tablosu için 20260414_teacher_class_rls_hotfix
--   içinde uygulandı (school_id DROP NOT NULL).
--
-- ÇÖZÜM: test_results.school_id NOT NULL kısıtlamasını kaldır.
--   FK ve index korunur. school_id'si olan öğrenciler için davranış
--   değişmez; school_id'si NULL olanlar artık kayıt yapabilir.
-- ============================================================

ALTER TABLE test_results ALTER COLUMN school_id DROP NOT NULL;

-- Aynı şekilde, varsa, ilişkili eski raporlar / assignment'larda
--   tutarsızlık olmasın diye index'i koruyoruz (bilgi amaçlı).
-- (idx_test_results_school zaten mevcut, dokunmuyoruz.)

-- PostgREST schema cache'i yenile
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- ÇALIŞTIRMA: Supabase SQL Editor
-- https://supabase.com/dashboard/project/orvrjtcxowdrcdrctgqc/sql/new
--
-- ÖNEMLİ: 20260414_teacher_class_rls_hotfix.sql migration'ı henüz
--   production'a uygulanmadıysa o da çalıştırılmalı. Aksi halde
--   öğretmenler sınıf oluşturamaz.
-- ============================================================
