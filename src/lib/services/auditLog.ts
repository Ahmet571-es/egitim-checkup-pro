/**
 * Faz 7: Audit Log & Güvenlik Servisi
 */

import { createClient } from '@/lib/supabase/client';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Audit log kaydet */
export async function logAudit(params: {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || null,
    });
  } catch (err) {
    console.error('Audit log kaydedilemedi:', err);
  }
}

/** Audit logları getir (admin) */
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const supabase = createClient();
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 100);

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.resourceType) query = query.eq('resource_type', filters.resourceType);
  if (filters?.startDate) query = query.gte('created_at', filters.startDate);
  if (filters?.endDate) query = query.lte('created_at', filters.endDate);

  const { data } = await query;
  return data || [];
}

/** Veri anonimleştirme (araştırma modu) */
export function anonymizeData(
  data: Record<string, unknown>[],
  fieldsToAnonymize: string[]
): Record<string, unknown>[] {
  return data.map((item, index) => {
    const anonymized = { ...item };
    for (const field of fieldsToAnonymize) {
      if (field in anonymized) {
        anonymized[field] = `ANON_${index + 1}`;
      }
    }
    return anonymized;
  });
}

/** KVKK: Öğrenci verilerini tamamen sil */
export async function deleteStudentData(studentId: string): Promise<{ success: boolean; deletedTables: string[] }> {
  const supabase = createClient();
  const deletedTables: string[] = [];

  const tables = [
    'coaching_tasks', 'coaching_streaks', 'ai_chat_usage',
    'student_badges', 'student_xp', 'student_challenges',
    'test_results', 'student_test_history',
    'parent_teacher_notes', 'notification_preferences',
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('student_id', studentId);

    if (!error) deletedTables.push(table);
  }

  // Audit log
  await logAudit({
    action: 'KVKK_DATA_DELETE',
    resourceType: 'student',
    resourceId: studentId,
    details: { deletedTables },
  });

  return { success: true, deletedTables };
}
