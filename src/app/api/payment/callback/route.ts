/**
 * Faz 5: iyzico callback handler
 * Hem GET (mock redirect) hem POST (gerçek iyzico form post) destekler.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlan, type PlanKey } from '@/lib/payment/types';

export const dynamic = 'force-dynamic';

async function handle(
  conversationId: string,
  status: string,
  raw: Record<string, unknown>,
): Promise<NextResponse> {
  const supabase = await createClient();

  const { data: payment, error: selErr } = await supabase
    .from('payments')
    .select('*')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (selErr || !payment) {
    return NextResponse.redirect(
      new URL(`/school/billing?status=not_found`, raw._origin as string),
    );
  }

  const origin = raw._origin as string;
  const successUrl = new URL(
    `/school/billing?status=success&ref=${conversationId}`,
    origin,
  );
  const failUrl = new URL(
    `/school/billing?status=failed&ref=${conversationId}`,
    origin,
  );

  if (status !== 'success') {
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        error_message: 'iyzico returned non-success',
        raw_response: raw,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    return NextResponse.redirect(failUrl);
  }

  // Plan bilgilerini çek
  const plan = getPlan(payment.plan_key as PlanKey);
  if (!plan) {
    return NextResponse.redirect(failUrl);
  }

  // Lisansı aktif et: 1 yıl uzat
  const now = new Date();
  const end = new Date(
    now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
  );

  await supabase
    .from('schools')
    .update({
      license_status: 'active',
      license_end_date: end.toISOString(),
      max_students: plan.maxStudents ?? 999999,
      updated_at: now.toISOString(),
    })
    .eq('id', payment.school_id);

  await supabase.from('licenses').insert({
    school_id: payment.school_id,
    plan_name: plan.name,
    plan_key: plan.key,
    max_students: plan.maxStudents ?? 999999,
    start_date: now.toISOString(),
    end_date: end.toISOString(),
    status: 'active',
    payment_ref: conversationId,
    price: plan.price,
  });

  await supabase
    .from('payments')
    .update({
      status: 'success',
      raw_response: raw,
      updated_at: now.toISOString(),
    })
    .eq('id', payment.id);

  return NextResponse.redirect(successUrl);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get('conversationId') || '';
  const status = url.searchParams.get('status') || 'success';
  const raw: Record<string, unknown> = {
    method: 'GET',
    _origin: url.origin,
  };
  url.searchParams.forEach((v, k) => (raw[k] = v));
  return handle(conversationId, status, raw);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const raw: Record<string, unknown> = { method: 'POST', _origin: url.origin };
  let conversationId = '';
  let status = 'success';
  if (form) {
    form.forEach((v, k) => {
      raw[k] = v.toString();
      if (k === 'conversationId') conversationId = v.toString();
      if (k === 'status') status = v.toString();
    });
  }
  // iyzico bazen token gönderir; conversationId yoksa fallback
  if (!conversationId) {
    conversationId = url.searchParams.get('conversationId') || '';
  }
  return handle(conversationId, status, raw);
}
