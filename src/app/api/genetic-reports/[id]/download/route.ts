/**
 * GET /api/genetic-reports/[id]/download
 *
 * Faz 5: Genetik rapor PDF indirme — signed URL üretir
 *
 * KVKK m.6 — Aynı erişim matrisi list endpoint'i ile:
 *   • admin → tüm raporlar
 *   • school_admin → kendi okul öğrencileri
 *   • teacher → kendine atanmış öğrenciler
 *   • student / parent → 403
 *
 * Response: { signed_url: string, expires_in: 60 }
 *   • Signed URL 60 saniye geçerli (kısa süre — KVKK için).
 *   • Bu URL'i client tarayıcısı doğrudan kullanır (window.open / download).
 *   • URL'in süresi dolduktan sonra tekrar bu endpoint çağrılır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET_NAME = 'genetic-reports';
const SIGNED_URL_TTL = 60; // saniye

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Rapor ID zorunlu.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const role =
      (user.user_metadata?.role as string) ||
      (await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role;

    if (role === 'student' || role === 'parent') {
      return NextResponse.json(
        { error: 'Genetik rapora erişim yetkiniz yok.' },
        { status: 403 }
      );
    }
    if (!['admin', 'school_admin', 'teacher'].includes(role || '')) {
      return NextResponse.json({ error: 'Yetkisiz rol.' }, { status: 403 });
    }

    const admin = createAdminClient();

    // ── Rapor + öğrenci bilgisi ──
    const { data: report } = await admin
      .from('genetic_reports')
      .select('id, file_path, original_filename, student_id')
      .eq('id', id)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    const { data: student } = await admin
      .from('profiles')
      .select('id, school_id')
      .eq('id', report.student_id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci kaydı bulunamadı.' }, { status: 404 });
    }

    // ── Scope kontrolü (list endpoint ile aynı kurallar) ──
    if (role === 'school_admin') {
      const { data: viewerProfile } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!viewerProfile?.school_id || student.school_id !== viewerProfile.school_id) {
        return NextResponse.json(
          { error: 'Bu rapora erişim yetkiniz yok.' },
          { status: 403 }
        );
      }
    } else if (role === 'teacher') {
      const { data: studentAuth } = await admin.auth.admin.getUserById(report.student_id);
      const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Bu öğrenci size atanmış değil.' },
          { status: 403 }
        );
      }
    }

    // ── Signed URL üret ──
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(report.file_path, SIGNED_URL_TTL, {
        download: report.original_filename, // Tarayıcıya indirme adıyla göster
      });

    if (signError || !signed?.signedUrl) {
      console.error('[genetic-reports/download] sign error', signError);
      return NextResponse.json(
        { error: 'İndirme bağlantısı oluşturulamadı.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signed_url: signed.signedUrl,
      expires_in: SIGNED_URL_TTL,
      filename: report.original_filename,
    });
  } catch (err) {
    console.error('[genetic-reports/download]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
