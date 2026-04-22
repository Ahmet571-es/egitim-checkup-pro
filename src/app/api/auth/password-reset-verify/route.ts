import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/password-reset-verify
 * Body: { email, code, new_password }
 *
 * Kodu doğrular, geçerliyse kullanıcının şifresini günceller.
 * admin.auth.admin.updateUserById ile Supabase email'i tetiklenmez.
 *
 * Kod bir kere kullanılır (used=true). Yanlış kod tekrarları için
 * frontend rate-limit yapsın (API tarafında ek koruma yok — veri
 * tabanı yavaş bir şey değil ama 1000 istekle brute force 6-haneli
 * kodu kırmak ~3 saat. Bu kod 10 dk sonra expired).
 */

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
      return NextResponse.json(
        { error: 'Yeni şifre en az 8 karakter olmalı.' },
        { status: 400 },
      );
    }
    if (newPassword.length > 72) {
      return NextResponse.json({ error: 'Şifre en fazla 72 karakter.' }, { status: 400 });
    }
    // Basit karmaşıklık kontrolü
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Şifre en az bir harf ve bir rakam içermeli.' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Kodu doğrula
    const { data: record } = await supabase
      .from('verification_codes')
      .select('id, code, expires_at, used')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json(
        { error: 'Kod bulunamadı. Yeni bir kod talep edin.' },
        { status: 404 },
      );
    }
    if (record.used) {
      return NextResponse.json(
        { error: 'Bu kod daha önce kullanılmış. Yeni bir kod talep edin.' },
        { status: 400 },
      );
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Kodun süresi doldu. Yeni bir kod talep edin.' },
        { status: 400 },
      );
    }
    if (record.code !== code) {
      return NextResponse.json({ error: 'Kod hatalı.' }, { status: 400 });
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
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateErr) {
      console.error('[password-reset-verify] update error:', updateErr.message);
      return NextResponse.json({ error: 'Şifre güncellenemedi.' }, { status: 500 });
    }

    // Kodu işaretle (used)
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', record.id);

    return NextResponse.json({
      success: true,
      message: 'Şifreniz güncellendi. Artık giriş yapabilirsiniz.',
    });
  } catch (err) {
    console.error('[password-reset-verify] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
