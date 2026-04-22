import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/messages/unread-count
 *
 * Giriş yapmış kullanıcının rolüne göre okunmamış mesaj sayısını döner.
 *
 * Parent için: teacher tarafından gönderilen (reply_to IS NOT NULL)
 *   ve is_read = FALSE olan mesajlar.
 * Teacher için: parent tarafından gönderilen (reply_to IS NULL)
 *   ve is_read = FALSE olan mesajlar.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = profile?.role;
    if (role !== 'parent' && role !== 'teacher') {
      return NextResponse.json({ count: 0 });
    }

    const admin = createAdminClient();
    let query = admin
      .from('parent_teacher_notes')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (role === 'parent') {
      // Veli: öğretmenden gelen cevaplar (reply_to IS NOT NULL)
      query = query.eq('parent_id', user.id).not('reply_to', 'is', null);
    } else {
      // Öğretmen: veliden gelen yeni mesajlar (reply_to IS NULL)
      query = query.eq('teacher_id', user.id).is('reply_to', null);
    }

    const { count, error } = await query;
    if (error) {
      console.error('[unread-count] error:', error.message);
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (err) {
    console.error('[unread-count] exception:', err);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
