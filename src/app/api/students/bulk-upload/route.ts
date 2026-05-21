import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { findExistingUserByEmail, buildDuplicateEmailError, normalizeEmail } from '@/lib/auth/find-existing-user';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    // Yönetici/okul admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'school_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    const { students } = await request.json();
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Öğrenci listesi boş' }, { status: 400 });
    }

    if (students.length > 200) {
      return NextResponse.json({ error: 'Tek seferde en fazla 200 öğrenci yüklenebilir' }, { status: 400 });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Service role key varsa admin API kullan (en güvenilir yol)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (serviceKey && supaUrl) {
      const adminClient = createAdminClient(supaUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      for (const student of students) {
        try {
          const email = normalizeEmail(student.email ?? '');
          const fullName = student.full_name?.trim();
          const grade = student.grade?.toString() || '9';

          if (!email || !fullName) {
            results.push({ email: email || '?', success: false, error: 'Ad veya e-posta eksik' });
            continue;
          }

          // PRE-CREATE DUPLICATE KONTROLÜ — bulk yüklemede aynı e-postanın
          // farklı rolde kayıtlı olması özellikle yaygın (Excel'deki bir
          // velinin/öğretmenin e-postası öğrenci listesine yapıştırılabilir)
          const existing = await findExistingUserByEmail(adminClient, email);
          if (existing) {
            results.push({
              email,
              success: false,
              error: buildDuplicateEmailError(existing, 'student'),
            });
            continue;
          }

          // Kullanıcı oluştur
          const tempPassword = `Ogrenci${Math.random().toString(36).slice(2, 8)}!`;
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              role: 'student',
              school_id: profile.school_id,
            },
          });

          if (createError) {
            results.push({ email, success: false, error: createError.message });
            continue;
          }

          // Sınıfa ekle (grade'e göre sınıf bul)
          if (newUser?.user && profile.school_id) {
            const { data: classData } = await adminClient
              .from('classes')
              .select('id')
              .eq('school_id', profile.school_id)
              .eq('grade', parseInt(grade))
              .limit(1)
              .maybeSingle();

            if (classData) {
              await adminClient.from('class_students').insert({
                class_id: classData.id,
                student_id: newUser.user.id,
              });
            }
          }

          results.push({ email, success: true });
        } catch (err) {
          results.push({ email: student.email || '?', success: false, error: 'Beklenmeyen hata' });
        }
      }
    } else {
      // Service key yoksa profiles tablosuna doğrudan ekle
      for (const student of students) {
        try {
          const email = student.email?.trim();
          const fullName = student.full_name?.trim();

          if (!email || !fullName) {
            results.push({ email: email || '?', success: false, error: 'Ad veya e-posta eksik' });
            continue;
          }

          // Profil zaten var mı kontrol et
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (existing) {
            results.push({ email, success: false, error: 'Bu e-posta zaten kayıtlı' });
            continue;
          }

          results.push({ email, success: false, error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Vercel env var ekleyin.' });
        } catch {
          results.push({ email: student.email || '?', success: false, error: 'Beklenmeyen hata' });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount,
      failed: failCount,
      details: results,
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return NextResponse.json({ error: 'Yükleme sırasında hata oluştu.' }, { status: 500 });
  }
}
