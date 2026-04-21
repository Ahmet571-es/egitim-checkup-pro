import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ format: string }> }
) {
  try {
    const { format } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const testResultId = searchParams.get('test_result_id');
    const classId = searchParams.get('class_id');
    const reportType = searchParams.get('report_type') ?? 'AI Analiz Raporu';
    // FAZ 2C: Infografik tema (ogretmen/ogrenci/ebeveyn). Varsayılan 'ogretmen'.
    const audienceParam = searchParams.get('audience');
    const audience: 'ogretmen' | 'ogrenci' | 'ebeveyn' =
      audienceParam === 'ogrenci' || audienceParam === 'ebeveyn'
        ? audienceParam
        : 'ogretmen';

    const supabase = await createClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();
    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }
    // Öğrenci sadece kendi verisini export edebilir
    if (callerProfile.role === 'student') {
      if (studentId && studentId !== user.id) {
        return NextResponse.json({ error: 'Yalnızca kendi verilerinizi dışa aktarabilirsiniz.' }, { status: 403 });
      }
      if (classId) {
        return NextResponse.json({ error: 'Sınıf bazlı dışa aktarım yetkiniz yok.' }, { status: 403 });
      }
    }

    // Veli: sadece kendi çocuklarının verisini export edebilir.
    // studentId VEYA testResultId üzerinden parent_students doğrulaması yapılır.
    if (callerProfile.role === 'parent') {
      if (classId) {
        return NextResponse.json({ error: 'Sınıf bazlı dışa aktarım yetkiniz yok.' }, { status: 403 });
      }

      // Doğrulanacak çocuk kimliğini belirle
      let targetStudentId: string | null = studentId;
      if (!targetStudentId && testResultId) {
        const { data: tr } = await supabase
          .from('test_results')
          .select('student_id')
          .eq('id', testResultId)
          .maybeSingle();
        targetStudentId = tr?.student_id ?? null;
      }

      if (!targetStudentId) {
        return NextResponse.json({ error: 'Hedef öğrenci belirlenemedi.' }, { status: 400 });
      }

      const { data: link } = await supabase
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', targetStudentId)
        .maybeSingle();

      if (!link) {
        return NextResponse.json(
          { error: 'Yalnızca kendi çocuğunuzun verilerini dışa aktarabilirsiniz.' },
          { status: 403 },
        );
      }
    }

    // Öğretmen/school_admin: sınıfın kendi okuluna ait olduğunu doğrula
    if (classId && callerProfile.school_id && ['teacher', 'school_admin'].includes(callerProfile.role)) {
      const { data: classCheck } = await supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .eq('school_id', callerProfile.school_id)
        .maybeSingle();
      if (!classCheck) {
        return NextResponse.json({ error: 'Bu sınıfa erişim yetkiniz yok.' }, { status: 403 });
      }
    }

    // ── EXCEL (Toplu Sınıf veya Öğrenci) ──
    if (format === 'excel') {
      const { generateStudentExcel, generateClassExcel } = await import('@/lib/export/excel-generator');

      if (classId) {
        // Sınıf bazlı toplu export
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id, profiles!class_students_student_id_fkey(full_name)')
          .eq('class_id', classId);

        const { data: classInfo } = await supabase
          .from('classes')
          .select('name')
          .eq('id', classId)
          .single();

        const studentsData = await Promise.all(
          (classStudents ?? []).map(async cs => {
            const profile = cs.profiles as unknown as { full_name: string } | null;
            const { data: results } = await supabase
              .from('test_results')
              .select('id, test_type, scores, completed_at, ai_report, ai_report_generated_at')
              .eq('student_id', cs.student_id)
              .not('completed_at', 'is', null);

            return {
              studentId: cs.student_id,
              studentName: profile?.full_name ?? 'Bilinmiyor',
              className: classInfo?.name ?? '—',
              testResults: (results ?? []).map(r => ({
                testType: r.test_type,
                testName: r.test_type,
                completedAt: r.completed_at,
                scores: r.scores ?? {},
                aiReport: r.ai_report,
                aiReportGeneratedAt: r.ai_report_generated_at,
              })),
            };
          })
        );

        const buffer = await generateClassExcel(studentsData, classInfo?.name);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="sinif_sonuclari_${classInfo?.name ?? classId}.xlsx"`,
          },
        });
      }

      if (!studentId) {
        return NextResponse.json({ error: 'student_id veya class_id gereklidir.' }, { status: 400 });
      }

      const { data: student } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', studentId)
        .single();

      const { data: results } = await supabase
        .from('test_results')
        .select('id, test_type, scores, completed_at, ai_report, ai_report_generated_at')
        .eq('student_id', studentId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const data = {
        studentId: studentId,
        studentName: student?.full_name ?? 'Öğrenci',
        testResults: (results ?? []).map(r => ({
          testType: r.test_type,
          testName: r.test_type,
          completedAt: r.completed_at,
          scores: r.scores ?? {},
          aiReport: r.ai_report,
          aiReportGeneratedAt: r.ai_report_generated_at,
        })),
      };

      const buffer = await generateStudentExcel(data);
      const safeName = (student?.full_name ?? 'ogrenci').replace(/\s+/g, '_');
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${safeName}_dosya.xlsx"`,
        },
      });
    }

    // ── PDF veya DOCX için test_result_id gerekli ──
    if (!testResultId) {
      return NextResponse.json({ error: 'test_result_id gereklidir.' }, { status: 400 });
    }

    const { data: testResult } = await supabase
      .from('test_results')
      .select('id, test_type, scores, ai_report, ai_report_generated_at, student_id')
      .eq('id', testResultId)
      .single();

    if (!testResult) {
      return NextResponse.json({ error: 'Test sonucu bulunamadı.' }, { status: 404 });
    }

    if (!testResult.ai_report) {
      return NextResponse.json({ error: 'Bu test için henüz AI raporu üretilmemiş.' }, { status: 400 });
    }

    const { data: student } = await supabase
      .from('profiles')
      .select('full_name, school_id')
      .eq('id', testResult.student_id)
      .single();

    const safeName = (student?.full_name ?? 'ogrenci').replace(/\s+/g, '_');
    const meta = {
      studentName: student?.full_name ?? 'Öğrenci',
      testName: testResult.test_type,
      reportType,
      audience,
      generatedAt: testResult.ai_report_generated_at ?? undefined,
    };

    // ── PDF ──
    if (format === 'pdf') {
      const { generateReportPdf } = await import('@/lib/export/pdf-generator');
      const buffer = await generateReportPdf(testResult.ai_report, meta);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_${testResult.test_type}_rapor.pdf"`,
        },
      });
    }

    // ── DOCX ──
    if (format === 'docx') {
      const { generateReportDocx } = await import('@/lib/export/docx-generator');
      const buffer = await generateReportDocx(testResult.ai_report, meta);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}_${testResult.test_type}_rapor.docx"`,
        },
      });
    }

    return NextResponse.json({ error: `Desteklenmeyen format: ${format}` }, { status: 400 });
  } catch (err) {
    console.error('[export]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Export sırasında hata oluştu.', detail: msg }, { status: 500 });
  }
}
