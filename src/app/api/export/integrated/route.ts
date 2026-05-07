import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * GET /api/export/integrated?student_id=<uuid>&format=<pdf|docx>&id=<uuid?>
 *
 * Entegre rapor (öğretmen + öğrenci + veli versiyonları) PDF/DOCX export.
 *
 * Güvenlik modeli (genetic-reports/download endpoint'i ile aynı):
 *  - Auth: cookie session via createClient (user client)
 *  - Veri sorguları: admin client (RLS bypass)
 *  - Her rol için explicit yetki kontrolü:
 *      • student      → sadece kendi (student_id === user.id)
 *      • parent       → parent_students bağı
 *      • teacher      → user_metadata.assigned_teacher_id === user.id
 *      • school_admin → student.school_id === viewer.school_id
 *      • admin        → tam erişim
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const format = searchParams.get('format'); // 'pdf' | 'docx'
    const reportId = searchParams.get('id'); // opsiyonel — geçmişten belirli bir rapor

    if (!studentId) {
      return NextResponse.json({ error: 'student_id gereklidir.' }, { status: 400 });
    }
    if (!format || !['pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: 'format "pdf" veya "docx" olmalıdır.' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // AUTH
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    // Caller profile (admin ile, RLS edge-case'leri aşmak için)
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // ── Rol bazlı izin kontrolü ──
    if (callerProfile.role === 'student') {
      if (studentId !== user.id) {
        return NextResponse.json(
          { error: 'Yalnızca kendi raporlarınızı indirebilirsiniz.' },
          { status: 403 },
        );
      }
    } else if (callerProfile.role === 'parent') {
      const { data: link } = await admin
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', studentId)
        .maybeSingle();
      if (!link) {
        return NextResponse.json(
          { error: 'Yalnızca kendi çocuğunuzun raporlarını indirebilirsiniz.' },
          { status: 403 },
        );
      }
    } else if (callerProfile.role === 'teacher') {
      const { data: studentAuth } = await admin.auth.admin.getUserById(studentId);
      const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Bu öğrenci size atanmış değil.' },
          { status: 403 },
        );
      }
    }
    // school_admin: aşağıda student.school_id kontrolü yapılıyor
    // admin: tam erişim

    // Öğrenci bilgisi (admin ile)
    const { data: student } = await admin
      .from('profiles')
      .select('full_name, school_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // School admin için okul kontrolü
    if (callerProfile.role === 'school_admin' && student.school_id !== callerProfile.school_id) {
      return NextResponse.json(
        { error: 'Bu öğrenciye erişim yetkiniz yok.' },
        { status: 403 },
      );
    }

    // Entegre raporu getir — id verildiyse o rapor, yoksa en sonuncusu
    let ir: {
      teacher_report: string | null;
      student_report: string | null;
      parent_report: string | null;
      generated_at: string | null;
    } | null = null;

    if (reportId) {
      const { data } = await admin
        .from('integrated_reports')
        .select('teacher_report, student_report, parent_report, generated_at')
        .eq('id', reportId)
        .eq('student_id', studentId)
        .maybeSingle();
      ir = data;
    } else {
      const { data } = await admin
        .from('integrated_reports')
        .select('teacher_report, student_report, parent_report, generated_at')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      ir = data;
    }

    if (!ir) {
      return NextResponse.json({ error: 'Bu öğrenci için entegre rapor bulunamadı.' }, { status: 404 });
    }

    if (!ir.teacher_report && !ir.student_report && !ir.parent_report) {
      return NextResponse.json({ error: 'Rapor içerikleri boş.' }, { status: 400 });
    }

    // Test sayısını al (admin)
    const { count: testCount } = await admin
      .from('test_results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .not('completed_at', 'is', null);

    // Okul adı
    let schoolName: string | undefined;
    if (student.school_id) {
      const { data: school } = await admin
        .from('schools')
        .select('name')
        .eq('id', student.school_id)
        .single();
      schoolName = school?.name;
    }

    const reports = {
      ogretmen: ir.teacher_report ?? '',
      ogrenci: ir.student_report ?? '',
      ebeveyn: ir.parent_report ?? '',
    };

    const meta = {
      studentName: student.full_name ?? 'Öğrenci',
      generatedAt: ir.generated_at ?? undefined,
      schoolName,
      testCount: testCount ?? undefined,
    };

    const safeName = (student.full_name ?? 'ogrenci').replace(/\s+/g, '_');

    if (format === 'pdf') {
      const { generateIntegratedPdf } = await import('@/lib/export/integrated-generator');
      const buffer = await generateIntegratedPdf(reports, meta);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_entegre_rapor.pdf"`,
        },
      });
    }

    if (format === 'docx') {
      const { generateIntegratedDocx } = await import('@/lib/export/integrated-generator');
      const buffer = await generateIntegratedDocx(reports, meta);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}_entegre_rapor.docx"`,
        },
      });
    }

    return NextResponse.json({ error: 'Desteklenmeyen format.' }, { status: 400 });
  } catch (err) {
    console.error('[integrated-export]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Export sırasında hata oluştu.', detail: msg }, { status: 500 });
  }
}
