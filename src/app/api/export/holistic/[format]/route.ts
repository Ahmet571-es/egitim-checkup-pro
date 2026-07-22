import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildContentDisposition } from '@/lib/export/content-disposition';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * GET /api/export/holistic/[format]?id=<holistic_report_id>
 * format: pdf | docx
 *
 * Belirli bir harmanlanmış raporu PDF veya DOCX olarak export eder.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ format: string }> }
) {
  try {
    const { format } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    // FAZ 2C: Infografik tema
    const audienceParam = searchParams.get('audience');
    const audience: 'ogretmen' | 'ogrenci' | 'ebeveyn' =
      audienceParam === 'ogrenci' || audienceParam === 'ebeveyn'
        ? audienceParam
        : 'ogretmen';

    if (!id) {
      return NextResponse.json({ error: 'id zorunludur.' }, { status: 400 });
    }

    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: `Desteklenmeyen format: ${format}` }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // Auth kontrolü
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // Harmanlanmış raporu çek (admin — RLS bypass)
    const { data: hr, error: hrErr } = await admin
      .from('holistic_reports')
      .select('id, student_id, school_id, report_text, selected_test_types, test_count, generated_at, audience, package_type')
      .eq('id', id)
      .single();

    if (hrErr || !hr) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    // Yetki kontrolü
    if (callerProfile.role === 'student') {
      if (hr.student_id !== user.id) {
        return NextResponse.json({ error: 'Yalnızca kendi raporlarınızı indirebilirsiniz.' }, { status: 403 });
      }
      // Faz 9: paket raporu ise sadece 'student' audience erişilebilir
      if (hr.audience && hr.audience !== 'student') {
        return NextResponse.json(
          { error: 'Bu rapor versiyonu öğrencilere yönelik değil.' },
          { status: 403 },
        );
      }
    } else if (callerProfile.role === 'parent') {
      // Veli: sadece kendi çocuklarının raporunu indirebilir.
      // parent_students üzerinden doğrulama.
      const { data: link } = await admin
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', hr.student_id)
        .maybeSingle();
      if (!link) {
        return NextResponse.json(
          { error: 'Yalnızca kendi çocuğunuzun raporlarını indirebilirsiniz.' },
          { status: 403 },
        );
      }
      // Faz 9: paket raporu ise sadece 'parent' audience erişilebilir
      if (hr.audience && hr.audience !== 'parent') {
        return NextResponse.json(
          { error: 'Bu rapor versiyonu velilere yönelik değil.' },
          { status: 403 },
        );
      }
    } else {
      // Öğretmen / school_admin / admin
      if (callerProfile.role === 'teacher') {
        // Öğretmen: bu öğrenci size atanmış mı? (user_metadata.assigned_teacher_id)
        const { data: studentAuth } = await admin.auth.admin.getUserById(hr.student_id);
        const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
        if (assignedTeacherId !== user.id) {
          return NextResponse.json(
            { error: 'Bu öğrenci size atanmış değil.' },
            { status: 403 },
          );
        }
      } else if (callerProfile.role === 'school_admin') {
        // School admin: aynı okul mu?
        if (callerProfile.school_id && hr.school_id && hr.school_id !== callerProfile.school_id) {
          return NextResponse.json({ error: 'Bu rapor sizin okulunuza ait değil.' }, { status: 403 });
        }
      }
      // admin: tam erişim
      // Öğretmen/school_admin tüm audience'lara erişebilir (Faz 9: 3 versiyonu da görür)
    }

    // Öğrenci adını çek
    const { data: student } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', hr.student_id)
      .single();

    const safeName = (student?.full_name ?? 'ogrenci').replace(/\s+/g, '_');
    const dateLabel = hr.generated_at
      ? new Date(hr.generated_at).toLocaleDateString('tr-TR').replace(/\./g, '-')
      : 'tarih';

    const meta = {
      studentName: student?.full_name ?? 'Öğrenci',
      testName: `Harmanlanmış Rapor (${hr.test_count} test)`,
      reportType: 'Bütüncül Çoklu Test Analizi',
      audience,
      generatedAt: hr.generated_at ?? undefined,
    };

    // ── PDF ──
    if (format === 'pdf') {
      const { generateReportPdf } = await import('@/lib/export/pdf-generator');
      const buffer = await generateReportPdf(hr.report_text, meta);

      // Faz 6: Genetik PDF eklerini sona ek sayfa olarak göm.
      // Faz 9 KVKK m.6 kritik: SADECE 'teacher' audience'da genetik PDF gömülür.
      // 'parent' ve 'student' versiyonlarına ASLA gömülmez (özel kategori veri).
      // audience NULL ise eski Faz 6 raporu — genetik gömme davranışı korunur.
      const shouldEmbedGenetic = !hr.audience || hr.audience === 'teacher';

      let finalPdfBytes: Uint8Array;
      if (shouldEmbedGenetic) {
        const { mergeGeneticAttachments } = await import('@/lib/export/pdf-merger');
        finalPdfBytes = await mergeGeneticAttachments(buffer, hr.id, admin);
      } else {
        finalPdfBytes = new Uint8Array(buffer);
      }

      const audienceSuffix = hr.audience ? `_${hr.audience}` : '';
      const pkgSuffix = hr.package_type ? `_${hr.package_type}` : '';

      return new NextResponse(new Uint8Array(finalPdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': buildContentDisposition(
            `${safeName}_harmanlanmis_rapor${pkgSuffix}${audienceSuffix}_${dateLabel}.pdf`,
          ),
        },
      });
    }

    // ── DOCX ──
    const { generateReportDocx } = await import('@/lib/export/docx-generator');
    const buffer = await generateReportDocx(hr.report_text, meta);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': buildContentDisposition(
          `${safeName}_harmanlanmis_rapor_${dateLabel}.docx`,
        ),
      },
    });
  } catch (err) {
    console.error('[export/holistic]', err);
    console.error('[export/holistic]', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Export sırasında hata oluştu.' }, { status: 500 });
  }
}
