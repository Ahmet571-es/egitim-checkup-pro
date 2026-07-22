import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findExistingUserByEmail, buildDuplicateEmailError, normalizeEmail } from '@/lib/auth/find-existing-user';

/**
 * POST /api/auth/teacher-register
 *
 * Self-serve öğretmen kaydı — Supabase built-in email servisi
 * KULLANILMAZ (email_confirm:true). Böylece 2/saat rate limit
 * tamamen ortadan kalkar.
 *
 * Hesap is_approved:false ile oluşur, okul yöneticisi
 * /school/teachers sayfasından onaylayana kadar öğretmen giriş yapsa
 * bile panele erişemez (proxy.ts onay kontrolü).
 *
 * Public endpoint (auth gerekmez). Rate limit client IP bazında.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      full_name?: string;
      email?: string;
      password?: string;
      branch?: string;
      phone?: string;
      school_code?: string;
    };

    const fullName = (body.full_name ?? '').toString().trim();
    const email = normalizeEmail((body.email ?? '').toString());
    const password = (body.password ?? '').toString();
    const branch = (body.branch ?? '').toString().trim();
    const phone = (body.phone ?? '').toString().trim();
    const schoolCode = (body.school_code ?? '').toString().trim().toUpperCase();

    // Validasyonlar
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
      // bcrypt limit
      return NextResponse.json({ error: 'Şifre en fazla 72 karakter.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Okul kodu doğrulaması (varsa — opsiyonel)
    let schoolId: string | null = null;
    if (schoolCode) {
      const { data: school } = await admin
        .from('schools')
        .select('id')
        .eq('code', schoolCode)
        .maybeSingle();
      if (!school) {
        return NextResponse.json(
          { error: 'Okul kodu bulunamadı. Lütfen okul yöneticinizden kontrol edin.' },
          { status: 404 },
        );
      }
      schoolId = school.id;
    }

    // ════════════════════════════════════════════════════════════════════
    // PRE-CREATE DUPLICATE KONTROLÜ
    //
    // Eskiden sadece createUser'ın 'already registered' hatasını yakalıyorduk
    // → generic 409 dönüyordu, kullanıcı hangi role'de kayıtlı olduğunu
    // bilmiyordu. Aynı e-postanın iki farklı rolde kayıtlı olması ciddi bir
    // bug (öğretmen-öğrenci karışıklığı). Şimdi createUser'dan ÖNCE manuel
    // kontrol + role-aware net hata mesajı.
    // ════════════════════════════════════════════════════════════════════
    const existing = await findExistingUserByEmail(admin, email);
    if (existing) {
      return NextResponse.json(
        {
          error: buildDuplicateEmailError(existing, 'teacher'),
          existing_role: existing.role,
        },
        { status: 409 },
      );
    }

    // Email zaten kayıtlı mı? Supabase getUserByEmail yok — listUsers filter
    // kullanmak pahalı. createUser'da "already registered" hatası yakalanacak.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // KRİTİK: Supabase email gönderimini tetiklemez
      user_metadata: {
        full_name: fullName,
        role: 'teacher',
        school_id: schoolId,
        branch: branch || null,
        phone: phone || null,
        is_approved: false, // Okul yöneticisi onaylayacak
      },
    });

    if (createErr || !created.user) {
      // "User already registered" tipik hata
      const msg = createErr?.message ?? 'Kayıt oluşturulamadı.';
      const already = /already registered|already exists/i.test(msg);
      return NextResponse.json(
        { error: already ? 'Bu e-posta ile zaten bir hesap var.' : 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.' },
        { status: already ? 409 : 400 },
      );
    }

    // handle_new_user trigger profiles satırını oluşturur, ama is_approved
    // default true olabilir (eski schema'ya bağlı). Güvence için update.
    const { error: profileErr } = await admin
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'teacher',
        school_id: schoolId,
        branch: branch || null,
        phone: phone || null,
        is_approved: false,
        is_active: true,
      })
      .eq('id', created.user.id);

    if (profileErr) {
      console.warn('[teacher-register] profile update warning:', profileErr.message);
      // Kritik değil — user_metadata'daki is_approved=false giriş kontrolünde
      // zaten okunuyor (proxy.ts).
    }

    return NextResponse.json({
      success: true,
      message:
        'Kaydınız alındı. Okul yöneticiniz onayladıktan sonra giriş yapabilirsiniz.',
    });
  } catch (err) {
    console.error('[teacher-register] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
