-- ==============================================================
-- Phase C migration:
--   1. profiles.grade + profiles.is_graduated columns (Mezun)
--   2. handle_new_user() reads grade / is_graduated from metadata
--   3. Tightened teacher RLS (own classes / students / results only)
-- ==============================================================
-- Idempotent: safe to re-run.

-- ----- 1A. Schema additions ------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN profiles.grade IS 'Student grade level: ''1''..''12'' or ''mezun''';
COMMENT ON COLUMN profiles.is_graduated IS 'TRUE if student is a graduate (mezun)';

-- ----- 1B. Updated handle_new_user trigger ---------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, school_id, grade, is_graduated)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    CASE
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL
        AND NEW.raw_user_meta_data->>'school_id' <> ''
        THEN (NEW.raw_user_meta_data->>'school_id')::UUID
      ELSE NULL
    END,
    NULLIF(NEW.raw_user_meta_data->>'grade', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_graduated')::BOOLEAN, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- 1C. Tighten teacher RLS ---------------------------------

-- classes: teachers see only the classes they own
DROP POLICY IF EXISTS "Teachers can read own school classes" ON classes;
DROP POLICY IF EXISTS "Teachers can read own assigned classes" ON classes;
CREATE POLICY "Teachers can read own assigned classes" ON classes
  FOR SELECT
  USING (
    teacher_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

-- class_students: teachers see only memberships of their classes
DROP POLICY IF EXISTS "Teachers can read class_students" ON class_students;
DROP POLICY IF EXISTS "Teachers can read own class_students" ON class_students;
CREATE POLICY "Teachers can read own class_students" ON class_students
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- test_results: split the old combined school_admin+teacher policy
DROP POLICY IF EXISTS "School admin/teacher can read school test_results" ON test_results;
DROP POLICY IF EXISTS "School admin can read school test_results" ON test_results;
DROP POLICY IF EXISTS "Teachers can read own students test_results" ON test_results;

CREATE POLICY "School admin can read school test_results" ON test_results
  FOR SELECT
  USING (
    school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'school_admin'
  );

CREATE POLICY "Teachers can read own students test_results" ON test_results
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    AND student_id IN (
      SELECT student_id FROM class_students
      WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    )
  );

-- ----- Sanity ---------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Phase C migration complete'; END $$;
