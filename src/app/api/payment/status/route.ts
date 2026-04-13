/**
 * Faz 5: GET /api/payment/status?ref=<conversation_id>
 * Çalışan polling için kullanılabilir — aktif okul lisans durumunu döner.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get('ref') || '';
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });
  }

  if (ref) {
    // Kullanıcının okul ID'sini al
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle();

    const { data: payment } = await supabase
      .from('payments')
      .select('id, status, plan_name, amount, created_at, school_id')
      .eq('conversation_id', ref)
      .maybeSingle();

    // Başka okulun ödemesini göremez
    if (payment && userProfile?.school_id && payment.school_id !== userProfile.school_id) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, payment });
  }

  // Mevcut kullanıcı okulu
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single();

  if (!profile?.school_id) {
    return NextResponse.json({ ok: true, license: null });
  }

  const { data: school } = await supabase
    .from('schools')
    .select('id, license_status, license_end_date, max_students')
    .eq('id', profile.school_id)
    .single();

  return NextResponse.json({ ok: true, license: school });
}
