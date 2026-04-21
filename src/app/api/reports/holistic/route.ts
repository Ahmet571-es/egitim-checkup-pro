import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// GET /api/reports/holistic?student_id=XXX
// Öğrencinin tüm harmanlanmış raporlarını (en yeniden eskiye) listeler
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id zorunludur.' }, { status: 400 });
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

    // Öğrenci sadece kendi raporlarını görebilir
    if (callerProfile.role === 'student' && user.id !== studentId) {
      return NextResponse.json({ error: 'Yalnızca kendi raporlarınızı görebilirsiniz.' }, { status: 403 });
    }

    // Veli: sadece kendi çocuklarının raporlarını görebilir
    if (callerProfile.role === 'parent') {
      const { data: link } = await admin
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', studentId)
        .maybeSingle();
      if (!link) {
        return NextResponse.json(
          { error: 'Yalnızca kendi çocuğunuzun raporlarını görebilirsiniz.' },
          { status: 403 },
        );
      }
    }

    // Öğretmen/yönetici için okul bazlı kontrol
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'student') {
      const { data: student } = await admin
        .from('profiles')
        .select('school_id')
        .eq('id', studentId)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
      }

      if (callerProfile.school_id && student.school_id !== callerProfile.school_id) {
        return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
      }
    }

    // Raporları çek
    const { data: reports, error } = await admin
      .from('holistic_reports')
      .select('id, report_text, selected_test_types, test_count, generated_at, created_at')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('[holistic list]', error.message);
      return NextResponse.json({ error: 'Raporlar çekilemedi: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reports: (reports || []).map(r => ({
        id: r.id,
        text: r.report_text,
        selected_test_types: Array.isArray(r.selected_test_types) ? r.selected_test_types : [],
        test_count: r.test_count || 0,
        generated_at: r.generated_at,
      })),
    });
  } catch (err) {
    console.error('[reports/holistic GET]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// NOT: Tek rapor silme için DELETE /api/reports/holistic/[id] kullanılır
