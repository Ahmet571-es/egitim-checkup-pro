-- ============================================================
-- Eğitim Check-Up Pro — DB-2: FK Referans Düzeltmesi
-- Faz 5-6 tablolarının FK'lerini auth.users'dan profiles'a değiştir
-- Bu scripti Supabase SQL Editor'da çalıştırın.
-- ============================================================

-- NOT: Bu migration mevcut verileri korur.
-- Sadece FK constraint'i değiştirir, veri silinmez.
-- profiles.id zaten auth.users.id ile aynı UUID'dir (trigger ile oluşturuluyor).

-- 1. coaching_tasks
ALTER TABLE coaching_tasks DROP CONSTRAINT IF EXISTS coaching_tasks_student_id_fkey;
ALTER TABLE coaching_tasks ADD CONSTRAINT coaching_tasks_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. coaching_streaks
ALTER TABLE coaching_streaks DROP CONSTRAINT IF EXISTS coaching_streaks_student_id_fkey;
ALTER TABLE coaching_streaks ADD CONSTRAINT coaching_streaks_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. ai_chat_usage
ALTER TABLE ai_chat_usage DROP CONSTRAINT IF EXISTS ai_chat_usage_student_id_fkey;
ALTER TABLE ai_chat_usage ADD CONSTRAINT ai_chat_usage_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. student_badges
ALTER TABLE student_badges DROP CONSTRAINT IF EXISTS student_badges_student_id_fkey;
ALTER TABLE student_badges ADD CONSTRAINT student_badges_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. student_xp
ALTER TABLE student_xp DROP CONSTRAINT IF EXISTS student_xp_student_id_fkey;
ALTER TABLE student_xp ADD CONSTRAINT student_xp_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. student_challenges
ALTER TABLE student_challenges DROP CONSTRAINT IF EXISTS student_challenges_student_id_fkey;
ALTER TABLE student_challenges ADD CONSTRAINT student_challenges_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. audit_logs (user_id nullable)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 8. user_preferences
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 9. guidance_plans (teacher_id)
ALTER TABLE guidance_plans DROP CONSTRAINT IF EXISTS guidance_plans_teacher_id_fkey;
ALTER TABLE guidance_plans ADD CONSTRAINT guidance_plans_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;
