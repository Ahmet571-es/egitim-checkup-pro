-- Eğitim Check-Up Pro: raw_answers sütunu ekleme
-- Öğrencinin her soruya verdiği cevapları (işaretlemeleri) saklar

ALTER TABLE test_results ADD COLUMN IF NOT EXISTS raw_answers JSONB DEFAULT NULL;

COMMENT ON COLUMN test_results.raw_answers IS 'Öğrencinin her soruya verdiği cevaplar — {soruId: cevap} formatında JSON';
