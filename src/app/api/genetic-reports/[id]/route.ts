/**
 * DELETE /api/genetic-reports/[id]
 *
 * Faz 5: Genetik raporu sil
 *
 * KVKK m.7 (silme hakkı) ve m.6 yetki:
 *   • admin → her raporu silebilir
 *   • school_admin → kendi okul öğrencilerinin raporlarını silebilir
 *   • teacher / student / parent → silme yetkisi yok
 *
 * İşlem: storage'dan dosyayı sil + DB satırını sil. İkisi de başarılı olmalı,
 * birinde hata olursa response 500 döner ama eldeki başarılı işlemi log'lar.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET_NAME = 'genetic-reports';

export async function DELETE(
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

    if (role !== 'admin' && role !== 'school_admin') {
      return NextResponse.json(
        { error: 'Genetik rapor silme yetkisi yalnızca yöneticilere aittir.' },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // ── Rapor + öğrenci bilgisi ──
    const { data: report } = await admin
      .from('genetic_reports')
      .select('id, file_path, student_id')
      .eq('id', id)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    // ── School scope (school_admin için) ──
    if (role === 'school_admin') {
      const { data: student } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', report.student_id)
        .maybeSingle();
      const { data: deleterProfile } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();
      if (
        !deleterProfile?.school_id ||
        !student ||
        student.school_id !== deleterProfile.school_id
      ) {
        return NextResponse.json(
          { error: 'Bu raporu silme yetkiniz yok.' },
          { status: 403 }
        );
      }
    }

    // ── Storage'dan sil ──
    const { error: storageError } = await admin.storage
      .from(BUCKET_NAME)
      .remove([report.file_path]);

    if (storageError) {
      console.error('[genetic-reports/delete] storage error', storageError);
      // Devam et — DB row hâlâ silinecek (orphan dosya log'lanır)
    }

    // ── DB'den sil ──
    const { error: dbError } = await admin
      .from('genetic_reports')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('[genetic-reports/delete] db error', dbError);
      return NextResponse.json(
        { error: 'Kayıt silinemedi: ' + dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Genetik rapor silindi.',
    });
  } catch (err) {
    console.error('[genetic-reports/delete]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
