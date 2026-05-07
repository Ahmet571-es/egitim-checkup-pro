/**
 * /api/auth/change-password
 *
 * Giriş yapmış kullanıcının şifresini değiştirmesini sağlar.
 * Tipik kullanım: yönetici bir kullanıcıya geçici şifre atar →
 * kullanıcı geçici şifreyle giriş yapar → bu endpoint üzerinden
 * kalıcı şifresini belirler.
 *
 * İşlem:
 *  1. Cookie session ile kullanıcı doğrulanır.
 *  2. Yeni şifre validasyonu yapılır (en az 6 karakter).
 *  3. Admin client ile auth.updateUserById çağrılır:
 *     - password güncellenir
 *     - user_metadata.must_change_password = false
 *  4. Başarı dönüşü.
 *
 * Not: CSRF muafiyeti proxy.ts içinde /api/auth/* için zaten var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }

    let body: { new_password?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
    }

    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';
    // Validasyon
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır.' },
        { status: 400 },
      );
    }
    if (newPassword.length > 100) {
      return NextResponse.json(
        { error: 'Şifre en fazla 100 karakter olabilir.' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Mevcut metadata'yı koru, sadece flag'i kaldır
    const currentMeta = user.user_metadata || {};
    const newMeta = { ...currentMeta };
    delete newMeta.must_change_password;

    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: newMeta,
    });

    if (updErr) {
      console.error('[change-password] update error:', updErr);
      return NextResponse.json(
        { error: 'Şifre güncellenemedi: ' + updErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[change-password] unexpected error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu.', detail: msg },
      { status: 500 },
    );
  }
}
