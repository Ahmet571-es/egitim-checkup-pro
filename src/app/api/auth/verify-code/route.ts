import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'E-posta ve kod gerekli.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code.trim())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Kod geçersiz veya süresi dolmuş.' }, { status: 400 });
    }

    // Kodu kullanıldı olarak işaretle
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id);

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('[verify-code] error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
