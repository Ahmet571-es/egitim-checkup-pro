/**
 * FAZ 4 — E-posta Bildirim Sistemi
 * Şimdilik mock fonksiyonlar — ileride Resend API bağlanacak
 */

// ── Tipler ──────────────────────────────────────────────────
export interface NotificationPreferences {
  email_test_complete: boolean;
  email_report_ready: boolean;
  email_teacher_note: boolean;
  email_weekly_summary: boolean;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// ── Türkçe, mobil uyumlu HTML template'leri ─────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eğitim Check-Up</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#ec4899,#f43f5e);padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">🎓 Eğitim Check-Up</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Çocuğunuzun gelişim takip platformu</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding:32px;">
        ${content}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #f0f0f0;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">Bu e-posta Eğitim Check-Up Pro tarafından gönderilmiştir.</p>
        <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">Bildirim tercihlerinizi platformdan değiştirebilirsiniz.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── E-posta template fonksiyonları ──────────────────────────

export function buildTestCompleteEmail(params: {
  parentName: string;
  studentName: string;
  testLabel: string;
}): EmailPayload {
  const { parentName, studentName, testLabel } = params;
  return {
    to: '', // Gerçek e-posta adresi çağıran fonksiyon tarafından doldurulacak
    subject: `${studentName} yeni bir testi tamamladı!`,
    html: baseTemplate(`
      <h2 style="margin:0 0 12px;color:#0f2847;font-size:18px;">Sayın ${parentName},</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        Çocuğunuz <strong style="color:#ec4899;">${studentName}</strong>,
        <strong>${testLabel}</strong> testini başarıyla tamamladı.
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        Sonuçları incelemek için platformu ziyaret edebilirsiniz.
      </p>
      <a href="https://egitim-checkup.com/parent/results"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;">
        Sonuçları Görüntüle →
      </a>
    `),
  };
}

export function buildReportReadyEmail(params: {
  parentName: string;
  studentName: string;
}): EmailPayload {
  const { parentName, studentName } = params;
  return {
    to: '',
    subject: `${studentName} için yeni rapor hazır!`,
    html: baseTemplate(`
      <h2 style="margin:0 0 12px;color:#0f2847;font-size:18px;">Sayın ${parentName},</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        <strong style="color:#ec4899;">${studentName}</strong> için yeni bir detaylı rapor hazırlandı.
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        Rapor, çocuğunuzun güçlü yönleri, gelişim alanları ve evde yapabileceğiniz pratik öneriler içeriyor.
      </p>
      <a href="https://egitim-checkup.com/parent/results"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;">
        Raporu Oku →
      </a>
    `),
  };
}

export function buildTeacherNoteEmail(params: {
  parentName: string;
  teacherName: string;
  studentName: string;
}): EmailPayload {
  const { parentName, teacherName, studentName } = params;
  return {
    to: '',
    subject: `${teacherName} öğretmeninden yeni bir not var`,
    html: baseTemplate(`
      <h2 style="margin:0 0 12px;color:#0f2847;font-size:18px;">Sayın ${parentName},</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        <strong>${teacherName}</strong> öğretmen,
        <strong style="color:#ec4899;">${studentName}</strong> hakkında size bir not bıraktı.
      </p>
      <a href="https://egitim-checkup.com/parent/dashboard"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;">
        Notu Oku →
      </a>
    `),
  };
}

export function buildWeeklySummaryEmail(params: {
  parentName: string;
  studentName: string;
  completedTestCount: number;
  newReportCount: number;
}): EmailPayload {
  const { parentName, studentName, completedTestCount, newReportCount } = params;
  return {
    to: '',
    subject: `${studentName} — Haftalık Özet`,
    html: baseTemplate(`
      <h2 style="margin:0 0 12px;color:#0f2847;font-size:18px;">Sayın ${parentName},</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;">
        İşte <strong style="color:#ec4899;">${studentName}</strong> için bu haftanın özeti:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr>
          <td style="padding:12px;background-color:#fdf2f8;border-radius:12px;text-align:center;width:50%;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ec4899;">${completedTestCount}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Tamamlanan Test</p>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px;background-color:#fdf2f8;border-radius:12px;text-align:center;width:50%;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ec4899;">${newReportCount}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Yeni Rapor</p>
          </td>
        </tr>
      </table>
      <a href="https://egitim-checkup.com/parent/dashboard"
         style="display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-weight:700;font-size:14px;border-radius:12px;text-decoration:none;">
        Detaylı İncele →
      </a>
    `),
  };
}

// ── Mock Gönderim Fonksiyonu ────────────────────────────────
// İleride Resend API ile değiştirilecek
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
  console.log('[MOCK E-POSTA]', {
    to: payload.to,
    subject: payload.subject,
    htmlLength: payload.html.length,
  });

  // Mock: başarılı gönderim simüle et
  return {
    success: true,
    messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

// ── Bildirim Tercihi Getir ──────────────────────────────────
export async function getNotificationPreferences(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>,
  userId: string
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    return {
      email_test_complete: data.email_test_complete ?? true,
      email_report_ready: data.email_report_ready ?? true,
      email_teacher_note: data.email_teacher_note ?? true,
      email_weekly_summary: data.email_weekly_summary ?? false,
    };
  }

  // Varsayılan tercihler
  return {
    email_test_complete: true,
    email_report_ready: true,
    email_teacher_note: true,
    email_weekly_summary: false,
  };
}

// ── Bildirim Tercihi Kaydet ─────────────────────────────────
export async function saveNotificationPreferences(
  supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>,
  userId: string,
  prefs: NotificationPreferences
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return !error;
}
