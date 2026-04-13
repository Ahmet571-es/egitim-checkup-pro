import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, BASE_URL } from '@/lib/email/client';
import { TEST_TYPES } from '@/types';

export async function POST(request: Request) {
  try {
    const { studentId, testType, score } = await request.json();
    if (!studentId || !testType) return NextResponse.json({ ok: false });

    const supabase = await createClient();

    // Öğrenci bilgisi
    const { data: student } = await supabase
      .from('profiles')
      .select('full_name, email, school_id')
      .eq('id', studentId)
      .single();

    if (!student) return NextResponse.json({ ok: false });

    const testLabel = TEST_TYPES.find(t => t.key === testType)?.label || testType;

    // 1. Veliye bildirim
    const { data: parentRelations } = await supabase
      .from('parent_students')
      .select('parent_id')
      .eq('student_id', studentId);

    for (const rel of (parentRelations || [])) {
      const { data: parent } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', rel.parent_id)
        .single();

      // Bildirim tercihi kontrol
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_on_test_result')
        .eq('user_id', rel.parent_id)
        .maybeSingle();

      if (parent?.email && (prefs?.email_on_test_result !== false)) {
        await sendEmail({
          to: parent.email,
          subject: `${student.full_name} yeni bir test tamamladı — ${testLabel}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 24px; border-radius: 16px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">Eğitim Check-Up</h2>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Test Tamamlandı</p>
              </div>
              <div style="padding: 24px 0;">
                <p>Sayın ${parent.full_name},</p>
                <p><strong>${student.full_name}</strong> adlı öğrenciniz <strong>${testLabel}</strong> testini tamamladı.</p>
                ${score ? `<p>Skor: <strong>${score}</strong></p>` : ''}
                <p>Detaylı raporu görmek için giriş yapabilirsiniz:</p>
                <a href="${BASE_URL}/parent/results" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Sonuçları Gör</a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">Eğitim Check-Up — Psikometrik Test ve AI Analiz Platformu</p>
            </div>
          `,
        });
      }
    }

    // 2. Öğretmene bildirim
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentId)
      .limit(1);

    if (classStudents && classStudents.length > 0) {
      const { data: classData } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classStudents[0].class_id)
        .single();

      if (classData?.teacher_id) {
        const { data: teacher } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', classData.teacher_id)
          .single();

        if (teacher?.email) {
          await sendEmail({
            to: teacher.email,
            subject: `Öğrenciniz ${student.full_name} — ${testLabel} testi tamamladı`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 24px; border-radius: 16px; text-align: center;">
                  <h2 style="margin: 0; font-size: 20px;">Eğitim Check-Up</h2>
                  <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Yeni Test Sonucu</p>
                </div>
                <div style="padding: 24px 0;">
                  <p><strong>${student.full_name}</strong> öğrenciniz <strong>${testLabel}</strong> testini tamamladı.</p>
                  ${score ? `<p>Skor: <strong>${score}</strong></p>` : ''}
                  <a href="${BASE_URL}/teacher/results" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Sonuçları Gör</a>
                </div>
              </div>
            `,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Notification error:', err);
    return NextResponse.json({ ok: false });
  }
}
