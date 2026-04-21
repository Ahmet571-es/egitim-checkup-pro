import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/parent/link-child
 * Body: { student_code: string }
 *
 * Authenticated parent → doğrular → öğrenci kodunu admin client ile lookup
 * eder (RLS bypass, diğer okul öğrencileri de bulunabilsin diye) →
 * parent_students'a insert.
 *
 * Güvenlik:
 * - Sadece role='parent' olan kullanıcılar çağırabilir
 * - Kod 6 karakter ve tek bir öğrenciyle eşleşmeli
 * - Zaten bağlıysa idempotent: aynı student_id'yi iki kez eklemez (UNIQUE)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    // Role doğrulama — server otoriteli (user_metadata'ya güvenme)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'parent') {
      return NextResponse.json(
        { error: 'Bu işlem sadece veli hesapları içindir.' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { student_code?: string };
    const code = (body.student_code ?? '').toString().trim().toUpperCase();

    if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
      return NextResponse.json(
        { error: 'Geçerli bir 6 haneli öğrenci kodu girin (büyük harf/sayı).' },
        { status: 400 },
      );
    }

    // Admin client: herkes kendi okulu dışı öğrencileri RLS ile göremeyebilir,
    // ama kod eşleştirmesi tüm okullar için çalışmalı.
    const admin = createAdminClient();
    const { data: student, error: studentErr } = await admin
      .from('profiles')
      .select('id, full_name, email, role, student_code')
      .eq('student_code', code)
      .eq('role', 'student')
      .maybeSingle();

    if (studentErr) {
      console.error('[parent/link-child] lookup error:', studentErr.message);
      return NextResponse.json({ error: 'Arama sırasında hata oluştu.' }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Bu koda sahip bir öğrenci bulunamadı. Lütfen kodu tekrar kontrol edin.' },
        { status: 404 },
      );
    }

    // Zaten bağlı mı?
    const { data: existing } = await admin
      .from('parent_students')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', student.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `${student.full_name} zaten listenizde.`, full_name: student.full_name },
        { status: 409 },
      );
    }

    const { error: insertErr } = await admin
      .from('parent_students')
      .insert({ parent_id: user.id, student_id: student.id });

    if (insertErr) {
      console.error('[parent/link-child] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Bağlantı kurulamadı.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      student_id: student.id,
      full_name: student.full_name,
    });
  } catch (err) {
    console.error('[parent/link-child] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
