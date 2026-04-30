/**
 * POST /api/genetic-reports/upload
 *
 * Faz 5: Genetik rapor PDF yükleme endpoint'i
 *
 * KVKK m.6 — Genetik veri özel nitelikli kişisel veri. Sıkı yetki kontrolü:
 *   • Yükleme yetkisi: admin, school_admin (sadece kendi okul öğrencisine)
 *   • Veli ve öğrenci asla yükleyemez (rolden bağımsız reddedilir)
 *
 * Body: multipart/form-data
 *   - file: PDF dosyası (zorunlu, max 10 MB)
 *   - student_id: UUID (zorunlu)
 *   - notes: opsiyonel açıklama
 *
 * Storage path: students/{student_id}/{timestamp}.pdf
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const BUCKET_NAME = 'genetic-reports';

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    // ── Role check (KVKK m.6) ──
    const role =
      (user.user_metadata?.role as string) ||
      (await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role;

    if (role !== 'admin' && role !== 'school_admin') {
      return NextResponse.json(
        { error: 'Genetik rapor yükleme yetkisi yalnızca yöneticilere aittir.' },
        { status: 403 }
      );
    }

    // ── Form data parse ──
    const formData = await req.formData();
    const file = formData.get('file');
    const studentId = (formData.get('student_id') || '').toString().trim();
    const notes = (formData.get('notes') || '').toString().trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya zorunlu.' }, { status: 400 });
    }
    if (!studentId) {
      return NextResponse.json({ error: 'Öğrenci ID zorunlu.' }, { status: 400 });
    }

    // ── File validation ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024} MB sınırını aşıyor.` },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece PDF dosyaları kabul edilir.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Student validation ──
    const { data: student } = await admin
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', studentId)
      .maybeSingle();

    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // ── School scope (school_admin ise sadece kendi okul öğrencisine) ──
    if (role === 'school_admin') {
      const { data: uploaderProfile } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!uploaderProfile?.school_id) {
        return NextResponse.json(
          { error: 'Okul bilginiz tanımlı değil.' },
          { status: 403 }
        );
      }
      if (student.school_id !== uploaderProfile.school_id) {
        return NextResponse.json(
          { error: 'Bu öğrenci sizin okulunuza ait değil.' },
          { status: 403 }
        );
      }
    }

    // ── Storage upload ──
    const timestamp = Date.now();
    const safeFilename = (file.name || 'genetic.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 100);
    const filePath = `students/${studentId}/${timestamp}_${safeFilename}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[genetic-reports/upload] storage error', uploadError);
      return NextResponse.json(
        { error: 'Dosya yüklenemedi: ' + uploadError.message },
        { status: 500 }
      );
    }

    // ── DB insert ──
    const { data: newReport, error: insertError } = await admin
      .from('genetic_reports')
      .insert({
        student_id: studentId,
        file_path: filePath,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        notes: notes || null,
      })
      .select('id, uploaded_at, original_filename, file_size')
      .single();

    if (insertError) {
      // DB insert başarısız → storage'ı geri al
      await admin.storage.from(BUCKET_NAME).remove([filePath]);
      console.error('[genetic-reports/upload] db error', insertError);
      return NextResponse.json(
        { error: 'Kayıt oluşturulamadı: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: newReport,
      student_name: student.full_name,
      message: 'Genetik rapor başarıyla yüklendi.',
    });
  } catch (err) {
    console.error('[genetic-reports/upload]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
