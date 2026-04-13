/**
 * POST /api/admin/create-teacher
 * Body: { full_name, email, password }
 * Auth: school_admin only. Yeni öğretmeni service-role ile yaratır,
 * profili çağıranın school_id'sine bağlar.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { full_name, email, password } = body || {};

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'full_name, email ve password zorunlu.' },
        { status: 400 },
      );
    }
    if (String(password).trim().length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalı.' },
        { status: 400 },
      );
    }

    // Çağıranı doğrula
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
        { error: 'Yalnızca okul yöneticisi öğretmen ekleyebilir.' },
        { status: 403 },
      );
    }

    // Service-role ile öğretmen oluştur
    const admin = createAdminClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'teacher',
        school_id: caller.school_id,
      },
    });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message || 'Öğretmen oluşturulamadı.' },
        { status: 400 },
      );
    }

    // Trigger profili otomatik açar; yine de güncelleme garanti
    await admin
      .from('profiles')
      .update({
        full_name,
        role: 'teacher',
        school_id: caller.school_id,
        is_active: true,
      })
      .eq('id', created.user.id);

    return NextResponse.json({ ok: true, id: created.user.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sunucu hatası.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
