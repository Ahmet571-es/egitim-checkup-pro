import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// DELETE /api/reports/holistic/[id]
// Tek bir harmanlanmış raporu siler
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // ── AUTH ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // Öğrenci silme yapamaz
    if (callerProfile.role === 'student') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }
    // Veli rapor silemez (salt-okunur yetki)
    if (callerProfile.role === 'parent') {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }

    // Raporu çek ve okul kontrolü yap
    const { data: report, error: fetchErr } = await admin
      .from('holistic_reports')
      .select('id, student_id, school_id')
      .eq('id', id)
      .single();

    if (fetchErr || !report) {
      return NextResponse.json({ error: 'Rapor bulunamadı.' }, { status: 404 });
    }

    // Cross-school kontrol
    if (callerProfile.role !== 'admin' && callerProfile.school_id && report.school_id && report.school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Bu rapor sizin okulunuzda değil.' }, { status: 403 });
    }

    // Sil
    const { error: delErr } = await admin
      .from('holistic_reports')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('[holistic delete]', delErr.message);
      return NextResponse.json({ error: 'Rapor silinemedi: ' + delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reports/holistic/[id] DELETE]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
