import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { generateSecureCode, checkCodeCooldown } from '@/lib/auth/otp';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Cooldown: aynı e-posta için 60 sn içinde ikinci kod üretilemez.
    // (E-posta bombardımanı + kod yenileme yoluyla brute-force'a karşı.)
    const cooldown = await checkCodeCooldown(supabase, normalizedEmail, 60);
    if (!cooldown.ok) {
      return NextResponse.json(
        {
          error: `Çok sık kod talep ettiniz. Lütfen ${cooldown.retryAfter} saniye sonra tekrar deneyin.`,
        },
        { status: 429 },
      );
    }

    // 6 haneli KRİPTOGRAFİK GÜVENLİ kod (Math.random YASAK).
    const code = generateSecureCode();

    // Eski kodları sil
    await supabase.from('verification_codes').delete().eq('email', normalizedEmail);

    // Yeni kodu kaydet (10 dk geçerli, attempts=0 varsayılan)
    const { error: insertErr } = await supabase.from('verification_codes').insert({
      email: normalizedEmail,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (insertErr) {
      console.error('[send-code] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Kod oluşturulamadı.' }, { status: 500 });
    }

    // E-posta gönder
    const result = await sendEmail({
      to: normalizedEmail,
      subject: 'Eğitim Check-Up — Doğrulama Kodunuz',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0f2847; margin-bottom: 8px;">Eğitim Check-Up</h2>
          <p style="color: #666; font-size: 14px;">Öğretmen kayıt doğrulama kodunuz:</p>
          <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f2847;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">Bu kod 10 dakika geçerlidir. Kodu kimseyle paylaşmayın.</p>
        </div>
      `,
    });

    if (!result.success) {
      // Güvenlik: kodu response'ta ASLA döndürme. Sadece server log'a yaz.
      console.warn('[send-code] email failed for %s: %s', normalizedEmail, result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'E-posta servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi.' });
  } catch (err) {
    console.error('[send-code] error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
