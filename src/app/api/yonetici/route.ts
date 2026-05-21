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

      // Tüm kullanıcı metadata + auth.users.email (login email, source of truth)
      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const metaMap = new Map<string, Record<string, unknown>>();
      const authEmailMap = new Map<string, string>();
      (allUsers || []).forEach((u) => {
        metaMap.set(u.id, u.user_metadata || {});
        if (u.email) authEmailMap.set(u.id, u.email);
      });

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
            // Login için kullanılan gerçek e-posta (auth.users.email)
            // Bazı eski kayıtlarda profiles.email boş olabiliyor; auth her zaman dolu.
            email: authEmailMap.get(t.id) || t.email || '',
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

      // Auth user_metadata + auth.users.email'i çek (login email = source of truth)
      let authMeta: Record<string, string> = {};
      let authEmail = '';
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(teacherId);
        if (authUser?.user?.user_metadata) {
          authMeta = authUser.user.user_metadata as Record<string, string>;
        }
        if (authUser?.user?.email) {
          authEmail = authUser.user.email;
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
          // Login e-postası: auth.users.email otoritedir. profiles.email
          // bazen senkronize değil; real_email user_metadata'sı ise hiçbir
          // yerde set edilmiyor (legacy). Bu yüzden fallback zinciri:
          // auth.users.email → profiles.email → real_email.
          email: authEmail || teacher.email || authMeta.real_email || '',
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

    // ═══════════════════════════════════════════════════════════
    // ═══ YENİ: Onay Bekleyen / Kayıtlı Öğrenci & Veli Listeleri
    // ═══════════════════════════════════════════════════════════

    // Yardımcı: tüm auth.users metadata'sını rol+is_approved bazında çek
    async function listUsersByRoleAndApproval(
      role: 'student' | 'parent' | 'teacher',
      approved: boolean
    ) {
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) throw new Error(listErr.message);

      const wantsApproved = approved;
      const filtered = (users || []).filter(u => {
        if (u.user_metadata?.role !== role) return false;
        const ia = u.user_metadata?.is_approved;
        if (wantsApproved) {
          // Approved: is_approved === true (eski hesaplar için undefined → kabul)
          return ia === true || ia === undefined;
        } else {
          // Pending: is_approved === false (sadece bu)
          return ia === false;
        }
      });

      return filtered.map(u => ({
        id: u.id,
        full_name: (u.user_metadata?.full_name as string) || '—',
        email: u.email || '—',
        phone: (u.user_metadata?.phone as string) || '—',
        role,
        // Öğrenci alanları
        grade: (u.user_metadata?.grade as string) || null,
        school_name: (u.user_metadata?.school_name as string) || '—',
        assigned_teacher_id: (u.user_metadata?.assigned_teacher_id as string) || null,
        // Öğretmen alanları
        branch: (u.user_metadata?.branch as string) || null,
        // Veli alanları
        student_code: (u.user_metadata?.student_code as string) || null,
        child_name: (u.user_metadata?.child_name as string) || null,
        created_at: u.created_at,
      }));
    }

    if (action === 'list-pending-students') {
      try {
        const list = await listUsersByRoleAndApproval('student', false);
        return NextResponse.json({ users: list });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    if (action === 'list-pending-parents') {
      try {
        const list = await listUsersByRoleAndApproval('parent', false);
        return NextResponse.json({ users: list });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    if (action === 'list-registered-students') {
      try {
        const list = await listUsersByRoleAndApproval('student', true);
        // Atanmış öğretmen adlarını da ekle
        const teacherIds = Array.from(new Set(list.map(u => u.assigned_teacher_id).filter(Boolean) as string[]));
        let teacherNameMap = new Map<string, string>();
        if (teacherIds.length > 0) {
          const { data: tProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds);
          teacherNameMap = new Map((tProfiles || []).map(p => [p.id, p.full_name as string]));
        }
        const enriched = list.map(u => ({
          ...u,
          assigned_teacher_name: u.assigned_teacher_id ? (teacherNameMap.get(u.assigned_teacher_id) || '—') : null,
        }));
        return NextResponse.json({ users: enriched });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    if (action === 'list-registered-parents') {
      try {
        const list = await listUsersByRoleAndApproval('parent', true);
        return NextResponse.json({ users: list });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    // ═══ Onay için kullanılacak: tüm onaylı öğretmen listesi (id+isim) ═══
    if (action === 'list-approved-teachers-simple') {
      try {
        const teachers = await listUsersByRoleAndApproval('teacher', true);
        return NextResponse.json({
          teachers: teachers.map(t => ({ id: t.id, full_name: t.full_name, email: t.email, branch: t.branch })),
        });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    // ═══ Öğrenci Onayla (+ Öğretmen Ata) ═══
    if (action === 'approve-student') {
      const { userId, teacherId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      // Mevcut metadata'yı koru, sadece is_approved + assigned_teacher_id güncelle
      const { data: { user }, error: getErr } = await supabase.auth.admin.getUserById(userId);
      if (getErr || !user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

      const newMeta = {
        ...user.user_metadata,
        is_approved: true,
        ...(teacherId ? { assigned_teacher_id: teacherId } : {}),
      };

      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: newMeta,
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      // profiles tablosunda da güncelle
      await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);

      return NextResponse.json({ success: true });
    }

    // ═══ Veli Onayla ═══
    if (action === 'approve-parent') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      const { data: { user }, error: getErr } = await supabase.auth.admin.getUserById(userId);
      if (getErr || !user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

      const newMeta = { ...user.user_metadata, is_approved: true };
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: newMeta,
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);

      return NextResponse.json({ success: true });
    }

    // ═══ Öğrenci/Veli Reddet (purge) ═══
    if (action === 'reject-student' || action === 'reject-parent') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      const result = await purgeUser(supabase, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    // ═══ Atanan Öğretmeni Değiştir (kayıtlı öğrenci için) ═══
    if (action === 'reassign-student-teacher') {
      const { userId, teacherId } = body;
      if (!userId || !teacherId) return NextResponse.json({ error: 'userId ve teacherId gerekli' }, { status: 400 });

      const { data: { user }, error: getErr } = await supabase.auth.admin.getUserById(userId);
      if (getErr || !user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

      const newMeta = { ...user.user_metadata, assigned_teacher_id: teacherId };
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: newMeta,
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    // ═══════════════════════════════════════════════════════════
    // ═══ TÜM TESTLER & RAPORLAR (öğretmen-öğrenci hiyerarşisinden bağımsız)
    // ═══════════════════════════════════════════════════════════

    // Yardımcı: Öğrenci ID'lerinden isim + atanan öğretmen haritası kur
    async function buildStudentMap(studentIds: string[]) {
      if (studentIds.length === 0) return new Map<string, { full_name: string; teacher_name: string | null; teacher_id: string | null }>();

      // auth.users metadata (assigned_teacher_id için)
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const userMetaMap = new Map<string, Record<string, unknown>>();
      (users || []).forEach(u => userMetaMap.set(u.id, u.user_metadata || {}));

      // profiles tablosu (full_name için)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name as string]));

      // Atanan öğretmen ID'leri
      const teacherIds = Array.from(new Set(
        studentIds
          .map(id => (userMetaMap.get(id)?.assigned_teacher_id as string) || null)
          .filter(Boolean) as string[]
      ));
      let teacherNameMap = new Map<string, string>();
      if (teacherIds.length > 0) {
        const { data: tProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);
        teacherNameMap = new Map((tProfiles || []).map(p => [p.id, p.full_name as string]));
        // profiles'da olmayan öğretmenler için user_metadata.full_name'e fallback
        teacherIds.forEach(tid => {
          if (!teacherNameMap.has(tid)) {
            const meta = userMetaMap.get(tid);
            if (meta?.full_name) teacherNameMap.set(tid, meta.full_name as string);
          }
        });
      }

      const result = new Map<string, { full_name: string; teacher_name: string | null; teacher_id: string | null }>();
      studentIds.forEach(sid => {
        const meta = userMetaMap.get(sid) || {};
        const tid = (meta.assigned_teacher_id as string) || null;
        result.set(sid, {
          full_name: profileMap.get(sid) || (meta.full_name as string) || '—',
          teacher_id: tid,
          teacher_name: tid ? (teacherNameMap.get(tid) || '—') : null,
        });
      });
      return result;
    }

    if (action === 'list-all-tests') {
      try {
        const { data: tests, error } = await supabase
          .from('test_results')
          .select('id, student_id, test_type, completed_at, ai_report')
          .order('completed_at', { ascending: false })
          .limit(2000);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const studentIds = Array.from(new Set((tests || []).map(t => t.student_id as string).filter(Boolean)));
        const studentMap = await buildStudentMap(studentIds);

        const enriched = (tests || []).map(t => {
          const s = studentMap.get(t.student_id as string);
          return {
            id: t.id,
            student_id: t.student_id,
            student_name: s?.full_name || '—',
            teacher_id: s?.teacher_id || null,
            teacher_name: s?.teacher_name || null,
            test_type: t.test_type,
            completed_at: t.completed_at,
            has_report: t.ai_report !== null,
          };
        });

        return NextResponse.json({ tests: enriched });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    if (action === 'list-all-reports') {
      try {
        // Tekil raporlar (test_results.ai_report not null)
        const { data: singles, error: sErr } = await supabase
          .from('test_results')
          .select('id, student_id, test_type, completed_at, ai_report_generated_at')
          .not('ai_report', 'is', null)
          .order('ai_report_generated_at', { ascending: false, nullsFirst: false })
          .limit(2000);
        if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

        // Entegre raporlar
        const { data: integrated, error: iErr } = await supabase
          .from('integrated_reports')
          .select('id, student_id, generated_at')
          .order('generated_at', { ascending: false })
          .limit(2000);
        if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

        // Holistic raporlar (varsa)
        const { data: holistic } = await supabase
          .from('holistic_reports')
          .select('id, student_id, generated_at')
          .order('generated_at', { ascending: false })
          .limit(2000);

        const allStudentIds = Array.from(new Set([
          ...(singles || []).map(r => r.student_id as string),
          ...(integrated || []).map(r => r.student_id as string),
          ...(holistic || []).map(r => r.student_id as string),
        ].filter(Boolean)));
        const studentMap = await buildStudentMap(allStudentIds);

        const reports: Array<{
          id: string; student_id: string; student_name: string;
          teacher_id: string | null; teacher_name: string | null;
          report_kind: 'single' | 'integrated' | 'holistic';
          test_type: string | null; generated_at: string;
        }> = [];

        (singles || []).forEach(r => {
          const s = studentMap.get(r.student_id as string);
          reports.push({
            id: r.id as string,
            student_id: r.student_id as string,
            student_name: s?.full_name || '—',
            teacher_id: s?.teacher_id || null,
            teacher_name: s?.teacher_name || null,
            report_kind: 'single',
            test_type: r.test_type as string,
            generated_at: (r.ai_report_generated_at || r.completed_at) as string,
          });
        });
        (integrated || []).forEach(r => {
          const s = studentMap.get(r.student_id as string);
          reports.push({
            id: r.id as string,
            student_id: r.student_id as string,
            student_name: s?.full_name || '—',
            teacher_id: s?.teacher_id || null,
            teacher_name: s?.teacher_name || null,
            report_kind: 'integrated',
            test_type: null,
            generated_at: r.generated_at as string,
          });
        });
        (holistic || []).forEach(r => {
          const s = studentMap.get(r.student_id as string);
          reports.push({
            id: r.id as string,
            student_id: r.student_id as string,
            student_name: s?.full_name || '—',
            teacher_id: s?.teacher_id || null,
            teacher_name: s?.teacher_name || null,
            report_kind: 'holistic',
            test_type: null,
            generated_at: r.generated_at as string,
          });
        });

        // Tarih sırasına göre sırala
        reports.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());

        return NextResponse.json({ reports });
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // ═══ ŞİFRE SIFIRLAMA (proaktif + talep yönetimi)
    // ═══════════════════════════════════════════════════════════

    // Yardımcı: güçlü rastgele şifre üret (tek parça 12 karakter, karışmayacak karakterler)
    function generateRandomPassword(): string {
      // Karışıklığı azaltmak için 0/O, 1/I/l, 5/S gibi karakterler atılır
      const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
      const lower = 'abcdefghjkmnpqrstuvwxyz';
      const digits = '23456789';
      const all = upper + lower + digits;

      // Crypto random
      const cryptoObj = (globalThis as { crypto?: Crypto }).crypto || require('crypto').webcrypto;
      const buf = new Uint8Array(12);
      cryptoObj.getRandomValues(buf);

      // En az 1 büyük + 1 küçük + 2 rakam garantisi (toplam 12 karakter)
      const pick = (set: string, idx: number) => set[buf[idx] % set.length];
      const chars = [
        pick(upper, 0),
        pick(lower, 1),
        pick(digits, 2),
        pick(digits, 3),
        ...Array.from({ length: 8 }, (_, i) => pick(all, i + 4)),
      ];

      // Karıştır
      for (let i = chars.length - 1; i > 0; i--) {
        const j = buf[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }

      // Tek parça 12 karakter — tire yok, yanlış yazma riski minimum
      // (Tire mobil klavye / WhatsApp / SMS'te bazı sistemlerde başka karaktere
      // dönüşebilir, bu yüzden kullanılmıyor.)
      return chars.join('');
    }

    // ═══ Belirli bir kullanıcının şifresini sıfırla, yeni şifreyi geri döndür ═══
    if (action === 'reset-user-password') {
      const { userId } = body;
      if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 });

      // Kullanıcıyı bul (loglama / metadata için)
      const { data: { user }, error: getErr } = await supabase.auth.admin.getUserById(userId);
      if (getErr || !user) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
      }

      // Şifre üret + güncelle + must_change_password flag'ini set et
      const newPassword = generateRandomPassword();
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          must_change_password: true,
        },
      });
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      // Eğer bu kullanıcı için bekleyen şifre talebi varsa otomatik resolve et
      try {
        await supabase
          .from('password_reset_requests')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            notes: 'Yönetici master panel üzerinden sıfırlandı',
          })
          .eq('user_id', userId)
          .eq('status', 'pending');
      } catch { /* tablo veya kayıt yoksa sessizce geç */ }

      return NextResponse.json({
        success: true,
        new_password: newPassword,
        user: {
          id: user.id,
          email: user.email,
          full_name: (user.user_metadata?.full_name as string) || '—',
          role: (user.user_metadata?.role as string) || '—',
        },
      });
    }

    // ═══ Şifre Talepleri listesini getir ═══
    if (action === 'list-password-requests') {
      const { status: statusFilter } = body;
      const { data: requests, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('status', statusFilter || 'pending')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        // Tablo yoksa boş döndür
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          return NextResponse.json({ requests: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // user_id'leri alıp profilleri çek (rol bilgisi için)
      const userIds = Array.from(new Set((requests || []).map(r => r.user_id).filter(Boolean) as string[]));
      let userMap = new Map<string, { full_name: string; role: string; email: string }>();
      if (userIds.length > 0) {
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        (users || []).forEach(u => {
          if (userIds.includes(u.id)) {
            userMap.set(u.id, {
              full_name: (u.user_metadata?.full_name as string) || '—',
              role: (u.user_metadata?.role as string) || '—',
              email: u.email || '—',
            });
          }
        });
      }

      const enriched = (requests || []).map(r => ({
        ...r,
        user_full_name: r.user_id ? (userMap.get(r.user_id)?.full_name || '—') : '—',
        user_role: r.user_id ? (userMap.get(r.user_id)?.role || '—') : '—',
        user_email: r.user_id ? (userMap.get(r.user_id)?.email || r.email || '—') : (r.email || '—'),
      }));

      return NextResponse.json({ requests: enriched });
    }

    // ═══ Şifre Talebini İptal Et (kullanıcı kendi vazgeçti veya geçersiz) ═══
    if (action === 'cancel-password-request') {
      const { requestId, notes } = body;
      if (!requestId) return NextResponse.json({ error: 'requestId gerekli' }, { status: 400 });

      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'cancelled',
          resolved_at: new Date().toISOString(),
          notes: (notes || 'İptal edildi').slice(0, 500),
        })
        .eq('id', requestId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    console.error('[yonetici API]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
