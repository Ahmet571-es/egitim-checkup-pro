import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /api/admin/password-resets
 *
 * Actions:
 *  - list   → bekleyen + çözülmüş talepleri listele
 *  - count  → sadece bekleyen sayısı (sidebar badge için)
 *  - resolve → admin yeni şifre belirler:
 *              auth.users.updateUserById ile şifreyi değiştirir,
 *              talebi 'resolved' olarak işaretler
 *  - cancel → talebi 'cancelled' olarak işaretle (şifre değişmez)
 *
 * Auth: sadece admin veya school_admin
 */

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Yetkisiz.', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'school_admin')) {
    return { error: 'Yalnızca yönetici erişebilir.', status: 403 };
  }
  return { user, role: profile.role };
}

// ─────────── GET (list + count) ───────────
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'list';

  const admin = createAdminClient();

  if (action === 'count') {
    const { count } = await admin
      .from('password_reset_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    return NextResponse.json({ pending_count: count ?? 0 });
  }

  // list (default)
  const status = url.searchParams.get('status') ?? 'pending';

  const { data: requests, error } = await admin
    .from('password_reset_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return serverError('admin/password-resets', error, 500);
  }

  return NextResponse.json({ requests: requests ?? [] });
}

// ─────────── POST (resolve / cancel) ───────────
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    request_id?: string;
    new_password?: string;
    notes?: string;
  };

  const action = body.action;
  const requestId = body.request_id;

  if (!requestId || !action) {
    return NextResponse.json({ error: 'request_id ve action zorunlu.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Talebi getir
  const { data: resetReq } = await admin
    .from('password_reset_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (!resetReq) {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }

  if (resetReq.status !== 'pending') {
    return NextResponse.json({ error: 'Talep zaten işlenmiş.' }, { status: 400 });
  }

  if (action === 'resolve') {
    const newPassword = (body.new_password ?? '').toString();
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalı.' },
        { status: 400 },
      );
    }
    if (newPassword.length > 72) {
      return NextResponse.json({ error: 'Şifre en fazla 72 karakter.' }, { status: 400 });
    }

    if (!resetReq.user_id) {
      return NextResponse.json(
        { error: 'Talebe bağlı kullanıcı yok.' },
        { status: 400 },
      );
    }

    // Şifreyi güncelle
    const { error: updErr } = await admin.auth.admin.updateUserById(resetReq.user_id, {
      password: newPassword,
    });
    if (updErr) {
      return serverError('admin/password-resets', updErr, 400);
    }

    // Talebi resolved işaretle
    const { error: markErr } = await admin
      .from('password_reset_requests')
      .update({
        status: 'resolved',
        resolved_by: auth.user.id,
        resolved_at: new Date().toISOString(),
        notes: (body.notes ?? '').toString().slice(0, 500) || null,
      })
      .eq('id', requestId);

    if (markErr) {
      return serverError('admin/password-resets', markErr, 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Şifre güncellendi. Kullanıcıya yeni şifreyi iletin.',
    });
  }

  if (action === 'cancel') {
    const { error: cancelErr } = await admin
      .from('password_reset_requests')
      .update({
        status: 'cancelled',
        resolved_by: auth.user.id,
        resolved_at: new Date().toISOString(),
        notes: (body.notes ?? '').toString().slice(0, 500) || null,
      })
      .eq('id', requestId);

    if (cancelErr) {
      return serverError('admin/password-resets', cancelErr, 500);
    }

    return NextResponse.json({ success: true, message: 'Talep iptal edildi.' });
  }

  return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 });
}
