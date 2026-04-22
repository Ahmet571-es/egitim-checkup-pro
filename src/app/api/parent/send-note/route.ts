import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/parent/send-note
 * Body: { student_id: string, note: string }
 *
 * Authenticated parent → öğrencinin kendi çocuğu olduğunu doğrular →
 * çocuğun atanmış öğretmenini bulur → parent_teacher_notes'a insert.
 *
 * Veliler her türlü öğretmene spoof ile yazmasın diye teacher_id SERVER
 * tarafından belirlenir. Client'tan teacher_id alınmaz.
 *
 * Öğrencinin atanmış öğretmeni yoksa 404 dönülür (henüz öğretmene atanmamış).
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
    if (profile?.role !== 'parent') {
      return NextResponse.json(
        { error: 'Bu işlem sadece veli hesapları içindir.' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      student_id?: string;
      note?: string;
    };
    const studentId = (body.student_id ?? '').toString().trim();
    const note = (body.note ?? '').toString().trim();

    if (!studentId || !/^[0-9a-f-]{36}$/i.test(studentId)) {
      return NextResponse.json({ error: 'Geçerli bir öğrenci ID\'si girin.' }, { status: 400 });
    }
    if (!note || note.length < 3) {
      return NextResponse.json({ error: 'Mesaj en az 3 karakter olmalı.' }, { status: 400 });
    }
    if (note.length > 2000) {
      return NextResponse.json({ error: 'Mesaj en fazla 2000 karakter olabilir.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Parent-child bağlantısını doğrula
    const { data: link } = await admin
      .from('parent_students')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .maybeSingle();
    if (!link) {
      return NextResponse.json(
        { error: 'Yalnızca kendi çocuğunuza not gönderebilirsiniz.' },
        { status: 403 },
      );
    }

    // Öğrencinin atanmış öğretmenini bul (auth.users.user_metadata.assigned_teacher_id).
    // Projedeki mevcut pattern (teacher dashboard): admin.auth.admin.listUsers / getUser
    const { data: studentAuth } = await admin.auth.admin.getUserById(studentId);
    const assignedTeacherId =
      (studentAuth?.user?.user_metadata as Record<string, unknown> | null)?.assigned_teacher_id as
        | string
        | undefined;

    if (!assignedTeacherId) {
      return NextResponse.json(
        {
          error: 'Çocuğunuza henüz bir öğretmen atanmamış. Atama yapılana kadar not gönderemezsiniz.',
        },
        { status: 404 },
      );
    }

    // Notu kaydet (admin client — RLS bypass; WITH CHECK'ler zaten server-
    // verified değerleri garantiliyor)
    const { data: inserted, error: insertErr } = await admin
      .from('parent_teacher_notes')
      .insert({
        parent_id: user.id,
        teacher_id: assignedTeacherId,
        student_id: studentId,
        note,
        is_read: false,
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('[parent/send-note] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Not gönderilemedi.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: inserted?.id,
      created_at: inserted?.created_at,
    });
  } catch (err) {
    console.error('[parent/send-note] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
