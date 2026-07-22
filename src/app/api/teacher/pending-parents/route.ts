import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/auth/admin-users';

/**
 * GET /api/teacher/pending-parents
 *
 * Öğretmenin yetkili olduğu öğrencilerin (assigned_teacher_id = kendisi)
 * onay bekleyen veli bağlantılarını listeler.
 *
 * Patron isteği: Veli öğrenci kodu ile bağlandığında öğretmen onayı
 * beklenir — bu listeden onaylanır veya reddedilir.
 *
 * Schema bağımlılığı:
 *   parent_students.approved_at kolonu — migration_parent_approval.sql
 *   ile eklendi. Migration çalıştırılmadıysa kolon yok; o durumda
 *   graceful empty list döner.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'teacher' && profile?.role !== 'school_admin' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Öğretmenin yetkili olduğu öğrencileri bul
    // Pattern: student.user_metadata.assigned_teacher_id = user.id
    // school_admin için tüm okul öğrencileri
    const allStudents = await listAllAuthUsers(admin);

    const teacherStudentIds: string[] = [];
    for (const u of allStudents) {
      const meta = u.user_metadata as Record<string, unknown> | null;
      if (meta?.role !== 'student') continue;
      // Teacher: sadece kendi öğrencileri
      if (profile?.role === 'teacher' && meta?.assigned_teacher_id !== user.id) continue;
      teacherStudentIds.push(u.id);
    }

    if (teacherStudentIds.length === 0) {
      return NextResponse.json({ success: true, pending: [] });
    }

    // parent_students'tan onay bekleyenleri al
    const { data: links, error } = await admin
      .from('parent_students')
      .select('*')
      .in('student_id', teacherStudentIds);

    if (error) {
      // Migration çalıştırılmadıysa hata olabilir — boş liste dön
      console.warn('[teacher/pending-parents] query error:', error.message);
      return NextResponse.json({ success: true, pending: [] });
    }

    // Sadece approved_at null olanları filtrele (migration yoksa tümü
    // undefined olur — o durumda hiçbiri "pending" değil)
    const pendingLinks = (links ?? []).filter((l: Record<string, unknown>) => {
      return 'approved_at' in l && l.approved_at === null;
    });

    if (pendingLinks.length === 0) {
      return NextResponse.json({ success: true, pending: [] });
    }

    // Parent ve student bilgilerini çek
    const parentIds = [...new Set(pendingLinks.map((l) => l.parent_id as string))];
    const studentIds = [...new Set(pendingLinks.map((l) => l.student_id as string))];

    const { data: parents } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', parentIds);
    const { data: students } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    const parentMap = new Map((parents ?? []).map((p) => [p.id, p]));
    const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

    const pending = pendingLinks.map((l) => ({
      id: l.id as string,
      parent_id: l.parent_id as string,
      student_id: l.student_id as string,
      created_at: l.created_at as string,
      parent_name: parentMap.get(l.parent_id as string)?.full_name ?? 'Veli',
      parent_email: parentMap.get(l.parent_id as string)?.email ?? '',
      student_name: studentMap.get(l.student_id as string)?.full_name ?? 'Öğrenci',
    }));

    return NextResponse.json({ success: true, pending });
  } catch (err) {
    console.error('[teacher/pending-parents] exception:', err);
    return NextResponse.json({ success: true, pending: [] }, { status: 200 });
  }
}
