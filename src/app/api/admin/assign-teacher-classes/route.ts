/**
 * POST /api/admin/assign-teacher-classes
 * Body: { teacher_id, class_ids: string[] }
 * Auth: school_admin only.
 * Önce öğretmenin tüm atamalarını temizler, sonra verilen sınıfları atar.
 * Sadece çağıranın okulundaki sınıflar etkilenir.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { teacher_id } = body || {};
    const classIds: string[] = Array.isArray(body?.class_ids) ? body.class_ids : [];

    if (!teacher_id) {
      return NextResponse.json(
        { error: 'teacher_id zorunlu.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }
    const { data: caller } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();
    if (!caller || caller.role !== 'school_admin' || !caller.school_id) {
      return NextResponse.json(
        { error: 'Yalnızca okul yöneticisi sınıf atayabilir.' },
        { status: 403 },
      );
    }

    const admin = createAdminClient();

    // Hedef öğretmen aynı okulda mı?
    const { data: target } = await admin
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', teacher_id)
      .single();
    if (
      !target ||
      target.role !== 'teacher' ||
      target.school_id !== caller.school_id
    ) {
      return NextResponse.json({ error: 'Geçersiz öğretmen.' }, { status: 403 });
    }

    // 1) Öğretmenin tüm mevcut atamalarını temizle (yalnız bu okul içinde)
    const { error: clearErr } = await admin
      .from('classes')
      .update({ teacher_id: null })
      .eq('teacher_id', teacher_id)
      .eq('school_id', caller.school_id);
    if (clearErr) {
      return NextResponse.json({ error: clearErr.message }, { status: 400 });
    }

    // 2) Yeni atamaları yap (yalnız çağıranın okulundaki sınıflar)
    if (classIds.length > 0) {
      const { error: assignErr } = await admin
        .from('classes')
        .update({ teacher_id })
        .in('id', classIds)
        .eq('school_id', caller.school_id);
      if (assignErr) {
        return NextResponse.json({ error: assignErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, count: classIds.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sunucu hatası.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
