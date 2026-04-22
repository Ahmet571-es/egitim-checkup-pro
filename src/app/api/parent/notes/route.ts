import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/parent/notes?student_id=<uuid>
 *
 * Veli için — çocuğuyla (ve atanmış öğretmeniyle) yaptığı mesajlaşma listesi.
 * Zaman sırasına göre döner.
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    if (!studentId || !/^[0-9a-f-]{36}$/i.test(studentId)) {
      return NextResponse.json({ error: 'Geçerli bir öğrenci ID\'si gerekli.' }, { status: 400 });
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
        { error: 'Yalnızca kendi çocuğunuzun mesajlarını görebilirsiniz.' },
        { status: 403 },
      );
    }

    // Notları çek — bu veli + bu öğrenci
    const { data: notes, error } = await admin
      .from('parent_teacher_notes')
      .select('id, parent_id, teacher_id, student_id, note, is_read, reply_to, created_at')
      .eq('parent_id', user.id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[parent/notes] fetch error:', error.message);
      return NextResponse.json({ error: 'Mesajlar alınamadı.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notes: notes ?? [] });
  } catch (err) {
    console.error('[parent/notes] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
