import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/profile/update
 *
 * İki modda çalışır:
 *  1) SELF-EDIT: kendi profilini güncellersin (target_user_id verme)
 *  2) ADMIN-EDIT: admin/school_admin başkasının profilini günceller
 *     (target_user_id ver)
 *
 * Body:
 *   target_user_id?: string  → null/undefined ise self-edit
 *   full_name?: string
 *   phone?: string
 *   gender?: 'erkek' | 'kadin' | ''
 *   birth_date?: string (ISO YYYY-MM-DD)
 *   city?: string
 *   district?: string
 *   school_name?: string  (sadece display amaçlı, school_id değişmez)
 *   grade?: string        (öğrenci için)
 *   is_graduated?: boolean (öğrenci için)
 *   branch?: string       (öğretmen için)
 *
 * Email, username ve role HİÇBİR ŞEKİLDE değiştirilemez.
 * Hem profiles tablosunu hem auth.users.user_metadata'yı günceller.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UpdateBody = {
  target_user_id?: string;
  full_name?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  city?: string;
  district?: string;
  school_name?: string;
  grade?: string;
  is_graduated?: boolean;
  branch?: string;
};

// Düzenlenebilir alanların whitelist'i. Buraya olmayan hiçbir alan kaydedilmez.
const PROFILES_COLUMNS = new Set([
  'full_name', 'phone', 'birth_date', 'grade', 'is_graduated', 'branch',
]);
const METADATA_KEYS = new Set([
  'full_name', 'phone', 'gender', 'birth_date', 'city', 'district',
  'school_name', 'grade', 'is_graduated', 'branch',
]);

function sanitizeString(v: unknown, max = 200): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim().slice(0, max);
  return trimmed;
}

function sanitizeBirthDate(v: unknown): string | undefined {
  const s = sanitizeString(v, 10);
  if (s === undefined) return undefined;
  if (s === '') return ''; // izin ver — sıfırlama
  // YYYY-MM-DD format check + yaş range kontrolü
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 3 || age > 120) return undefined;
  return s;
}

function sanitizeGender(v: unknown): string | undefined {
  const s = sanitizeString(v, 10);
  if (s === undefined) return undefined;
  if (s === '' || s === 'erkek' || s === 'kadin') return s;
  return undefined;
}

function sanitizePhone(v: unknown): string | undefined {
  const s = sanitizeString(v, 20);
  if (s === undefined) return undefined;
  if (s === '') return '';
  // Sadece rakam, +, boşluk
  const cleaned = s.replace(/[^\d+\s]/g, '');
  return cleaned;
}

export async function POST(request: Request) {
  // 1) Auth: oturum açmış olmalı
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Oturum açmanız gerekli.' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const callerRole = callerProfile?.role ?? user.user_metadata?.role ?? null;

  // 2) Body parse
  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const targetId = body.target_user_id?.trim();

  // 3) Hedef kullanıcı kim?
  const isAdminEdit = !!targetId && targetId !== user.id;

  if (isAdminEdit) {
    if (callerRole !== 'admin' && callerRole !== 'school_admin') {
      return NextResponse.json(
        { error: 'Başka kullanıcıyı düzenlemek için yönetici yetkisi gerekli.' },
        { status: 403 },
      );
    }
  }

  const finalTargetId = isAdminEdit ? targetId! : user.id;

  // 4) Hedef kullanıcı bilgilerini çek (rol kontrolü için)
  const admin = createAdminClient();
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', finalTargetId)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  const targetRole = targetProfile.role;

  // 5) Sanitize edilmiş alanlar
  const updates: Record<string, unknown> = {};

  const fullName = sanitizeString(body.full_name, 120);
  if (fullName !== undefined) {
    if (fullName.length < 2) {
      return NextResponse.json({ error: 'Ad-soyad en az 2 karakter olmalı.' }, { status: 400 });
    }
    updates.full_name = fullName;
  }

  const phone = sanitizePhone(body.phone);
  if (phone !== undefined) updates.phone = phone;

  const gender = sanitizeGender(body.gender);
  if (gender !== undefined) updates.gender = gender;

  const birthDate = sanitizeBirthDate(body.birth_date);
  if (birthDate !== undefined) updates.birth_date = birthDate || null;
  else if (body.birth_date !== undefined) {
    return NextResponse.json(
      { error: 'Geçerli bir doğum tarihi girin (3-120 yaş aralığı).' },
      { status: 400 },
    );
  }

  const city = sanitizeString(body.city, 80);
  if (city !== undefined) updates.city = city;

  const district = sanitizeString(body.district, 80);
  if (district !== undefined) updates.district = district;

  const schoolName = sanitizeString(body.school_name, 200);
  if (schoolName !== undefined) updates.school_name = schoolName;

  // Role-specific
  if (targetRole === 'student') {
    const grade = sanitizeString(body.grade, 5);
    if (grade !== undefined) updates.grade = grade;
    if (typeof body.is_graduated === 'boolean') updates.is_graduated = body.is_graduated;
  }
  if (targetRole === 'teacher') {
    const branch = sanitizeString(body.branch, 80);
    if (branch !== undefined) updates.branch = branch;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 });
  }

  // 6) profiles tablosunu güncelle (sadece whitelist'teki alanlar)
  const profilesPatch: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    if (PROFILES_COLUMNS.has(key)) {
      profilesPatch[key] = updates[key];
    }
  }

  if (Object.keys(profilesPatch).length > 0) {
    const { error: pErr } = await admin
      .from('profiles')
      .update(profilesPatch)
      .eq('id', finalTargetId);
    if (pErr) {
      console.error('[profile/update] profiles update error:', pErr.message);
      return NextResponse.json(
        { error: `Profil güncellenirken hata: ${pErr.message}` },
        { status: 500 },
      );
    }
  }

  // 7) auth.users.user_metadata'yı güncelle (METADATA_KEYS'teki alanlar)
  const { data: targetAuth } = await admin.auth.admin.getUserById(finalTargetId);
  const existingMeta = targetAuth?.user?.user_metadata || {};
  const newMeta: Record<string, unknown> = { ...existingMeta };
  for (const key of Object.keys(updates)) {
    if (METADATA_KEYS.has(key)) {
      newMeta[key] = updates[key];
    }
  }

  const { error: aErr } = await admin.auth.admin.updateUserById(finalTargetId, {
    user_metadata: newMeta,
  });
  if (aErr) {
    console.error('[profile/update] auth update error:', aErr.message);
    return NextResponse.json(
      { error: `Hesap bilgisi güncellenirken hata: ${aErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: isAdminEdit
      ? 'Kullanıcı bilgileri güncellendi.'
      : 'Profiliniz güncellendi.',
    updated_fields: Object.keys(updates),
  });
}
