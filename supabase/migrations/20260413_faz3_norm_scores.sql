-- FAZ 3: Norm tablosu
CREATE TABLE IF NOT EXISTS norm_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL,
  grade TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'all',
  percentile_25 NUMERIC NOT NULL DEFAULT 0,
  percentile_50 NUMERIC NOT NULL DEFAULT 0,
  percentile_75 NUMERIC NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(test_type, grade, gender)
);

-- RLS
ALTER TABLE norm_scores ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (norm verileri genel)
CREATE POLICY "norm_scores_select" ON norm_scores
  FOR SELECT USING (true);

-- Sadece admin yazabilir
CREATE POLICY "norm_scores_insert" ON norm_scores
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "norm_scores_update" ON norm_scores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_norm_scores_lookup
  ON norm_scores (test_type, grade, gender);
