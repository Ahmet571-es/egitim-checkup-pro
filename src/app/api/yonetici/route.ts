import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_PASSWORD = 'ANKA_KUSU2026';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}

/**
 * Bir kullanıcının (öğrenci VEYA öğretmen) tüm izlerini sistemden temizler.
 * - Auth user (giriş bilgileri, oturumlar) → silindikten sonra giriş YAPAMAZLAR
 * - profiles tablosu
 * - İlişkili veri tabloları (test sonuçları, raporlar, atamalar, koçluk vb.)
 *
 * Tablo yoksa veya sütun yoksa sessizce geçer (uygulamanın evrimi sırasında
 * bazı tablolar kaldırılmış olabilir).
 */
async function purgeUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  // 1) Öğrenci tarafı tabloları
  const studentTables = [
    'test_results',
    'holistic_reports',
    'integrated_reports',
    'coaching_tasks',
    'coaching_streaks',
    'ai_chat_usage',
    'guidance_plans',
    'class_students',
    'student_test_history',
  ];
  for (const tbl of studentTables) {
    try { await admin.from(tbl).delete().eq('student_id', userId); } catch { /* tablo yok */ }
    try { await admin.from(tbl).delete().eq('user_id', userId); } catch { /* alternatif */ }
  }

  // 2) Öğretmen tarafı tabloları
  const teacherTables = ['classes', 'verification_codes', 'teacher_parent_notes'];
  for (const tbl of teacherTables) {
    try { await admin.from(tbl).delete().eq('teacher_id', userId); } catch { /* geç */ }
    try { await admin.from(tbl).delete().eq('user_id', userId); } catch { /* geç */ }
  }

  // 3) profiles tablosu
  try { await admin.from('profiles').delete().eq('id', userId); } catch { /* geç */ }

  // 4) En son auth.users — bu silindikten sonra giriş yapılamaz
  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) return { ok: false, error: authErr.message };

  return { ok: true };
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

      // Tüm kullanıcı metadata
      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const metaMap = new Map<string, Record<string, unknown>>();
      (allUsers || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

      // Tüm öğrencileri öğretmen ID'sine göre grupla
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');

      const studentsByTeacher = new Map<string, string[]>();
      (allStudents || []).forEach((s) => {
        const sMeta = metaMap.get(s.id) || {};
        const tId = (sMeta.assigned_teacher_id as string) || '';
        if (!tId) return;
        if (!studentsByTeacher.has(tId)) studentsByTeacher.set(tId, []);
        studentsByTeacher.get(tId)!.push(s.id);
      });

      // Her öğretmen için kendi öğrenci sayısı + rapor sayısı
      const enriched = await Promise.all(
        (teachers || []).map(async (t) => {
          const tMeta = metaMap.get(t.id) || {};
          const teacherSchoolName = (tMeta.school_name as string) || '—';
          const studentIds = studentsByTeacher.get(t.id) || [];
          const studentCount = studentIds.length;

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
            studentCount,
            reportCount,
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

      // ── TÜM öğrencileri göster (Öğrencilerim ile aynı mantık) ──
      // Yönetici öğretmenin altında platformdaki tüm öğrencileri görmeli,
      // tıpkı öğretmenin kendi Öğrencilerim sayfasında gördüğü gibi.
      let students: Array<{
        id: string; full_name: string; email: string; phone: string;
        grade: string | null; school_id: string | null; schoolName: string;
        class_id: string; class_name: string;
        created_at: string; city?: string; district?: string; address?: string;
        testCount: number; reportCount: number;
        tests: Array<{ id: string; test_type: string; completed_at: string; has_report: boolean }>;
      }> = [];

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

      // Schools tablosu fallback
      const sIds = [...new Set((allStudents || []).map((s) => s.school_id).filter(Boolean))];
      const schoolNameMap: Record<string, string> = {};
      if (sIds.length > 0) {
        const { data: schools } = await supabase.from('schools').select('id, name').in('id', sIds as string[]);
        (schools || []).forEach((s) => { schoolNameMap[s.id] = s.name; });
      }

      // SADECE bu öğretmene atanan öğrenciler
      const myStudents = (allStudents || []).filter((s) => {
        const meta = studentMetaMap.get(s.id) || {};
        return (meta.assigned_teacher_id as string) === teacherId;
      });

      // Her öğrenci için detay (sınıf, şube, mezun, testler, raporlar)
      students = await Promise.all(
        myStudents.map(async (s) => {
          const meta = studentMetaMap.get(s.id) || {};
          const sSchoolName = (meta.school_name as string) || schoolNameMap[s.school_id || ''] || 'Okulsuz';
          const isGraduated = !!meta.is_graduated;
          const grade = s.grade || meta.grade || '';
          const section = meta.section || '';
          // Sınıf adı: mezunsa 'Mezun', aktifse '9/A' formatı veya '9. Sınıf'
          let className: string;
          if (isGraduated) className = 'Mezun';
          else if (grade && section) className = `${grade}/${section}`;
          else if (grade) className = `${grade}. Sınıf`;
          else className = 'Sınıfsız';

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
            section: section || '',
            is_graduated: isGraduated,
            city: meta.city || '',
            district: meta.district || '',
            address: meta.address || '',
            testCount: tests.length,
            reportCount,
            tests,
          };
        })
      );

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

      const result = await purgeUser(supabase, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    // ═══ TOPLU SİL: Seçilen kullanıcıları sil ═══
    if (action === 'bulk-delete') {
      const { userIds } = body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'userIds dizisi gerekli' }, { status: 400 });
      }

      let deleted = 0;
      const errors: string[] = [];

      for (const uid of userIds) {
        const result = await purgeUser(supabase, uid);
        if (result.ok) deleted++;
        else errors.push(`${uid}: ${result.error}`);
      }

      return NextResponse.json({ success: true, deleted, errors });
    }

    // ═══ TÜMÜNÜ SİL: Belirli rol için tüm kullanıcıları sil ═══
    if (action === 'delete-all') {
      const { role: targetRole } = body;
      if (targetRole !== 'teacher' && targetRole !== 'student') {
        return NextResponse.json({ error: 'role: teacher veya student olmalı' }, { status: 400 });
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', targetRole);

      const userIds = (profiles || []).map((p) => p.id);
      let deleted = 0;
      const errors: string[] = [];

      for (const uid of userIds) {
        const result = await purgeUser(supabase, uid);
        if (result.ok) deleted++;
        else errors.push(`${uid}: ${result.error}`);
      }

      return NextResponse.json({ success: true, deleted, total: userIds.length, errors });
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

      const result = await purgeUser(supabase, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    console.error('[yonetici API]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
