/**
 * GET /api/genetic-reports/list?student_id=X
 *
 * Faz 5: Bir öğrenciye ait genetik raporların listesi
 *
 * KVKK m.6 — Erişim matrisi (sıkı):
 *   • admin            → tüm öğrenciler
 *   • school_admin     → sadece kendi okul öğrencileri
 *   • teacher          → sadece kendisine atanmış öğrenciler
 *   • student / parent → 403 (KVKK kapsamında özel kategori, kendi/çocuğu raporunu göremez)
 *
 * Response: { reports: [{ id, original_filename, file_size, uploaded_at, uploaded_by_name, notes }] }
 * NOT: file_path response'a dahil EDİLMEZ — indirme için ayrı /download endpoint'i.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const role =
      (user.user_metadata?.role as string) ||
      (await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role;

    // KVKK m.6: student ve parent ASLA erişemez
    if (role === 'student' || role === 'parent') {
      return NextResponse.json(
        { error: 'Genetik rapora erişim yetkiniz yok.' },
        { status: 403 }
      );
    }

    if (!['admin', 'school_admin', 'teacher'].includes(role || '')) {
      return NextResponse.json({ error: 'Yetkisiz rol.' }, { status: 403 });
    }

    const studentId = req.nextUrl.searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id parametresi zorunlu.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── Öğrenci kontrolü ──
    const { data: student } = await admin
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', studentId)
      .maybeSingle();

    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // ── Yetki scope kontrolü ──
    if (role === 'school_admin') {
      const { data: viewerProfile } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!viewerProfile?.school_id || student.school_id !== viewerProfile.school_id) {
        return NextResponse.json(
          { error: 'Bu öğrenciye erişim yetkiniz yok.' },
          { status: 403 }
        );
      }
    } else if (role === 'teacher') {
      // Öğretmen sadece kendine atanmış öğrenci raporlarını görür
      const { data: studentAuth } = await admin.auth.admin.getUserById(studentId);
      const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Bu öğrenci size atanmış değil.' },
          { status: 403 }
        );
      }
    }
    // admin → tüm öğrenciler, ek scope yok

    // ── Rapor listesi ──
    const { data: reports, error: listError } = await admin
      .from('genetic_reports')
      .select('id, original_filename, file_size, uploaded_at, uploaded_by, notes')
      .eq('student_id', studentId)
      .order('uploaded_at', { ascending: false });

    if (listError) {
      console.error('[genetic-reports/list] db error', listError);
      return NextResponse.json({ error: 'Liste alınamadı.' }, { status: 500 });
    }

    // Yükleyen kişi isimlerini ekle (UX için)
    const uploaderIds = [...new Set((reports || []).map((r) => r.uploaded_by))];
    const uploaderNameMap: Record<string, string> = {};
    if (uploaderIds.length > 0) {
      const { data: uploaders } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', uploaderIds);
      (uploaders || []).forEach((u) => {
        uploaderNameMap[u.id] = u.full_name || 'Yönetici';
      });
    }

    const enriched = (reports || []).map((r) => ({
      id: r.id,
      original_filename: r.original_filename,
      file_size: r.file_size,
      uploaded_at: r.uploaded_at,
      uploaded_by_name: uploaderNameMap[r.uploaded_by] || 'Yönetici',
      notes: r.notes,
    }));

    return NextResponse.json({
      reports: enriched,
      total: enriched.length,
    });
  } catch (err) {
    console.error('[genetic-reports/list]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
