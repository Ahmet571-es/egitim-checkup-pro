import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/teacher/approve-parent
 * Body: { link_id: string, action: 'approve' | 'reject' }
 *
 * Öğretmen onay/red mekanizması:
 *   - approve → parent_students.approved_at = now(), approved_by = teacher
 *   - reject  → parent_students satırı silinir
 *
 * Yetki kontrolü: Öğretmen sadece kendi öğrencisine bağlanmaya çalışan
 * velileri onaylayabilir. school_admin/admin tüm okul velileri için.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'teacher' && profile?.role !== 'school_admin' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      link_id?: string;
      action?: 'approve' | 'reject';
    };
    const linkId = (body.link_id ?? '').toString();
    const action = body.action;

    if (!linkId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Geçersiz istek. link_id ve action (approve/reject) zorunlu.' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Link'i ve öğrenciyi yetki için doğrula
    const { data: link, error: linkErr } = await admin
      .from('parent_students')
      .select('*')
      .eq('id', linkId)
      .maybeSingle();

    if (linkErr || !link) {
      return NextResponse.json({ error: 'Bağlantı bulunamadı.' }, { status: 404 });
    }

    // Teacher rolü için: öğrenci bu öğretmene mi atanmış?
    if (profile?.role === 'teacher') {
      const { data: studentUser } = await admin.auth.admin.getUserById(link.student_id);
      const assignedTeacherId = (studentUser?.user?.user_metadata as Record<string, unknown> | null)
        ?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Bu öğrenci için yetkiniz yok.' },
          { status: 403 },
        );
      }
    }

    if (action === 'approve') {
      const { error: updateErr } = await admin
        .from('parent_students')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', linkId);
      if (updateErr) {
        // Migration yapılmadıysa kolonlar yok — açıklayıcı hata
        console.error('[approve-parent] update error:', updateErr.message);
        return NextResponse.json(
          {
            error:
              'Onay kaydedilemedi. Veritabanı güncellemesi gerekli olabilir (migration_parent_approval.sql).',
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, action: 'approved' });
    }

    // action === 'reject'
    const { error: deleteErr } = await admin
      .from('parent_students')
      .delete()
      .eq('id', linkId);
    if (deleteErr) {
      console.error('[approve-parent] delete error:', deleteErr.message);
      return NextResponse.json({ error: 'Reddetme işlemi başarısız.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: 'rejected' });
  } catch (err) {
    console.error('[approve-parent] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
