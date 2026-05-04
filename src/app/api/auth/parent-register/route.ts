import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/parent-register
 *
 * Self-serve veli kaydı — 2 adımlı akış (e-posta doğrulama kodu ile).
 *
 * 1. Önce frontend `/api/auth/send-code` ile email'e 6 haneli kod yollar
 * 2. Veli kodu girip bu endpoint'i çağırır:
 *    - verification_codes tablosunda kodu doğrular (10dk TTL)
 *    - Geçerliyse Supabase Auth'da kullanıcı oluşturur (email_confirm:true)
 *    - student_code varsa parent_students bağlantısı kurulur
 *    - Kod consumed olarak işaretlenir
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      full_name?: string;
      email?: string;
      password?: string;
      student_code?: string;
      code?: string;
    };

    const fullName = (body.full_name ?? '').toString().trim();
    const email = (body.email ?? '').toString().trim().toLowerCase();
    const password = (body.password ?? '').toString();
    const studentCode = (body.student_code ?? '').toString().trim().toUpperCase();
    const verificationCode = (body.code ?? '').toString().trim();

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
    if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json({ error: '6 haneli doğrulama kodunu girin.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // E-posta doğrulama kodu kontrolü
    const { data: codeRow } = await admin
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', verificationCode)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!codeRow) {
      return NextResponse.json(
        { error: 'Doğrulama kodu geçersiz veya süresi dolmuş. Yeni kod isteyin.' },
        { status: 400 },
      );
    }

    // Öğrenci kodu varsa önce doğrula (hesap oluşturmadan önce)
    let studentId: string | null = null;
    if (studentCode) {
      if (studentCode.length !== 6 || !/^[A-Z0-9]+$/.test(studentCode)) {
        return NextResponse.json(
          { error: 'Öğrenci kodu 6 karakter, büyük harf ve rakam olmalı.' },
          { status: 400 },
        );
      }
      const { data: student } = await admin
        .from('profiles')
        .select('id')
        .eq('student_code', studentCode)
        .eq('role', 'student')
        .maybeSingle();
      if (!student) {
        return NextResponse.json(
          { error: 'Bu koda sahip bir öğrenci bulunamadı. Kodu kontrol edin.' },
          { status: 404 },
        );
      }
      studentId = student.id;
    }

    // Veli hesabını oluştur — Supabase email'i tetiklemez
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'parent',
        is_approved: true, // Veliler self-serve, onay gerekmez
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message ?? 'Kayıt oluşturulamadı.';
      const already = /already registered|already exists/i.test(msg);
      return NextResponse.json(
        { error: already ? 'Bu e-posta ile zaten bir hesap var.' : msg },
        { status: already ? 409 : 400 },
      );
    }

    // Profil güncelle (trigger default değerleri yerine doğru rol)
    await admin
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'parent',
        is_approved: true,
        is_active: true,
      })
      .eq('id', created.user.id);

    // Doğrulama kodunu kullanıldı olarak işaretle
    await admin
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRow.id);

    // Çocuk bağlantısını kur (studentId varsa)
    // Not: parent_students.approved_at migration varsa NULL olarak yazılır
    // ve öğretmen onayı beklenir. Migration yoksa kolon yok,
    // defaultlar eskisi gibi çalışır.
    if (studentId) {
      const { error: linkErr } = await admin
        .from('parent_students')
        .insert({ parent_id: created.user.id, student_id: studentId });
      if (linkErr) {
        console.warn('[parent-register] parent_students insert warning:', linkErr.message);
        // Kritik değil — veli sonra my-children'dan ekleyebilir
      }
    }

    // Bağlantının onay bekleyip beklemediğini kontrol et
    // (migration varsa approved_at NULL demek bekliyor)
    let approvalPending = false;
    if (studentId) {
      const { data: linkCheck } = await admin
        .from('parent_students')
        .select('*')
        .eq('parent_id', created.user.id)
        .eq('student_id', studentId)
        .maybeSingle();
      // Kolon varsa ve null ise → pending
      if (linkCheck && 'approved_at' in linkCheck) {
        approvalPending = linkCheck.approved_at === null;
      }
    }

    return NextResponse.json({
      success: true,
      message: approvalPending
        ? 'Kaydınız tamamlandı. Öğretmen bağlantıyı onaylayınca çocuğunuzun verisine tam erişim sağlanacak.'
        : 'Kaydınız tamamlandı. Giriş yapabilirsiniz.',
      child_linked: !!studentId,
      approval_pending: approvalPending,
    });
  } catch (err) {
    console.error('[parent-register] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
