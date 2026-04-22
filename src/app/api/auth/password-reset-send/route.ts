import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';

/**
 * POST /api/auth/password-reset-send
 * Body: { email }
 *
 * Şifre sıfırlama için 6 haneli kod üretir, verification_codes
 * tablosuna yazar, Resend ile email gönderir. Supabase built-in
 * email servisine dokunmaz (rate limit yok).
 *
 * Güvenlik:
 * - Email sistemde yoksa yine 200 döner (user enumeration'a
 *   karşı koruma) — kod gönderilmez ama cevap aynı görünür
 * - Her istek önceki kodu siler (aynı email için)
 * - Kod 10 dk geçerli
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = (body.email ?? '').toString().trim().toLowerCase();

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Email sistemde mi? Varsa kod gönder, yoksa sessizce "başarılı" de.
    // User enumeration'a karşı tek tip cevap.
    const { data: userList } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // pratik: okul başına 1000 altı
    });
    const userExists = userList?.users?.some(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!userExists) {
      // Sessiz başarı — aynı response
      console.log(`[password-reset-send] ${email} sistemde yok, sessiz ignore.`);
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta kayıtlıysa, kod gönderildi.',
      });
    }

    // 6 haneli kod üret
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Eski kodları sil (register-verify ile çakışmasın)
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email);

    const { error: insertErr } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertErr) {
      console.error('[password-reset-send] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Kod oluşturulamadı.' }, { status: 500 });
    }

    // Resend ile gönder
    await sendEmail({
      to: email,
      subject: 'Eğitim Check-Up — Şifre Sıfırlama Kodu',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0f2847; margin-bottom: 8px;">Eğitim Check-Up</h2>
          <p style="color: #666; font-size: 14px;">Şifre sıfırlama kodunuz:</p>
          <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f2847;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">Bu kod 10 dakika geçerlidir. Kodu kimseyle paylaşmayın.</p>
          <p style="color: #999; font-size: 12px; margin-top: 16px;">
            Eğer şifre sıfırlama talebini siz göndermediyseniz, bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Eğer bu e-posta kayıtlıysa, kod gönderildi.',
    });
  } catch (err) {
    console.error('[password-reset-send] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
