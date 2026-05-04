import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/password-reset-request
 * Body: { email }
 *
 * Manuel şifre sıfırlama talebi oluşturur.
 * Kullanıcı "Şifremi unuttum" butonuna basar → bu endpoint çağrılır →
 * password_reset_requests tablosuna yeni satır düşer →
 * yönetici /admin/password-resets sayfasından görür → şifre değiştirir.
 *
 * Public endpoint (auth gerekmez). User enumeration koruması:
 * email sistemde olmasa bile success döner.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = (body.email ?? '').toString().trim().toLowerCase();

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Email sistemde mi? Varsa user_id ve profil bilgilerini al, yoksa sessizce başarı dön
    const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const matchedUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!matchedUser) {
      // Sessiz başarı — user enumeration'a karşı koruma
      console.log(`[password-reset-request] ${email} sistemde yok, sessiz başarı.`);
      return NextResponse.json({
        success: true,
        message: 'Talebiniz alındı. Yönetici şifrenizi sıfırladıktan sonra size iletecektir.',
      });
    }

    // Profil bilgilerini al
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', matchedUser.id)
      .maybeSingle();

    // Aynı kullanıcının zaten bekleyen talebi varsa duplicate yapma
    const { data: existing } = await admin
      .from('password_reset_requests')
      .select('id, created_at')
      .eq('user_id', matchedUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Zaten bekleyen talep var — yine başarı dön (kullanıcı çok bastı diye duplicate üretme)
      return NextResponse.json({
        success: true,
        message: 'Talebiniz zaten alındı. Yönetici en kısa sürede sizinle iletişime geçecektir.',
      });
    }

    // Yeni talep oluştur
    const { error: insertErr } = await admin
      .from('password_reset_requests')
      .insert({
        user_id: matchedUser.id,
        email,
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? null,
        status: 'pending',
      });

    if (insertErr) {
      console.error('[password-reset-request] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Talep oluşturulamadı.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Talebiniz alındı. Yönetici şifrenizi sıfırladıktan sonra size iletecektir.',
    });
  } catch (err) {
    console.error('[password-reset-request] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
