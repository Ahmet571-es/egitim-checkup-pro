/**
 * Faz 5: Yeni okul için 14 günlük trial başlatma
 */
import { createClient } from '@/lib/supabase/server';

const TRIAL_DAYS = 14;
const TRIAL_MAX_STUDENTS = 50;

export async function initTrial(schoolId: string): Promise<{ ok: boolean; error?: string }> {
  if (!schoolId) return { ok: false, error: 'schoolId missing' };
  const supabase = await createClient();

  const now = new Date();
  const end = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // 1) schools üzerinde trial alanlarını güncelle
  const { error: e1 } = await supabase
    .from('schools')
    .update({
      license_status: 'trial',
      license_end_date: end.toISOString(),
      max_students: TRIAL_MAX_STUDENTS,
      updated_at: now.toISOString(),
    })
    .eq('id', schoolId);

  if (e1) return { ok: false, error: e1.message };

  // 2) licenses tablosuna trial satırı (tetikleyici zaten ekliyor olabilir;
  //    yine de yoksa idempotent insert)
  const { data: existing } = await supabase
    .from('licenses')
    .select('id')
    .eq('school_id', schoolId)
    .eq('status', 'trial')
    .maybeSingle();

  if (!existing) {
    await supabase.from('licenses').insert({
      school_id: schoolId,
      plan_name: 'Deneme',
      plan_key: 'trial',
      max_students: TRIAL_MAX_STUDENTS,
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      status: 'trial',
      price: 0,
    });
  }

  return { ok: true };
}
