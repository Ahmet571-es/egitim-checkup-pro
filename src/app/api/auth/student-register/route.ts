import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/student-register
 *
 * Öğrenci self-serve kayıt — 2 adımlı akış son adımı.
 * Body: { full_name, email, password, birth_date, age, grade, is_graduated, code }
 *
 * 1. verification_codes tablosunda email + code doğrulanır (10 dk TTL)
 * 2. Geçerliyse Supabase Auth'da kullanıcı oluşturulur (email_confirm:true)
 * 3. Kod consumed olarak işaretlenir
 *
 * Public endpoint. Önce kod gönderilmiş olmalı (POST /api/auth/send-code).
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      full_name?: string;
      email?: string;
      password?: string;
      birth_date?: string;
      age?: number;
      grade?: string;
      is_graduated?: boolean;
      code?: string;
    };

    const fullName = (body.full_name ?? '').toString().trim();
    const email = (body.email ?? '').toString().trim().toLowerCase();
    const password = (body.password ?? '').toString();
    const birthDate = (body.birth_date ?? '').toString();
    const age = typeof body.age === 'number' ? body.age : null;
    const grade = (body.grade ?? '').toString();
    const isGraduated = !!body.is_graduated;
    const code = (body.code ?? '').toString().trim();

    // Validasyon
    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ error: 'Ad soyad en az 3 karakter olmalı.' }, { status: 400 });
    }
    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
    }
    if (password.length > 72) {
      return NextResponse.json({ error: 'Şifre en fazla 72 karakter.' }, { status: 400 });
    }
    if (!birthDate) {
      return NextResponse.json({ error: 'Doğum tarihi zorunludur.' }, { status: 400 });
    }
    if (!isGraduated && !grade) {
      return NextResponse.json({ error: 'Sınıf seçimi zorunludur.' }, { status: 400 });
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: '6 haneli doğrulama kodunu girin.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1) Doğrulama kodu kontrolü
    const { data: codeRow } = await admin
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!codeRow) {
      return NextResponse.json(
        { error: 'Doğrulama kodu geçersiz veya süresi dolmuş. Yeni kod isteyin.' },
        { status: 400 },
      );
    }

    // 2) Kullanıcı oluştur (Supabase email confirmation atlanır — biz zaten kod ile doğruladık)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'student',
        birth_date: birthDate,
        age,
        grade: isGraduated ? '' : grade,
        is_graduated: isGraduated,
      },
    });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      if (msg.includes('already') || msg.includes('exists')) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kayıtlı.' },
          { status: 409 },
        );
      }
      console.error('[student-register] createUser error:', createErr.message);
      return NextResponse.json({ error: 'Kayıt oluşturulamadı.' }, { status: 500 });
    }

    // 3) Kodu kullanıldı olarak işaretle
    await admin
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRow.id);

    return NextResponse.json({
      success: true,
      user_id: created.user?.id,
      message: 'Kayıt başarıyla tamamlandı.',
    });
  } catch (err) {
    console.error('[student-register] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
