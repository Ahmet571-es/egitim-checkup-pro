import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const format = searchParams.get('format'); // 'pdf' | 'docx'
    const reportId = searchParams.get('id'); // opsiyonel — belirli bir rapor geçmişten

    if (!studentId) {
      return NextResponse.json({ error: 'student_id gereklidir.' }, { status: 400 });
    }
    if (!format || !['pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: 'format "pdf" veya "docx" olmalıdır.' }, { status: 400 });
    }

    const supabase = await createClient();

    // AUTH
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    // Öğrenci bilgisi
    const { data: student } = await supabase
      .from('profiles')
      .select('full_name, school_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // Entegre raporu getir — id verildiyse o rapor, yoksa en sonuncusu
    let ir: {
      teacher_report: string | null;
      student_report: string | null;
      parent_report: string | null;
      generated_at: string | null;
    } | null = null;

    if (reportId) {
      const { data } = await supabase
        .from('integrated_reports')
        .select('teacher_report, student_report, parent_report, generated_at')
        .eq('id', reportId)
        .eq('student_id', studentId)
        .maybeSingle();
      ir = data;
    } else {
      const { data } = await supabase
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

    // Test sayısını al
    const { count: testCount } = await supabase
      .from('test_results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .not('completed_at', 'is', null);

    // Okul adı
    let schoolName: string | undefined;
    if (student.school_id) {
      const { data: school } = await supabase
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
