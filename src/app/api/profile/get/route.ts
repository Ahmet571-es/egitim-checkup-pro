import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/profile/get?user_id=...
 *
 * Admin/school_admin için: başka bir kullanıcının tüm profil bilgilerini
 * (profiles + auth metadata) tek seferde döner. EditProfileModal'in
 * initialValues'ını doldurmak için kullanılır.
 *
 * Auth: admin veya school_admin
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
  if (callerRole !== 'admin' && callerRole !== 'school_admin') {
    return NextResponse.json({ error: 'Yönetici yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const targetId = url.searchParams.get('user_id');
  if (!targetId) {
    return NextResponse.json({ error: 'user_id parametresi zorunlu.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, role, phone, branch, grade, is_graduated, birth_date, school_id')
    .eq('id', targetId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  const { data: authData } = await admin.auth.admin.getUserById(targetId);
  const meta = (authData?.user?.user_metadata ?? {}) as Record<string, unknown>;

  let schoolName = (meta.school_name as string) || '';
  if (!schoolName && profile.school_id) {
    const { data: school } = await admin
      .from('schools')
      .select('name')
      .eq('id', profile.school_id)
      .maybeSingle();
    if (school?.name) schoolName = school.name;
  }

  return NextResponse.json({
    profile: {
      user_id: profile.id,
      role: profile.role,
      full_name: (profile.full_name as string) || (meta.full_name as string) || '',
      phone: (profile.phone as string) || (meta.phone as string) || '',
      gender: (meta.gender as string) || '',
      birth_date: (profile.birth_date as string) || (meta.birth_date as string) || '',
      city: (meta.city as string) || '',
      district: (meta.district as string) || '',
      school_name: schoolName,
      grade: (profile.grade as string) || (meta.grade as string) || '',
      is_graduated: !!(profile.is_graduated ?? meta.is_graduated ?? false),
      branch: (profile.branch as string) || (meta.branch as string) || '',
    },
  });
}
