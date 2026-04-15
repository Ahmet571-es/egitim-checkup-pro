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

      // Her öğretmenin okul adını ve rapor sayısını getir
      const enriched = await Promise.all(
        (teachers || []).map(async (t) => {
          // Okul adı
          let schoolName = '—';
          if (t.school_id) {
            const { data: school } = await supabase.from('schools').select('name').eq('id', t.school_id).maybeSingle();
            if (school) schoolName = school.name;
          }

          // Rapor sayısı (ai_report dolu olan test_results)
          // Öğretmenin sınıflarındaki öğrencilerin raporlarını say
          const { data: classIds } = await supabase.from('classes').select('id').eq('teacher_id', t.id);
          let reportCount = 0;
          if (classIds && classIds.length > 0) {
            const cids = classIds.map((c) => c.id);
            const { data: studentIds } = await supabase.from('class_students').select('student_id').in('class_id', cids);
            if (studentIds && studentIds.length > 0) {
              const sids = [...new Set(studentIds.map((s) => s.student_id))];
              const { count } = await supabase
                .from('test_results')
                .select('id', { count: 'exact', head: true })
                .in('student_id', sids)
                .not('ai_report', 'is', null);
              reportCount = count || 0;
            }
          }

          // Öğrenci sayısı
          let studentCount = 0;
          if (classIds && classIds.length > 0) {
            const cids = classIds.map((c) => c.id);
            const { count } = await supabase
              .from('class_students')
              .select('student_id', { count: 'exact', head: true })
              .in('class_id', cids);
            studentCount = count || 0;
          }

          return { ...t, schoolName, reportCount, studentCount };
        })
      );

      return NextResponse.json({ teachers: enriched });
    }

    // ═══ Öğretmen Detay + Öğrenciler ═══
    if (action === 'teacher-detail') {
      const { teacherId } = body;
      if (!teacherId) return NextResponse.json({ error: 'teacherId gerekli' }, { status: 400 });

      // Öğretmen bilgileri
      const { data: teacher } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .maybeSingle();

      if (!teacher) return NextResponse.json({ error: 'Öğretmen bulunamadı' }, { status: 404 });

      // Okul adı
      let schoolName = '—';
      if (teacher.school_id) {
        const { data: school } = await supabase.from('schools').select('name').eq('id', teacher.school_id).maybeSingle();
        if (school) schoolName = school.name;
      }

      // Öğretmenin sınıfları ve öğrencileri
      const { data: classes } = await supabase.from('classes').select('id, name').eq('teacher_id', teacherId);
      const classIds = (classes || []).map((c) => c.id);

      let students: Array<{
        id: string; full_name: string; email: string; phone: string;
        grade: string | null; school_id: string | null; schoolName: string;
        created_at: string; city?: string; district?: string; address?: string;
        testCount: number; reportCount: number;
        tests: Array<{ id: string; test_type: string; completed_at: string; has_report: boolean }>;
      }> = [];

      if (classIds.length > 0) {
        const { data: csRows } = await supabase
          .from('class_students')
          .select('student_id')
          .in('class_id', classIds);

        const sids = [...new Set((csRows || []).map((r) => r.student_id))];

        if (sids.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, grade, school_id, created_at')
            .in('id', sids);

          // Her öğrenci için okul adı, testler, raporlar
          students = await Promise.all(
            (profiles || []).map(async (s) => {
              let sSchoolName = '—';
              if (s.school_id) {
                const { data: sch } = await supabase.from('schools').select('name').eq('id', s.school_id).maybeSingle();
                if (sch) sSchoolName = sch.name;
              }

              // Auth user metadata (city, district, address)
              let meta: Record<string, string> = {};
              try {
                const { data: authUser } = await supabase.auth.admin.getUserById(s.id);
                if (authUser?.user?.user_metadata) {
                  meta = authUser.user.user_metadata as Record<string, string>;
                }
              } catch { /* ignore */ }

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
                schoolName: sSchoolName,
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
      }

      return NextResponse.json({
        teacher: { ...teacher, schoolName },
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

      // Auth'dan sil
      const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

      // Profili sil (cascade ile ilişkili veriler de silinir)
      await supabase.from('profiles').delete().eq('id', userId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    console.error('[yonetici API]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
