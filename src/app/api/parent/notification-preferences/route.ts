import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/parent/notification-preferences
 * PUT /api/parent/notification-preferences
 *   Body: { email_test_complete?, email_report_ready?, email_teacher_note?, email_weekly_summary? }
 *
 * Veli kendi bildirim tercihlerini okur ve günceller. RLS:
 *   user_own_prefs policy auth.uid() = user_id koşulu.
 *
 * Not: notification_preferences her rol için ortak. Role guard YOK,
 *   sadece authenticated user yeterli; kullanıcı kendi kaydını işler.
 *   URL /api/parent/* altında yaşıyor çünkü ilk kullanım yeri veli paneli,
 *   ama öğretmen/öğrenci de aynı endpoint'i kullanabilir (rol bağımsız).
 */

type PreferenceFlags = {
  email_test_complete: boolean;
  email_report_ready: boolean;
  email_teacher_note: boolean;
  email_weekly_summary: boolean;
};

const DEFAULT_PREFS: PreferenceFlags = {
  email_test_complete: true,
  email_report_ready: true,
  email_teacher_note: true,
  email_weekly_summary: false,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('email_test_complete, email_report_ready, email_teacher_note, email_weekly_summary')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[notification-preferences/get] error:', error.message);
      return NextResponse.json({ error: 'Tercihler alınamadı.' }, { status: 500 });
    }

    // Kayıt yoksa default döndür (henüz oluşturulmamış)
    const prefs: PreferenceFlags = data ?? DEFAULT_PREFS;
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err) {
    console.error('[notification-preferences/get] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<PreferenceFlags>;

    // Sadece bilinen flag'leri al, boolean'a çevir
    const update: Partial<PreferenceFlags> = {};
    const keys: (keyof PreferenceFlags)[] = [
      'email_test_complete',
      'email_report_ready',
      'email_teacher_note',
      'email_weekly_summary',
    ];
    for (const k of keys) {
      if (typeof body[k] === 'boolean') {
        update[k] = body[k];
      }
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek tercih belirtilmedi.' }, { status: 400 });
    }

    // Upsert: row yoksa oluştur, varsa güncelle
    const payload = {
      user_id: user.id,
      ...DEFAULT_PREFS,
      ...update,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('[notification-preferences/put] error:', error.message);
      return NextResponse.json({ error: 'Tercihler güncellenemedi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notification-preferences/put] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
