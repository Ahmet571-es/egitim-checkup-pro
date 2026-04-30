-- ============================================================
-- MIGRATION: AI Koç Sohbet Sistemi (Faz 8)
-- Tarih: 2026-04-30
-- Amaç: 3 farklı AI koç (öğrenci/veli/öğretmen) için sohbet geçmişi
--       saklamak. KVKK matrisli + kriz sinyali güvenlik flag'i.
--
-- KVKK matrisi (yetki API endpoint'inde merkezi):
--   • student → kendi sohbetleri (kendi rolü için)
--   • parent  → kendi sohbetleri (kendi çocukları hakkında)
--   • teacher → kendi sohbetleri (kendi öğrencileri hakkında)
--   • admin   → hepsi
--
-- Güvenlik: flagged_safety = true olan mesajlar yöneticilere görünür.
-- ============================================================

-- ----- 1) coach_conversations -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'coach_conversations'
  ) THEN
    CREATE TABLE coach_conversations (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      user_role       TEXT NOT NULL CHECK (user_role IN ('student', 'parent', 'teacher', 'admin', 'school_admin')),
      student_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
      title           TEXT,                          -- "İlk Sohbet" gibi opsiyonel
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_archived     BOOLEAN NOT NULL DEFAULT false,
      message_count   INTEGER NOT NULL DEFAULT 0
    );

    COMMENT ON TABLE coach_conversations IS 'Faz 8: AI Koç sohbet oturumları, role bazlı';
    COMMENT ON COLUMN coach_conversations.student_id IS 'Sohbetin kim hakkında olduğu (parent/teacher modunda gerekli)';
  END IF;
END $$;

-- ----- 2) coach_messages -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'coach_messages'
  ) THEN
    CREATE TABLE coach_messages (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
      role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content         TEXT NOT NULL,
      tokens_used     INTEGER,
      flagged_safety  BOOLEAN NOT NULL DEFAULT false,
      flag_reason     TEXT,                           -- hangi kriz pattern'i tetikledi
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    COMMENT ON TABLE coach_messages IS 'Faz 8: Sohbet mesajları (user + assistant)';
    COMMENT ON COLUMN coach_messages.flagged_safety IS 'Kriz sinyali tespit edildiyse true';
  END IF;
END $$;

-- ----- 3) Index'ler -----
CREATE INDEX IF NOT EXISTS idx_coach_conv_user
  ON coach_conversations (user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_conv_student
  ON coach_conversations (student_id) WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coach_msg_conv
  ON coach_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_coach_msg_flagged
  ON coach_messages (flagged_safety, created_at DESC) WHERE flagged_safety = true;

-- ----- 4) RLS — service_role only -----
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON coach_conversations;
DROP POLICY IF EXISTS "service_role_full_access" ON coach_messages;

CREATE POLICY "service_role_full_access"
  ON coach_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access"
  ON coach_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- Migration tamamlandı.
-- ============================================================
