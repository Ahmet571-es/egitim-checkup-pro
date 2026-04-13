/**
 * Faz 5: POST /api/payment/create
 * Body: { planKey: 'baslangic' | 'profesyonel' | 'kurumsal' }
 * Response: { ok, paymentPageUrl, conversationId }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlan, type PlanKey } from '@/lib/payment/types';
import {
  createCheckoutForm,
  newConversationId,
} from '@/lib/payment/iyzico-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { planKey?: string };
    const planKey = body.planKey as PlanKey | undefined;
    if (!planKey) {
      return NextResponse.json(
        { ok: false, error: 'planKey zorunlu' },
        { status: 400 },
      );
    }

    const plan = getPlan(planKey);
    if (!plan) {
      return NextResponse.json(
        { ok: false, error: 'Geçersiz plan' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Oturum bulunamadı' },
        { status: 401 },
      );
    }

    // Profili + okulu al
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'school_admin' || !profile.school_id) {
      return NextResponse.json(
        { ok: false, error: 'Sadece okul yöneticisi ödeme başlatabilir' },
        { status: 403 },
      );
    }

    const { data: school } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single();
    if (!school) {
      return NextResponse.json(
        { ok: false, error: 'Okul bulunamadı' },
        { status: 404 },
      );
    }

    const conversationId = newConversationId();
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    // DB'ye pending kayıt
    const { error: insErr } = await supabase.from('payments').insert({
      school_id: school.id,
      plan_key: planKey,
      plan_name: plan.name,
      amount: plan.price,
      currency: 'TRY',
      conversation_id: conversationId,
      status: 'pending',
    });
    if (insErr) {
      return NextResponse.json(
        { ok: false, error: 'Ödeme kaydı oluşturulamadı: ' + insErr.message },
        { status: 500 },
      );
    }

    // iyzico (ya da mock) çağrısı
    const [firstName, ...rest] = (profile.full_name || 'Okul Yöneticisi').split(' ');
    const result = await createCheckoutForm({
      conversationId,
      planKey,
      planName: plan.name,
      amount: plan.price,
      buyer: {
        id: user.id,
        name: firstName || 'Okul',
        surname: rest.join(' ') || 'Yöneticisi',
        email: profile.email || user.email || 'admin@egitimcheckup.com',
        phone: profile.phone || '+905350000000',
        schoolId: school.id,
        schoolName: school.name,
        city: school.city || 'Istanbul',
      },
      callbackUrl: `${origin}/api/payment/callback`,
    });

    if (!result.ok) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: result.errorMessage || 'iyzico error',
          raw_response: result.raw || null,
          updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId);
      return NextResponse.json(
        { ok: false, error: result.errorMessage || 'iyzico error' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId,
      paymentPageUrl: result.paymentPageUrl,
      mock: result.mock,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
