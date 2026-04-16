/**
 * /api/teacher/students
 * - action: 'list'                  → tüm öğrencileri okul → sınıf → ad-soyad gruplaması ile getir
 * - action: 'detail'                → tek öğrencinin yaptığı + atanan testleri + raporları getir
 * - action: 'assign'                → seçili testleri öğrenciye ata (user_metadata.assigned_tests)
 * - action: 'unassign'              → bir test atamasını kaldır
 *
 * Auth: secureFetch CSRF + login zorunlu (proxy halletti).
 * Atamalar user_metadata.assigned_tests dizisinde tutulur — DB schema değişikliği yok.
 * Tamamlanan testler test_results'tan gelir, otomatik filtrelenir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { calculateCorrelation, identifyPatterns } from '@/lib/services/correlation';
import { calculateRiskScore } from '@/lib/services/riskScore';
import { matchCareers } from '@/lib/services/careerMatch';

const ALL_TESTS = [
  'enneagram', 'vark', 'holland', 'coklu_zeka', 'sinav_kaygisi',
  'calisma_davranisi', 'akademik_analiz', 'hizli_okuma', 'd2_dikkat', 'sag_sol_beyin',
];

// DB'de hem tireli hem alt çizgili kayıt olabilir — normalize ediyoruz
const normalize = (s: string) => (s || '').replace(/-/g, '_');

export async function POST(req: NextRequest) {
  try {
    // ── Auth: kullanıcı giriş yapmış öğretmen mi? ──
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const role = user.user_metadata?.role || (await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role;
    if (role !== 'teacher') return NextResponse.json({ error: 'Sadece öğretmenler' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    const admin = createAdminClient();

    // ═══ LIST: SADECE bu öğretmene atanan öğrenciler ═══
    // Yapı: { active: { Okul → Sınıf → Şube → [öğrenci] }, graduated: { Okul → [öğrenci] } }
    if (action === 'list') {
      const teacherId = user.id;

      // Önce tüm öğrenci profillerini çek
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, grade, school_id, created_at')
        .eq('role', 'student')
        .order('full_name');

      // Tüm öğrenci user_metadata
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const metaMap = new Map<string, Record<string, unknown>>();
      (users || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

      // Schools tablosu fallback
      const schoolIds = [...new Set((profiles || []).map((p) => p.school_id).filter(Boolean))];
      const schoolNameMap: Record<string, string> = {};
      if (schoolIds.length > 0) {
        const { data: schools } = await admin.from('schools').select('id, name').in('id', schoolIds as string[]);
        (schools || []).forEach((s) => { schoolNameMap[s.id] = s.name; });
      }

      // SADECE bu öğretmene atanmış öğrenciler
      const myStudents = (profiles || []).filter((p) => {
        const meta = metaMap.get(p.id) || {};
        return (meta.assigned_teacher_id as string) === teacherId;
      });

      // Tamamlanan testler
      const studentIds = myStudents.map((p) => p.id);
      const completedMap = new Map<string, Set<string>>();
      if (studentIds.length > 0) {
        const { data: results } = await admin
          .from('test_results')
          .select('student_id, test_type')
          .in('student_id', studentIds);
        (results || []).forEach((r) => {
          if (!completedMap.has(r.student_id)) completedMap.set(r.student_id, new Set());
          completedMap.get(r.student_id)!.add(normalize(r.test_type));
        });
      }

      type StudentRow = {
        id: string; full_name: string; grade: string | null; section: string | null;
        completed_count: number; assigned_pending_count: number;
      };

      // Aktif: school → grade → section → [students]
      const active: Record<string, Record<string, Record<string, StudentRow[]>>> = {};
      // Mezunlar: school → [students]
      const graduated: Record<string, StudentRow[]> = {};

      myStudents.forEach((p) => {
        const meta = metaMap.get(p.id) || {};
        const schoolName = (meta.school_name as string) || schoolNameMap[p.school_id || ''] || 'Okulsuz';
        const isGraduated = !!meta.is_graduated;
        const grade = p.grade || (meta.grade as string) || '';
        const section = (meta.section as string) || '';
        const completed = completedMap.get(p.id) || new Set();
        const assigned = (meta.assigned_tests as string[]) || [];
        const pending = assigned.filter((t) => !completed.has(normalize(t)));

        const row: StudentRow = {
          id: p.id,
          full_name: p.full_name,
          grade: grade || null,
          section: section || null,
          completed_count: completed.size,
          assigned_pending_count: pending.length,
        };

        if (isGraduated) {
          if (!graduated[schoolName]) graduated[schoolName] = [];
          graduated[schoolName].push(row);
        } else {
          const gradeKey = grade ? `${grade}. Sınıf` : 'Sınıfsız';
          const sectionKey = section ? `${grade}/${section}` : 'Şubesiz';
          if (!active[schoolName]) active[schoolName] = {};
          if (!active[schoolName][gradeKey]) active[schoolName][gradeKey] = {};
          if (!active[schoolName][gradeKey][sectionKey]) active[schoolName][gradeKey][sectionKey] = [];
          active[schoolName][gradeKey][sectionKey].push(row);
        }
      });

      return NextResponse.json({ active, graduated });
    }

    // ═══ DETAIL: bir öğrencinin yapılan + yapılacak testleri + raporları ═══
    if (action === 'detail') {
      const { studentId } = body;
      if (!studentId) return NextResponse.json({ error: 'studentId gerekli' }, { status: 400 });

      // Profil
      const { data: profile } = await admin
        .from('profiles')
        .select('id, full_name, grade, school_id')
        .eq('id', studentId)
        .maybeSingle();

      if (!profile) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });

      // user_metadata
      const { data: authUser } = await admin.auth.admin.getUserById(studentId);
      const meta = (authUser?.user?.user_metadata || {}) as Record<string, unknown>;
      const schoolName = (meta.school_name as string) || '—';
      const grade = profile.grade || (meta.grade as string) || null;
      const assignedTests = ((meta.assigned_tests as string[]) || []);

      // Tamamlanan testler (ai_report ve scores dahil)
      const { data: results } = await admin
        .from('test_results')
        .select('id, test_type, completed_at, ai_report, ai_report_generated_at, scores')
        .eq('student_id', studentId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const completedTests = results || [];
      const completedTypes = new Set(completedTests.map((r) => normalize(r.test_type)));

      // Yapılacak = tüm testler − tamamlananlar (normalize edilmiş)
      const pendingTypes = ALL_TESTS.filter((t) => !completedTypes.has(normalize(t)));

      // Atanmış ama henüz tamamlanmamış testler (uyarı için)
      const activeAssignments = assignedTests.filter((t) => !completedTypes.has(normalize(t)));

      // Bütüncül (Harmanlanmış) Rapor — holistic_reports tablosundan (çoklu kayıt)
      let holisticReport: { text: string; generated_at: string } | null = null;
      let holisticReports: Array<{
        id: string;
        text: string;
        selected_test_types: string[];
        test_count: number;
        generated_at: string;
      }> = [];
      try {
        const { data: hrList } = await admin
          .from('holistic_reports')
          .select('id, report_text, selected_test_types, test_count, generated_at')
          .eq('student_id', studentId)
          .order('generated_at', { ascending: false });
        if (Array.isArray(hrList) && hrList.length > 0) {
          holisticReports = hrList.map(hr => ({
            id: hr.id,
            text: hr.report_text,
            selected_test_types: Array.isArray(hr.selected_test_types) ? hr.selected_test_types : [],
            test_count: hr.test_count || 0,
            generated_at: hr.generated_at,
          }));
          // Geriye uyum: en yeni raporu tekil field olarak da ver
          holisticReport = { text: hrList[0].report_text, generated_at: hrList[0].generated_at };
        }
      } catch { /* tablo yoksa sessizce geç */ }

      // Entegre 3'lü Rapor — integrated_reports tablosundan
      const { data: ir } = await admin
        .from('integrated_reports')
        .select('teacher_report, student_report, parent_report, generated_at')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // ═══ İLERİ ANALİZ ═══
      // Kural: Yapılan tüm testlerin raporu üretilmişse İleri Analiz açılır
      // (en az 2 test gerekli — 1 testle korelasyon hesaplanamaz)
      const allReportsReady = completedTests.length >= 2 && completedTests.every((c) => !!c.ai_report);
      let advanced: {
        unlocked: boolean;
        riskScore?: ReturnType<typeof calculateRiskScore>;
        correlation?: ReturnType<typeof calculateCorrelation>;
        patterns?: ReturnType<typeof identifyPatterns>;
        career?: ReturnType<typeof matchCareers>;
      } = { unlocked: false };

      if (allReportsReady) {
        // Her test tipinden EN SON sonucu al (correlation/risk fonksiyonlarının beklediği format)
        const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
        for (const r of completedTests) {
          if (!latestByType.has(r.test_type)) {
            latestByType.set(r.test_type, {
              test_type: r.test_type,
              scores: r.scores as Record<string, unknown>,
            });
          }
        }
        const studentResults = Array.from(latestByType.values());

        try {
          advanced = {
            unlocked: true,
            riskScore: calculateRiskScore(studentResults),
            correlation: calculateCorrelation(studentResults),
            patterns: identifyPatterns(studentResults),
            career: matchCareers(studentResults),
          };
        } catch (e) {
          console.error('[advanced analysis]', e);
          advanced = { unlocked: false };
        }
      }

      return NextResponse.json({
        student: {
          id: profile.id,
          full_name: profile.full_name,
          grade: grade,
          school_name: schoolName,
        },
        completedTests: completedTests.map((r) => ({
          id: r.id,
          test_type: r.test_type,
          completed_at: r.completed_at,
          has_report: !!r.ai_report,
          ai_report: r.ai_report || null,
          ai_report_generated_at: r.ai_report_generated_at,
          scores: r.scores,
        })),
        pendingTypes,
        activeAssignments,
        holisticReport,
        holisticReports,
        integratedReport: ir || null,
        advanced,
      });
    }

    // ═══ ASSIGN: testleri öğrenciye ata ═══
    if (action === 'assign') {
      const { studentId, testTypes } = body;
      if (!studentId || !Array.isArray(testTypes) || testTypes.length === 0) {
        return NextResponse.json({ error: 'studentId ve testTypes gerekli' }, { status: 400 });
      }

      // Geçerli test tipleri mi?
      const valid = testTypes.filter((t: string) => ALL_TESTS.includes(t));
      if (valid.length === 0) return NextResponse.json({ error: 'Geçerli test yok' }, { status: 400 });

      // Mevcut user_metadata'yı al
      const { data: authUser } = await admin.auth.admin.getUserById(studentId);
      if (!authUser?.user) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });

      const meta = (authUser.user.user_metadata || {}) as Record<string, unknown>;
      const existing = ((meta.assigned_tests as string[]) || []);
      const merged = [...new Set([...existing, ...valid])];

      const { error: updateErr } = await admin.auth.admin.updateUserById(studentId, {
        user_metadata: { ...meta, assigned_tests: merged },
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      return NextResponse.json({ success: true, assigned: merged });
    }

    // ═══ UNASSIGN: bir test atamasını kaldır ═══
    if (action === 'unassign') {
      const { studentId, testType } = body;
      if (!studentId || !testType) {
        return NextResponse.json({ error: 'studentId ve testType gerekli' }, { status: 400 });
      }

      const { data: authUser } = await admin.auth.admin.getUserById(studentId);
      if (!authUser?.user) return NextResponse.json({ error: 'Öğrenci bulunamadı' }, { status: 404 });

      const meta = (authUser.user.user_metadata || {}) as Record<string, unknown>;
      const existing = ((meta.assigned_tests as string[]) || []);
      const filtered = existing.filter((t) => t !== testType);

      const { error: updateErr } = await admin.auth.admin.updateUserById(studentId, {
        user_metadata: { ...meta, assigned_tests: filtered },
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      return NextResponse.json({ success: true, assigned: filtered });
    }

    // ═══ COMPLETED-TESTS-LOG: tüm tamamlanmış testlerin düz listesi ═══
    if (action === 'completed-tests-log') {
      // Tüm öğrencileri çek
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, grade, school_id')
        .eq('role', 'student');

      const profileMap = new Map<string, { full_name: string; grade: string | null; school_id: string | null }>();
      (profiles || []).forEach((p) => profileMap.set(p.id, p));

      // Auth metadata (school_name + grade fallback için)
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const metaMap = new Map<string, Record<string, unknown>>();
      (users || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

      // Schools tablosu (school_id eşleşmesi için)
      const schoolIds = [...new Set((profiles || []).map((p) => p.school_id).filter(Boolean))];
      const schoolNameMap: Record<string, string> = {};
      if (schoolIds.length > 0) {
        const { data: schools } = await admin.from('schools').select('id, name').in('id', schoolIds as string[]);
        (schools || []).forEach((s) => { schoolNameMap[s.id] = s.name; });
      }

      // Tüm tamamlanmış test_results
      const studentIds = Array.from(profileMap.keys());
      let logs: Array<{
        id: string;
        student_id: string;
        student_name: string;
        school_name: string;
        class_name: string;
        test_type: string;
        completed_at: string;
        has_report: boolean;
      }> = [];

      if (studentIds.length > 0) {
        const { data: results } = await admin
          .from('test_results')
          .select('id, student_id, test_type, completed_at, ai_report')
          .in('student_id', studentIds)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        logs = (results || []).map((r) => {
          const p = profileMap.get(r.student_id);
          const meta = metaMap.get(r.student_id) || {};
          const schoolName = (meta.school_name as string)
            || schoolNameMap[p?.school_id || '']
            || 'Okulsuz';
          const grade = p?.grade || (meta.grade as string) || '';
          const className = grade ? `${grade}. Sınıf` : 'Sınıfsız';

          return {
            id: r.id,
            student_id: r.student_id,
            student_name: p?.full_name || '—',
            school_name: schoolName,
            class_name: className,
            test_type: r.test_type,
            completed_at: r.completed_at,
            has_report: !!r.ai_report,
          };
        });
      }

      return NextResponse.json({ logs });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    console.error('[teacher/students API]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
