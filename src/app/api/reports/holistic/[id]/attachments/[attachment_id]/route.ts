/**
 * DELETE /api/reports/holistic/[id]/attachments/[attachment_id]
 *
 * Bir holistic rapora eklenmiş genetik PDF bağlantısını kaldırır.
 * Genetik PDF dosyası SİLİNMEZ — sadece bu raporla bağlantısı kopar.
 *
 * KVKK m.6 — Yetki: admin / school_admin / teacher (kendi kapsamında).
 *   student / parent → 403 (HİÇBİR ŞEY)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachment_id: string }> },
) {
  try {
    const { id: reportId, attachment_id: attachmentId } = await context.params;
    if (!reportId || !attachmentId) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // KVKK m.6: student/parent reddedilir
    if (callerProfile.role === 'student' || callerProfile.role === 'parent') {
      return NextResponse.json(
        { error: 'Genetik rapor erişim yetkiniz yok.' },
        { status: 403 },
      );
    }
    if (!['admin', 'school_admin', 'teacher'].includes(callerProfile.role || '')) {
      return NextResponse.json({ error: 'Yetkisiz rol.' }, { status: 403 });
    }

    // Attachment'ın bu rapora ait olduğunu doğrula
    const { data: attach } = await admin
      .from('holistic_report_attachments')
      .select('id, holistic_report_id')
      .eq('id', attachmentId)
      .maybeSingle();

    if (!attach || attach.holistic_report_id !== reportId) {
      return NextResponse.json({ error: 'Bağlantı bulunamadı.' }, { status: 404 });
    }

    // Raporun yetki bilgilerini çek
    const { data: report } = await admin
      .from('holistic_reports')
      .select('student_id, school_id')
      .eq('id', reportId)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    // Cross-school
    if (
      callerProfile.role === 'school_admin' &&
      callerProfile.school_id &&
      report.school_id &&
      report.school_id !== callerProfile.school_id
    ) {
      return NextResponse.json(
        { error: 'Bu rapora erişim yetkiniz yok.' },
        { status: 403 },
      );
    }

    // Teacher → kendine atanmış öğrenci mi
    if (callerProfile.role === 'teacher') {
      const { data: studentAuth } = await admin.auth.admin.getUserById(report.student_id);
      const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Bu öğrenci size atanmış değil.' },
          { status: 403 },
        );
      }
    }

    const { error: deleteErr } = await admin
      .from('holistic_report_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteErr) {
      console.error('[holistic/attachments DELETE]', deleteErr);
      return NextResponse.json(
        { error: 'Silinemedi: ' + deleteErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[holistic/attachments DELETE]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
