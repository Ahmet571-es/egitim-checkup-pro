/**
 * POST /api/admin/reset-teacher-password
 * Body: { teacher_id, password }
 * Auth: school_admin only. Yalnızca kendi okulundaki öğretmenler için.
 */
import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { teacher_id, password } = body || {};

    if (!teacher_id || !password) {
      return NextResponse.json(
        { error: 'teacher_id ve password zorunlu.' },
        { status: 400 },
      );
    }
    if (String(password).trim().length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalı.' },
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
        { error: 'Yalnızca okul yöneticisi şifre sıfırlayabilir.' },
        { status: 403 },
      );
    }

    const admin = createAdminClient();

    // Hedef öğretmenin aynı okulda olduğunu doğrula
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
      return NextResponse.json(
        { error: 'Geçersiz öğretmen.' },
        { status: 403 },
      );
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(teacher_id, {
      password,
    });
    if (updErr) {
      return serverError('admin/reset-teacher-password', updErr, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return serverError('admin/reset-teacher-password', e);
  }
}
