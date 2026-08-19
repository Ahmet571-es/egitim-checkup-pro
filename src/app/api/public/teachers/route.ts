/**
 * GET /api/public/teachers
 * Öğrenci kayıt formunda öğretmen seçimi için kullanılır.
 * Sadece onaylı (is_approved=true) öğretmenleri döndürür.
 *
 * Auth gerekmez (kayıt öncesi çağrılır), CSRF muaf değil — middleware'den geçer
 * ama proxy.ts'te /api/public/* CSRF muaf değil, sadece GET kullanıyoruz.
 *
 * ─────────────────────────────────────────────────────────────────────
 * HATA GÖRÜNÜRLÜĞÜ (18 Ağustos 2026 kesintisi sonrası):
 *   Bu route eskiden Supabase hatasını YUTUYORDU:
 *
 *     const { data: profiles } = await admin.from('profiles')...  // error okunmuyor
 *     const users = await listAllAuthUsers(admin);                // hatada [] döner
 *
 *   Sonuç: veritabanı tamamen kapalıyken bile "HTTP 200 + boş liste"
 *   dönüyordu. Kayıt formu "hiç öğretmen yok" gösteriyor, kimse kesintiyi
 *   fark etmiyordu. Kesinti haftalarca sürdü.
 *
 *   Artık ayrım net:
 *     - Gerçekten onaylı öğretmen yoksa  → 200 + boş liste  (doğru)
 *     - Supabase erişilemiyorsa          → 503              (görünür)
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsersStrict } from '@/lib/auth/admin-users';
import { serverError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    // Tüm öğretmen profillerini çek — error ARTIK kontrol ediliyor
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name');

    if (profilesError) {
      return serverError(
        'public/teachers',
        profilesError,
        503,
        'Servise şu anda ulaşılamıyor. Lütfen birazdan tekrar deneyin.',
      );
    }

    // Auth user_metadata'dan branch + school_name + onay durumu
    // Katı sürüm: Supabase kapalıysa boş liste değil, hata fırlatır.
    const users = await listAllAuthUsersStrict(admin);
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
    // Supabase erişilemiyor → 503 (eskiden 500 + teachers:[] idi, kesinti görünmezdi)
    return serverError(
      'public/teachers',
      err,
      503,
      'Servise şu anda ulaşılamıyor. Lütfen birazdan tekrar deneyin.',
    );
  }
}
