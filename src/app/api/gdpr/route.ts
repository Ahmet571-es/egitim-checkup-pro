import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const { studentId } = await request.json();
    if (!studentId) return NextResponse.json({ error: 'studentId gerekli' }, { status: 400 });

    // Veli mi kontrol et
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'parent' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Veli ise, kendi çocuğu mu kontrol et
    if (profile.role === 'parent') {
      const { data: relation } = await supabase
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', studentId)
        .single();

      if (!relation) {
        return NextResponse.json({ error: 'Bu öğrenci sizin çocuğunuz değil' }, { status: 403 });
      }
    }

    // Verileri sil
    const deletedTables: string[] = [];
    const tables = [
      'coaching_tasks', 'coaching_streaks', 'ai_chat_usage',
      'student_badges', 'student_xp', 'student_challenges',
      'test_results', 'student_test_history',
      'parent_teacher_notes', 'notification_preferences',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('student_id', studentId);
      if (!error) deletedTables.push(table);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'KVKK_DATA_DELETE',
      resource_type: 'student',
      resource_id: studentId,
      details: { deletedTables, requestedBy: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tüm öğrenci verileri silindi',
      deletedTables,
    });
  } catch (err) {
    console.error('GDPR error:', err);
    return NextResponse.json({ error: 'Silme işlemi sırasında hata oluştu.' }, { status: 500 });
  }
}
