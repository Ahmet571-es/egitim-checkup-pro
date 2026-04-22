/**
 * E-posta Tetikleyicileri — Supabase tablodan kullanıcı bilgisi çekip
 * ilgili şablonu doldurur ve gönderir.
 */
import { createClient } from '@/lib/supabase/server';
import { sendEmail, BASE_URL } from './client';
import {
  welcomeEmailTemplate,
  testAssignedEmailTemplate,
  testCompletedEmailTemplate,
  reportReadyEmailTemplate,
  licenseExpiringEmailTemplate,
  licenseExpiredEmailTemplate,
  teacherNoteEmailTemplate,
} from './templates';
import { ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, school_id')
    .eq('id', userId)
    .single();
  return data;
}

async function getSchool(schoolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('schools')
    .select('id, name, license_end_date')
    .eq('id', schoolId)
    .single();
  return data;
}

// ─── Tetikleyiciler ────────────────────────────────────────────────────────────

/** Kayıt sonrası hoş geldin e-postası */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    const profile = await getProfile(userId);
    if (!profile?.email) return;

    const roleLabel = ROLE_LABELS[(profile.role as UserRole)] ?? profile.role;
    const { subject, html } = welcomeEmailTemplate({
      fullName: profile.full_name,
      role: roleLabel,
      loginUrl: `${BASE_URL}/login`,
    });

    await sendEmail({ to: profile.email, subject, html });
    console.log(`[email/welcome] Gönderildi → ${profile.email}`);
  } catch (err) {
    console.error('[email/welcome] Hata:', err);
  }
}

/** Test atandığında öğrenciye bildirim */
export async function sendTestAssignedEmail(
  studentId: string,
  testName: string,
  teacherName: string = 'Öğretmeniniz'
): Promise<void> {
  try {
    const profile = await getProfile(studentId);
    if (!profile?.email) return;

    const { subject, html } = testAssignedEmailTemplate({
      studentName: profile.full_name,
      testName,
      teacherName,
      testUrl: `${BASE_URL}/student/my-tests`,
    });

    await sendEmail({ to: profile.email, subject, html });
    console.log(`[email/test-assigned] Gönderildi → ${profile.email}`);
  } catch (err) {
    console.error('[email/test-assigned] Hata:', err);
  }
}

/** Test tamamlandığında öğretmene bildirim */
export async function sendTestCompletedEmail(
  teacherId: string,
  studentName: string,
  testName: string
): Promise<void> {
  try {
    const profile = await getProfile(teacherId);
    if (!profile?.email) return;

    const completedAt = new Date().toLocaleString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const { subject, html } = testCompletedEmailTemplate({
      teacherName: profile.full_name,
      studentName,
      testName,
      completedAt,
      resultsUrl: `${BASE_URL}/teacher/results`,
    });

    await sendEmail({ to: profile.email, subject, html });
    console.log(`[email/test-completed] Gönderildi → ${profile.email}`);
  } catch (err) {
    console.error('[email/test-completed] Hata:', err);
  }
}

/** Rapor üretildiğinde veliye bildirim */
export async function sendReportReadyEmail(
  parentId: string,
  studentName: string,
  reportType: string = 'Veli Destek Raporu'
): Promise<void> {
  try {
    const profile = await getProfile(parentId);
    if (!profile?.email) return;

    const { subject, html } = reportReadyEmailTemplate({
      parentName: profile.full_name,
      studentName,
      reportType,
      reportsUrl: `${BASE_URL}/parent/results`,
    });

    await sendEmail({ to: profile.email, subject, html });
    console.log(`[email/report-ready] Gönderildi → ${profile.email}`);
  } catch (err) {
    console.error('[email/report-ready] Hata:', err);
  }
}

/** Lisans 3 gün kala okul yöneticisine uyarı */
export async function sendLicenseExpiringEmail(
  schoolId: string,
  daysLeft: number
): Promise<void> {
  try {
    const school = await getSchool(schoolId);
    if (!school) return;

    // Okul yöneticisini bul
    const supabase = await createClient();
    const { data: admin } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('school_id', schoolId)
      .eq('role', 'school_admin')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!admin?.email) return;

    const expiryDate = school.license_end_date
      ? new Date(school.license_end_date).toLocaleDateString('tr-TR', {
          day: '2-digit', month: 'long', year: 'numeric',
        })
      : '—';

    const { subject, html } = licenseExpiringEmailTemplate({
      adminName: admin.full_name,
      schoolName: school.name,
      daysLeft,
      expiryDate,
      renewUrl: `${BASE_URL}/school/billing`,
    });

    await sendEmail({ to: admin.email, subject, html });
    console.log(`[email/license-expiring] Gönderildi → ${admin.email} (${daysLeft} gün kaldı)`);
  } catch (err) {
    console.error('[email/license-expiring] Hata:', err);
  }
}

