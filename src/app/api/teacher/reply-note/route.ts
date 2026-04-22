import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/teacher/reply-note
 * Body: { parent_id, student_id, note, reply_to? }
 *
 * Öğretmen veliye not/yanıt yazar → parent_teacher_notes'a insert →
 * veliye email bildirimi (notification_preferences.email_teacher_note
 * TRUE ise). Teacher_id SERVER tarafından belirlenir.
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
      .single();
    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Bu işlem sadece öğretmen/yönetici hesapları içindir.' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      parent_id?: string;
      student_id?: string;
      note?: string;
      reply_to?: string | null;
    };

    const parentId = (body.parent_id ?? '').toString().trim();
    const studentId = (body.student_id ?? '').toString().trim();
    const note = (body.note ?? '').toString().trim();
    const replyTo = body.reply_to ? body.reply_to.toString().trim() : null;

    const uuidRx = /^[0-9a-f-]{36}$/i;
    if (!uuidRx.test(parentId)) {
      return NextResponse.json({ error: 'Geçerli bir veli ID\'si girin.' }, { status: 400 });
    }
    if (!uuidRx.test(studentId)) {
      return NextResponse.json({ error: 'Geçerli bir öğrenci ID\'si girin.' }, { status: 400 });
    }
    if (replyTo && !uuidRx.test(replyTo)) {
      return NextResponse.json({ error: 'Geçersiz reply_to.' }, { status: 400 });
    }
    if (!note || note.length < 3) {
      return NextResponse.json({ error: 'Mesaj en az 3 karakter olmalı.' }, { status: 400 });
    }
    if (note.length > 2000) {
      return NextResponse.json({ error: 'Mesaj en fazla 2000 karakter olabilir.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Yanıt ise: orijinal notun teacher_id'si bu öğretmen olmalı (veya
    // atama doğrulaması). Direct check: orijinal notta bu öğretmen var mı?
    if (replyTo) {
      const { data: original } = await admin
        .from('parent_teacher_notes')
        .select('teacher_id, parent_id, student_id')
        .eq('id', replyTo)
        .maybeSingle();
      if (!original) {
        return NextResponse.json({ error: 'Yanıtlanan mesaj bulunamadı.' }, { status: 404 });
      }
      if (original.teacher_id !== user.id) {
        return NextResponse.json(
          { error: 'Bu mesajı yanıtlama yetkiniz yok.' },
          { status: 403 },
        );
      }
    }

    // Insert (admin — RLS bypass; server-verified teacher_id)
    const { data: inserted, error: insertErr } = await admin
      .from('parent_teacher_notes')
      .insert({
        parent_id: parentId,
        teacher_id: user.id,
        student_id: studentId,
        note,
        reply_to: replyTo,
        is_read: false,
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('[teacher/reply-note] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Mesaj gönderilemedi.' }, { status: 500 });
    }

    // E-posta bildirimi (sessiz hata — kayıt akışını bozmaz)
    try {
      const { sendTeacherNoteEmail } = await import('@/lib/email/triggers');
      await sendTeacherNoteEmail({
        parentId,
        teacherId: user.id,
        studentId,
        notePreview: note,
      });
    } catch (e) {
      console.warn('[teacher/reply-note] email fail:', e);
    }

    return NextResponse.json({
      success: true,
      id: inserted?.id,
      created_at: inserted?.created_at,
    });
  } catch (err) {
    console.error('[teacher/reply-note] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
