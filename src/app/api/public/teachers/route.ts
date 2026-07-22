/**
 * GET /api/public/teachers
 * Öğrenci kayıt formunda öğretmen seçimi için kullanılır.
 * Sadece onaylı (is_approved=true) öğretmenleri döndürür.
 *
 * Auth gerekmez (kayıt öncesi çağrılır), CSRF muaf değil — middleware'den geçer
 * ama proxy.ts'te /api/public/* CSRF muaf değil, sadece GET kullanıyoruz.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/auth/admin-users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    // Tüm öğretmen profillerini çek
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name');

    // Auth user_metadata'dan branch + school_name + onay durumu
    const users = await listAllAuthUsers(admin);
    const metaMap = new Map<string, Record<string, unknown>>();
    (users || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

    const teachers = (profiles || [])
      .map((p) => {
        const meta = metaMap.get(p.id) || {};
        const isApproved = meta.is_approved !== false; // default true (eski kayıtlar)
        return {
          id: p.id,
          full_name: p.full_name,
          branch: (meta.branch as string) || '',
          school_name: (meta.school_name as string) || '',
          is_approved: isApproved,
        };
      })
      // Sadece onaylı öğretmenler
      .filter((t) => t.is_approved);

    return NextResponse.json({ teachers });
  } catch (err) {
    console.error('[public/teachers]', err);
    return NextResponse.json({ error: 'Sunucu hatası', teachers: [] }, { status: 500 });
  }
}
