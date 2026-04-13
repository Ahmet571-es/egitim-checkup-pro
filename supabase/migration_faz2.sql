-- ============================================================
-- Eğitim Check-Up Pro — Faz 2: Supabase Tablo & RLS
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'school_admin', 'teacher', 'student', 'parent');
CREATE TYPE license_status AS ENUM ('trial', 'active', 'expired');

-- 2. SCHOOLS
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  license_status license_status DEFAULT 'trial',
  license_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  max_students INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  phone TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASSES
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade INT,
  section TEXT DEFAULT '',
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- 5. CLASS_STUDENTS (many-to-many)
CREATE TABLE class_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- 6. PARENT_STUDENTS (many-to-many)
CREATE TABLE parent_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- 7. TEST_ASSIGNMENTS
CREATE TABLE test_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TEST_RESULTS
CREATE TABLE test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  assignment_id UUID REFERENCES test_assignments(id) ON DELETE SET NULL,
  raw_answers JSONB DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  ai_report TEXT,
  ai_report_generated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LICENSES (payment tracking — Faz 5'te genişletilecek)
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'Başlangıç',
  max_students INT DEFAULT 50,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  status license_status DEFAULT 'trial',
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_class_students_class ON class_students(class_id);
CREATE INDEX idx_class_students_student ON class_students(student_id);
CREATE INDEX idx_test_assignments_school ON test_assignments(school_id);
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_school ON test_results(school_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, school_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    CASE
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL
        THEN (NEW.raw_user_meta_data->>'school_id')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "School admin can manage school profiles"
  ON profiles FOR ALL
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

CREATE POLICY "Teachers can read school profiles"
  ON profiles FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

CREATE POLICY "Parents can read own children profiles"
  ON profiles FOR SELECT
  USING (
    id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- SCHOOLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on schools"
  ON schools FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School members can read own school"
  ON schools FOR SELECT
  USING (
    id = (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

-- CLASSES
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on classes"
  ON classes FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin can manage classes"
  ON classes FOR ALL
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

CREATE POLICY "Teachers can read own school classes"
  ON classes FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

-- CLASS_STUDENTS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on class_students"
  ON class_students FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin can manage class_students"
  ON class_students FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

CREATE POLICY "Teachers can read class_students"
  ON class_students FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

-- PARENT_STUDENTS
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on parent_students"
  ON parent_students FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin can manage parent_students"
  ON parent_students FOR ALL
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

CREATE POLICY "Parents can read own links"
  ON parent_students FOR SELECT
  USING (parent_id = auth.uid());

-- TEST_ASSIGNMENTS
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on test_assignments"
  ON test_assignments FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin/teacher can manage test_assignments"
  ON test_assignments FOR ALL
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('school_admin', 'teacher')
  );

CREATE POLICY "Students can read own test_assignments"
  ON test_assignments FOR SELECT
  USING (student_id = auth.uid());

-- TEST_RESULTS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on test_results"
  ON test_results FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin/teacher can read school test_results"
  ON test_results FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('school_admin', 'teacher')
  );

CREATE POLICY "Students can manage own test_results"
  ON test_results FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read children test_results"
  ON test_results FOR SELECT
  USING (
    student_id IN (SELECT student_id FROM parent_students WHERE parent_id = auth.uid())
  );

-- LICENSES
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on licenses"
  ON licenses FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "School admin can read own licenses"
  ON licenses FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

-- ============================================================
-- SEED: Admin user (Supabase Auth'da admin kullanıcı oluşturun,
-- sonra bu UPDATE'i çalıştırarak rolünü admin yapın)
-- ============================================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
