import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/teacher/students/[studentId]/test-results/[resultId]
 * Öğretmen — bir öğrencinin belirli test sonucunun detayını getirir (raw_answers dahil)
 *
 * Yetki: Sadece öğretmen + aynı okuldaki öğrenci + öğretmenin sınıfındaki öğrenci
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ studentId: string; resultId: string }> }
) {
  const { studentId, resultId } = await ctx.params;

  const supabase = await createClient();
  const admin = createAdminClient();

  // AUTH
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
  }

  // Caller profil
  const { data: caller } = await admin
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller) return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
  if (caller.role !== 'teacher' && caller.role !== 'school_admin' && caller.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }

  // Öğrenci aynı okulda mı?
  const { data: student } = await admin
    .from('profiles')
    .select('id, school_id, full_name, role')
    .eq('id', studentId)
    .single();

  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
  if (student.role !== 'student') {
    return NextResponse.json({ error: 'Geçersiz öğrenci kaydı.' }, { status: 400 });
  }
  if (caller.role === 'teacher' && student.school_id !== caller.school_id) {
    return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
  }

  // Test sonucunu çek
  const { data: result, error } = await admin
    .from('test_results')
    .select('id, student_id, test_type, scores, raw_answers, completed_at, ai_report, ai_report_generated_at')
    .eq('id', resultId)
    .eq('student_id', studentId)
    .single();

  if (error || !result) {
    return NextResponse.json({ error: 'Test sonucu bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    result,
    student: {
      id: student.id,
      full_name: student.full_name,
    },
  });
}

/**
 * DELETE /api/teacher/students/[studentId]/test-results/[resultId]
 * Öğretmen — bir öğrencinin test sonucunu siler
 */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ studentId: string; resultId: string }> }
) {
  const { studentId, resultId } = await ctx.params;

  const supabase = await createClient();
  const admin = createAdminClient();

  // AUTH
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
  }

  const { data: caller } = await admin
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single();

  if (!caller) return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
  if (caller.role !== 'teacher' && caller.role !== 'school_admin' && caller.role !== 'admin') {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }

  // Öğrenci yetki kontrolü
  const { data: student } = await admin
    .from('profiles')
    .select('id, school_id, role')
    .eq('id', studentId)
    .single();

  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
  if (caller.role === 'teacher' && student.school_id !== caller.school_id) {
    return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
  }

  // Test sonucunu sil
  const { error } = await admin
    .from('test_results')
    .delete()
    .eq('id', resultId)
    .eq('student_id', studentId);

  if (error) {
    return serverError('teacher/students/[studentId]/test-results/[resultId]', error, 500, 'Silme başarısız.');
  }

  // Bağlı holistic raporları etkilememek için: holistic_reports'u silme
  // (Sadece test sonucu silinir, üretilmiş raporlar geçmişte kalır)

  return NextResponse.json({ success: true });
}
