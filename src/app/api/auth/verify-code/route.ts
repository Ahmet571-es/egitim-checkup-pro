import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyOtpCode } from '@/lib/auth/otp';

/**
 * POST /api/auth/verify-code
 * Body: { email, code }
 *
 * Kayıt akışında e-posta doğrulama kodunu kontrol eder.
 * Deneme sayacı + 5 yanlışta kilitleme (src/lib/auth/otp.ts).
 */

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'E-posta ve kod gerekli.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const verify = await verifyOtpCode(
      supabase,
      String(email).toLowerCase().trim(),
      String(code).trim(),
    );

    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: verify.status });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('[verify-code] error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
