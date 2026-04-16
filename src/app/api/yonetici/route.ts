import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_PASSWORD = 'ANKA_KUSU2026';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, password } = body;

    if (password !== ADMIN_PASSWORD) return unauthorized();

    const supabase = createAdminClient();

    // ═══ Öğretmen Listesi ═══
    if (action === 'list-teachers') {
      const { data: teachers, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, school_id, created_at')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Tüm kullanıcıların auth metadata'sını çek (öğretmen ve öğrenci okul adları için)
      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const metaMap = new Map<string, Record<string, unknown>>();
      (allUsers || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

      // Tüm öğrencileri çek
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, school_id')
        .eq('role', 'student');

      // Okul adı bazında öğrenci ID'leri grupla
      const studentsBySchool = new Map<string, string[]>();
      (allStudents || []).forEach((s) => {
        const sMeta = metaMap.get(s.id) || {};
        const sSchool = (sMeta.school_name as string) || '';
        if (!sSchool) return;
        const norm = sSchool.trim().toLowerCase();
        if (!studentsBySchool.has(norm)) studentsBySchool.set(norm, []);
        studentsBySchool.get(norm)!.push(s.id);
      });

      // Her öğretmen için okul adı eşleşmesiyle öğrenci + rapor sayısı
      const enriched = await Promise.all(
        (teachers || []).map(async (t) => {
          const tMeta = metaMap.get(t.id) || {};
          const teacherSchoolName = (tMeta.school_name as string) || '—';
          const norm = teacherSchoolName.trim().toLowerCase();

          // Okul adı eşleşen öğrenciler
          const studentIds = studentsBySchool.get(norm) || [];
          const studentCount = studentIds.length;

          // Rapor sayısı (ai_report dolu olan test_results)
          let reportCount = 0;
          if (studentIds.length > 0) {
            const { count } = await supabase
              .from('test_results')
              .select('id', { count: 'exact', head: true })
              .in('student_id', studentIds)
              .not('ai_report', 'is', null);
            reportCount = count || 0;
          }

          return {
            ...t,
            schoolName: teacherSchoolName,
            reportCount,
            studentCount,
          };
        })
      );

      return NextResponse.json({ teachers: enriched });
    }

    // ═══ Öğretmen Detay + Öğrenciler ═══
    if (action === 'teacher-detail') {
      const { teacherId } = body;
      if (!teacherId) return NextResponse.json({ error: 'teacherId gerekli' }, { status: 400 });

      // Öğretmen bilgileri (profiles tablosu)
      const { data: teacher } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .maybeSingle();

      if (!teacher) return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });

      // Auth user_metadata'dan kayıt bilgilerini çek (branş, kurum, gerçek e-posta, telefon)
      let authMeta: Record<string, string> = {};
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(teacherId);
        if (authUser?.user?.user_metadata) {
          authMeta = authUser.user.user_metadata as Record<string, string>;
        }
      } catch { /* ignore */ }

      // Okul adı
      let schoolName = authMeta.school_name || '—';
      if (schoolName === '—' && teacher.school_id) {
        const { data: school } = await supabase.from('schools').select('name').eq('id', teacher.school_id).maybeSingle();
        if (school) schoolName = school.name;
      }

      // ── Öğrencileri okul adı eşleşmesiyle bul ──
      // Öğretmenin user_metadata.school_name'i ile öğrencilerin user_metadata.school_name'i eşleşmeli
      let students: Array<{
        id: string; full_name: string; email: string; phone: string;
        grade: string | null; school_id: string | null; schoolName: string;
        class_id: string; class_name: string;
        created_at: string; city?: string; district?: string; address?: string;
        testCount: number; reportCount: number;
        tests: Array<{ id: string; test_type: string; completed_at: string; has_report: boolean }>;
      }> = [];

      const teacherSchoolNorm = (authMeta.school_name || '').trim().toLowerCase();

      if (teacherSchoolNorm) {
        // Tüm öğrencileri çek
        const { data: allStudents } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, grade, school_id, created_at')
          .eq('role', 'student');

        // Tüm öğrenci user_metadata'larını çek
        const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const studentMetaMap = new Map<string, Record<string, string>>();
        (allAuthUsers || []).forEach((u) => {
          studentMetaMap.set(u.id, (u.user_metadata || {}) as Record<string, string>);
        });

        // Okul adı eşleşen öğrencileri filtrele
        const matchingStudents = (allStudents || []).filter((s) => {
          const sMeta = studentMetaMap.get(s.id) || {};
          const sSchool = (sMeta.school_name || '').trim().toLowerCase();
          return sSchool === teacherSchoolNorm;
        });

        // Her öğrenci için detaylar (sınıf, testler, raporlar)
        students = await Promise.all(
          matchingStudents.map(async (s) => {
            const meta = studentMetaMap.get(s.id) || {};
            const sSchoolName = meta.school_name || '—';
            // Sınıf: önce profiles.grade, yoksa user_metadata.grade
            const grade = s.grade || meta.grade || '';
            const className = grade ? `${grade}. Sınıf` : 'Sınıfsız';

            // Testler
            const { data: testResults } = await supabase
              .from('test_results')
              .select('id, test_type, completed_at, ai_report')
              .eq('student_id', s.id)
              .order('completed_at', { ascending: false });

            const tests = (testResults || []).map((t) => ({
              id: t.id,
              test_type: t.test_type,
              completed_at: t.completed_at,
              has_report: !!t.ai_report,
            }));

            const reportCount = tests.filter((t) => t.has_report).length;

            return {
              ...s,
              grade: grade || null,
              schoolName: sSchoolName,
              class_id: '',
              class_name: className,
              city: meta.city || '',
              district: meta.district || '',
              address: meta.address || '',
              testCount: tests.length,
              reportCount,
              tests,
            };
          })
        );
      }

      return NextResponse.json({
        teacher: {
          ...teacher,
          schoolName,
          branch: authMeta.branch || teacher.branch || '—',
          school_name: authMeta.school_name || '—',
          real_email: authMeta.real_email || '',
          phone: authMeta.phone || teacher.phone || '—',
          is_approved: authMeta.is_approved ?? true,
        },
        students,
      });
    }

    // ═══ Öğrenci Raporlarını Getir ═══
    if (action === 'student-reports') {
      const { studentId } = body;
      if (!studentId) return NextResponse.json({ error: 'studentId gerekli' }, { status: 400 });

      const { data: reports } = await supabase
        .from('test_results')
        .select('id, test_type, scores, ai_report, completed_at, ai_report_generated_at')
        .eq('student_id', studentId)
        .not('ai_report', 'is', null)
        .order('completed_at', { ascending: false });

      // Entegre raporlar
      const { data: integrated } = await supabase
        .from('integrated_reports')
        .select('id, teacher_report, student_report, parent_report, generated_at')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false });

      return NextResponse.json({ reports: reports || [], integratedReports: integrated || [] });
    }

    // ═══ Kullanıcı Sil ═══
    if (action === 'delete-user') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

      await supabase.from('profiles').delete().eq('id', userId);

      return NextResponse.json({ success: true });
    }

    // ═══ Onay Bekleyen Öğretmenler ═══
    if (action === 'list-pending-teachers') {
      // Auth admin API ile tüm kullanıcıları çek, is_approved=false olanları filtrele
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 500 });
      if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

      const pending = (users || [])
        .filter(u => u.user_metadata?.role === 'teacher' && u.user_metadata?.is_approved === false)
        .map(u => ({
          id: u.id,
          full_name: u.user_metadata?.full_name || '—',
          email: u.email || '—',
          phone: u.user_metadata?.phone || '—',
          branch: u.user_metadata?.branch || '—',
          school_name: u.user_metadata?.school_name || '—',
          created_at: u.created_at,
        }));

      return NextResponse.json({ pending });
    }

    // ═══ Öğretmen Onayla ═══
    if (action === 'approve-teacher') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      // user_metadata'da is_approved = true yap
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { is_approved: true },
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      // Profiles tablosunda da güncelle (varsa)
      await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      return NextResponse.json({ success: true });
    }

    // ═══ Öğretmen Başvurusu Reddet ═══
    if (action === 'reject-teacher') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      // Auth'dan sil
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

      // Profili sil
      await supabase.from('profiles').delete().eq('id', userId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    console.error('[yonetici API]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
