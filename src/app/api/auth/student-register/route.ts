import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findExistingUserByEmail, buildDuplicateEmailError, normalizeEmail } from '@/lib/auth/find-existing-user';

/**
 * POST /api/auth/student-register
 *
 * Self-serve öğrenci kaydı. is_approved:false ile kayıt olur — yönetici
 * onaylayana kadar giriş yapamaz.
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
    };

    const fullName = (body.full_name ?? '').toString().trim();
    const email = normalizeEmail((body.email ?? '').toString());
    const password = (body.password ?? '').toString();
    const birthDate = (body.birth_date ?? '').toString();
    const age = typeof body.age === 'number' ? body.age : null;
    const grade = (body.grade ?? '').toString();
    const isGraduated = !!body.is_graduated;

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

    const admin = createAdminClient();

    // PRE-CREATE DUPLICATE KONTROLÜ — aynı e-posta farklı rolde olamaz.
    // (Detaylı açıklama teacher-register/route.ts içinde)
    const existing = await findExistingUserByEmail(admin, email);
    if (existing) {
      return NextResponse.json(
        {
          error: buildDuplicateEmailError(existing, 'student'),
          existing_role: existing.role,
        },
        { status: 409 },
      );
    }

    // Kullanıcı oluştur — is_approved: false
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Supabase native email YOK
      user_metadata: {
        full_name: fullName,
        role: 'student',
        birth_date: birthDate,
        age,
        grade: isGraduated ? '' : grade,
        is_graduated: isGraduated,
        is_approved: false, // Yönetici onayı gerekiyor
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

    // Profil güncelle (handle_new_user trigger'ı oluşturmuş olabilir, biz doğru değerleri yazalım)
    if (created.user) {
      await admin
        .from('profiles')
        .update({
          full_name: fullName,
          role: 'student',
          birth_date: birthDate,
          grade: isGraduated ? null : grade,
          is_graduated: isGraduated,
          is_approved: false,
          is_active: true,
        })
        .eq('id', created.user.id);
    }

    return NextResponse.json({
      success: true,
      user_id: created.user?.id,
      message: 'Kayıt alındı. Yönetici onayı bekleniyor.',
    });
  } catch (err) {
    console.error('[student-register] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
