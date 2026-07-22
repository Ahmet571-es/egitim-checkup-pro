import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { generateSecureCode, checkCodeCooldown } from '@/lib/auth/otp';

/**
 * POST /api/auth/password-reset-send
 * Body: { email }
 *
 * Şifre sıfırlama için kriptografik güvenli 6 haneli kod üretir,
 * verification_codes tablosuna yazar, Resend ile e-posta gönderir.
 *
 * Güvenlik:
 * - E-posta sistemde yoksa yine 200 döner (user enumeration'a karşı)
 * - Cooldown: aynı e-posta için 60 sn'de tek kod (brute-force + spam koruması)
 * - Her istek önceki kodu siler; kod 10 dk geçerli
 * - Doğrulama tarafında deneme sayacı + kilitleme (src/lib/auth/otp.ts)
 */

export const runtime = 'nodejs';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = (body.email ?? '').toString().trim().toLowerCase();

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Cooldown — enumeration'ı bozmadan: kod sadece gerçek akışta üretildiği için
    // 429 yalnızca daha önce kod almış (var olan) e-postalarda tetiklenir; bu da
    // "kısa süre önce sıfırlama denedim" bilgisidir, hesap varlığını ifşa etmez.
    const cooldown = await checkCodeCooldown(supabase, email, 60);
    if (!cooldown.ok) {
      return NextResponse.json(
        {
          error: `Çok sık kod talep ettiniz. Lütfen ${cooldown.retryAfter} saniye sonra tekrar deneyin.`,
        },
        { status: 429 },
      );
    }

    // E-posta sistemde mi? Varsa kod gönder, yoksa sessizce "başarılı" de.
    const { data: userList } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const userExists = userList?.users?.some((u) => u.email?.toLowerCase() === email);

    if (!userExists) {
      console.log(`[password-reset-send] ${email} sistemde yok, sessiz ignore.`);
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta kayıtlıysa, kod gönderildi.',
      });
    }

    // 6 haneli KRİPTOGRAFİK GÜVENLİ kod
    const code = generateSecureCode();

    await supabase.from('verification_codes').delete().eq('email', email);

    const { error: insertErr } = await supabase.from('verification_codes').insert({
      email,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (insertErr) {
      console.error('[password-reset-send] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Kod oluşturulamadı.' }, { status: 500 });
    }

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