/** Lisans süresi dolduğunda okul yöneticisine bildirim */
export async function sendLicenseExpiredEmail(schoolId: string): Promise<void> {
  try {
    const school = await getSchool(schoolId);
    if (!school) return;

    const supabase = await createClient();
    const { data: admin } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('school_id', schoolId)
      .eq('role', 'school_admin')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!admin?.email) return;

    const expiredDate = school.license_end_date
      ? new Date(school.license_end_date).toLocaleDateString('tr-TR', {
          day: '2-digit', month: 'long', year: 'numeric',
        })
      : '—';

    const { subject, html } = licenseExpiredEmailTemplate({
      adminName: admin.full_name,
      schoolName: school.name,
      expiredDate,
      renewUrl: `${BASE_URL}/school/billing`,
    });

    await sendEmail({ to: admin.email, subject, html });
    console.log(`[email/license-expired] Gönderildi → ${admin.email}`);
  } catch (err) {
    console.error('[email/license-expired] Hata:', err);
  }
}

/**
 * FAZ 3C — Öğretmen veliye not yazdığında e-posta bildirimi.
 * notification_preferences.email_teacher_note flag'i respektedilir.
 */
export async function sendTeacherNoteEmail(params: {
  parentId: string;
  teacherId: string;
  studentId: string;
  notePreview: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Bildirim tercihi kontrolü (default TRUE, ama kullanıcı kapatmışsa gönderme)
    const { data: pref } = await supabase
      .from('notification_preferences')
      .select('email_teacher_note')
      .eq('user_id', params.parentId)
      .maybeSingle();
    if (pref && pref.email_teacher_note === false) {
      return; // Sessizce atla — kullanıcı tercihi
    }

    const [parent, teacher, student] = await Promise.all([
      getProfile(params.parentId),
      getProfile(params.teacherId),
      getProfile(params.studentId),
    ]);
    if (!parent?.email) return;

    const { subject, html } = teacherNoteEmailTemplate({
      parentName: parent.full_name ?? 'Sayın Veli',
      teacherName: teacher?.full_name ?? 'Öğretmen',
      studentName: student?.full_name ?? 'Çocuğunuz',
      notePreview: params.notePreview,
      messagesUrl: `${BASE_URL}/parent/messages?child=${params.studentId}`,
    });

    await sendEmail({ to: parent.email, subject, html });
    console.log(`[email/teacher-note] Gönderildi → ${parent.email}`);
  } catch (err) {
    console.error('[email/teacher-note] Hata:', err);
  }
}

/**
 * FAZ 3C — Veli öğretmene not yazdığında e-posta bildirimi.
 */
export async function sendParentNoteToTeacherEmail(params: {
  teacherId: string;
  parentId: string;
  studentId: string;
  notePreview: string;
}): Promise<void> {
  try {
    const [teacher, parent, student] = await Promise.all([
      getProfile(params.teacherId),
      getProfile(params.parentId),
      getProfile(params.studentId),
    ]);
    if (!teacher?.email) return;

    // Template parent-side için yazıldı ama alanları simetrik, alanları
    // dolduran taraflar için tersine çevirebiliriz: parent adı 'senden',
    // teacher adı 'alıcı' olarak kullanılabilir ama template metni "öğretmen
    // size not gönderdi" diyor. Bunu bozmamak için teacher'a yönelik ayrı
    // bir subject/preview ile gönderiyoruz, içerik test-completed pattern'ı
    // ile temsili.
    const { testCompletedEmailTemplate } = await import('./templates');
    const { subject, html } = testCompletedEmailTemplate({
      teacherName: teacher.full_name ?? 'Öğretmen',
      studentName: `${student?.full_name ?? 'Öğrenci'} için ${parent?.full_name ?? 'Veli'} mesajı`,
      testName: params.notePreview.slice(0, 120) + (params.notePreview.length > 120 ? '…' : ''),
      completedAt: new Date().toLocaleString('tr-TR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      resultsUrl: `${BASE_URL}/teacher/dashboard`,
    });

    await sendEmail({
      to: teacher.email,
      subject: `📨 ${parent?.full_name ?? 'Veli'} size mesaj gönderdi — ${student?.full_name ?? 'öğrenci'}`,
      html,
    });
    console.log(`[email/parent-note] Gönderildi → ${teacher.email}`);
  } catch (err) {
    console.error('[email/parent-note] Hata:', err);
  }
}
