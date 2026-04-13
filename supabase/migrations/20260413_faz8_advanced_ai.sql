-- ============================================================
-- Eğitim Check-Up Pro — Faz 8: İleri AI & İş Modeli
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. WHITE-LABEL: Okul markalama
CREATE TABLE IF NOT EXISTS school_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#7c3aed',
  secondary_color TEXT NOT NULL DEFAULT '#0f2847',
  school_display_name TEXT,
  custom_footer TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Okul yöneticisi kendi markalamasını yönetir" ON school_branding
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = school_branding.school_id AND role IN ('admin', 'school_admin'))
  );

CREATE POLICY "Okul üyeleri markayı görebilir" ON school_branding
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = school_branding.school_id)
  );

-- 2. GUIDANCE_PLANS: Rehberlik planları
CREATE TABLE IF NOT EXISTS guidance_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  plan_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guidance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğretmen kendi planlarını yönetir" ON guidance_plans
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Yönetici tüm planları görebilir" ON guidance_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'school_admin'))
  );
