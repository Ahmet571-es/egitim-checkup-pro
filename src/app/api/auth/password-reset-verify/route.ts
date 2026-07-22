import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyOtpCode } from '@/lib/auth/otp';

/**
 * POST /api/auth/password-reset-verify
 * Body: { email, code, new_password }
 *
 * Kodu doğrular (deneme sayacı + 5 yanlışta kilitleme — src/lib/auth/otp.ts),
 * geçerliyse kullanıcının şifresini günceller.
 * admin.auth.admin.updateUserById ile Supabase e-postası tetiklenmez.
 */

export const runtime = 'nodejs';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      code?: string;
      new_password?: string;
    };

    const email = (body.email ?? '').toString().trim().toLowerCase();
    const code = (body.code ?? '').toString().trim();
    const newPassword = (body.new_password ?? '').toString();

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: '6 haneli doğrulama kodunu girin.' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı.' }, { status: 400 });
    }
    if (newPassword.length > 72) {
      return NextResponse.json({ error: 'Şifre en fazla 72 karakter.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Şifre en az bir harf ve bir rakam içermeli.' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Kodu doğrula — deneme sayacı + kilitleme burada devreye girer.
    const verify = await verifyOtpCode(supabase, email, code);
    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: verify.status });
    }

    // Kullanıcıyı bul
    const { data: userList } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const user = userList?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Şifreyi güncelle
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) {
      console.error('[password-reset-verify] update error:', updateErr.message);
      return NextResponse.json({ error: 'Şifre güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Şifreniz güncellendi. Artık giriş yapabilirsiniz.',
    });
  } catch (err) {
    console.error('[password-reset-verify] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
