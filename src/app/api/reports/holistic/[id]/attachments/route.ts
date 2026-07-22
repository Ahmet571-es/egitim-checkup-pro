/**
 * Harmanlanmış rapor ↔ Genetik PDF ek bağlantıları (Faz 6)
 *
 *   POST /api/reports/holistic/[id]/attachments
 *     Body: { genetic_report_id: UUID }
 *     Bir holistic rapora bir genetik PDF'i bağlar (sürükle-bırak ile).
 *
 *   GET  /api/reports/holistic/[id]/attachments
 *     Bu rapora ek olarak bağlanan genetik PDF'lerin listesini döner
 *     (metadata: dosya adı, tarih, yükleyen, boyut, notlar — file_path YOK).
 *
 * KVKK m.6 — Yetki kuralları:
 *   • student / parent → 403 (HİÇBİR ŞEY)
 *   • teacher → kendine atanmış öğrencinin raporlarına bağlama yapabilir
 *   • school_admin → kendi okul öğrencilerine
 *   • admin → tüm öğrencilere
 *
 *   Ekstra: Bağlanacak genetik PDF AYNI öğrenciye ait olmalı (cross-student
 *   kontamine etmek mümkün olmamalı).
 */
import { NextRequest, NextResponse } from 'next/server';
import { logAndMsg } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// ── Yardımcı: Holistic rapora erişim/yazma yetkisini kontrol et ──
async function authorizeHolisticAccess(
  reportId: string,
  user: { id: string },
  callerProfile: { role: string | null; school_id: string | null },
  admin: ReturnType<typeof createAdminClient>,
) {
  // Öğrenci ve veli ASLA HİÇBİR ŞEY
  if (callerProfile.role === 'student' || callerProfile.role === 'parent') {
    return { ok: false, status: 403, error: 'Genetik rapora erişim yetkiniz yok.' };
  }
  if (!['admin', 'school_admin', 'teacher'].includes(callerProfile.role || '')) {
    return { ok: false, status: 403, error: 'Yetkisiz rol.' };
  }

  // Raporu getir
  const { data: report } = await admin
    .from('holistic_reports')
    .select('id, student_id, school_id')
    .eq('id', reportId)
    .maybeSingle();

  if (!report) {
    return { ok: false, status: 404, error: 'Harmanlanmış rapor bulunamadı.' };
  }

  // Cross-school
  if (
    callerProfile.role === 'school_admin' &&
    callerProfile.school_id &&
    report.school_id &&
    report.school_id !== callerProfile.school_id
  ) {
    return { ok: false, status: 403, error: 'Bu rapora erişim yetkiniz yok (farklı okul).' };
  }

  // Teacher → kendine atanmış öğrenci mi
  if (callerProfile.role === 'teacher') {
    const { data: studentAuth } = await admin.auth.admin.getUserById(report.student_id);
    const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
    if (assignedTeacherId !== user.id) {
      return { ok: false, status: 403, error: 'Bu öğrenci size atanmış değil.' };
    }
  }

  return { ok: true, report };
}

// ════════ POST: Genetik PDF bağla ════════
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await context.params;
    if (!reportId) {
      return NextResponse.json({ error: 'Rapor ID zorunlu.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const geneticReportId = body.genetic_report_id;
    if (!geneticReportId) {
      return NextResponse.json({ error: 'genetic_report_id zorunlu.' }, { status: 400 });
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

    const auth = await authorizeHolisticAccess(reportId, user, callerProfile, admin);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const report = auth.report!;

    // Genetik raporun aynı öğrenciye ait olduğunu doğrula
    const { data: genReport } = await admin
      .from('genetic_reports')
      .select('id, student_id, original_filename')
      .eq('id', geneticReportId)
      .maybeSingle();

    if (!genReport) {
      return NextResponse.json({ error: 'Genetik rapor bulunamadı.' }, { status: 404 });
    }
    if (genReport.student_id !== report.student_id) {
      return NextResponse.json(
        { error: 'Bu genetik rapor, harmanlanmış raporun öğrencisine ait değil.' },
        { status: 400 },
      );
    }

    // Mevcut max position'ı al, 1 fazlasıyla ekle
    const { data: existing } = await admin
      .from('holistic_report_attachments')
      .select('position')
      .eq('holistic_report_id', reportId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existing && existing[0] ? (existing[0].position || 0) + 1 : 0;

    const { data: newAttach, error: insertErr } = await admin
      .from('holistic_report_attachments')
      .insert({
        holistic_report_id: reportId,
        genetic_report_id: geneticReportId,
        position: nextPosition,
        attached_by: user.id,
      })
      .select('id, position, attached_at')
      .single();

    if (insertErr) {
      // UNIQUE constraint violation → zaten ekli
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'Bu genetik rapor zaten ekli.' },
          { status: 409 },
        );
      }
      console.error('[holistic/attachments POST]', insertErr);
      return NextResponse.json(
        { error: logAndMsg('reports/holistic/[id]/attachments', insertErr, 'Bağlantı oluşturulamadı.') },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: newAttach.id,
        position: newAttach.position,
        attached_at: newAttach.attached_at,
        original_filename: genReport.original_filename,
      },
    });
  } catch (err) {
    console.error('[holistic/attachments POST]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// ════════ GET: Bağlanan ek listesi ════════
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reportId } = await context.params;
    if (!reportId) {
      return NextResponse.json({ error: 'Rapor ID zorunlu.' }, { status: 400 });
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

    const auth = await authorizeHolisticAccess(reportId, user, callerProfile, admin);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: rows } = await admin
      .from('holistic_report_attachments')
      .select(`
        id,
        position,
        attached_at,
        genetic_report_id,
        genetic_reports!inner (
          id, original_filename, file_size, uploaded_at, notes
        )
      `)
      .eq('holistic_report_id', reportId)
      .order('position', { ascending: true });

    type AttachmentRow = {
      id: string;
      position: number;
      attached_at: string;
      genetic_report_id: string;
      genetic_reports: {
        id: string;
        original_filename: string;
        file_size: number;
        uploaded_at: string;
        notes: string | null;
      } | {
        id: string;
        original_filename: string;
        file_size: number;
        uploaded_at: string;
        notes: string | null;
      }[];
    };

    const attachments = ((rows || []) as AttachmentRow[]).map((r) => {
      const gr = Array.isArray(r.genetic_reports) ? r.genetic_reports[0] : r.genetic_reports;
      return {
        id: r.id,
        position: r.position,
        attached_at: r.attached_at,
        genetic_report_id: r.genetic_report_id,
        original_filename: gr?.original_filename || 'genetic.pdf',
        file_size: gr?.file_size || 0,
        uploaded_at: gr?.uploaded_at || r.attached_at,
        notes: gr?.notes || null,
      };
    });

    return NextResponse.json({
      attachments,
      total: attachments.length,
    });
  } catch (err) {
    console.error('[holistic/attachments GET]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
