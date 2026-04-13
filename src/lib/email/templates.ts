/**
 * E-posta Şablonları — Türkçe, profesyonel HTML
 * Tüm şablonlar mobil responsive
 */
import { BASE_URL } from './client';

// ─── Ortak Layout ────────────────────────────────────────────────────────────
function wrapLayout(content: string, previewText: string = ''): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eğitim Check-Up Pro</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f0f5ff;font-family:'Segoe UI',Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f5ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,40,71,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2847 0%,#1a3d6e 100%);padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:12px;">
                      <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                        <span style="color:white;font-size:20px;">🎓</span>
                      </div>
                      <div>
                        <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">Eğitim Check-Up Pro</div>
                        <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:1px;">Psikometrik Test Platformu</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e8edf5;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                © ${new Date().getFullYear()} Eğitim Check-Up Pro — Tüm hakları saklıdır.
              </p>
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                📧 destek@egitimcheckup.com &nbsp;|&nbsp; 📞 0850 123 45 67
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Bu e-postayı almak istemiyorsanız <a href="${BASE_URL}/profil/bildirimler" style="color:#10b981;">buraya tıklayın</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string, color = '#10b981'): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="background:${color};border-radius:12px;padding:0;">
        <a href="${href}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoBox(content: string, color = '#f0fdf4', border = '#10b981'): string {
  return `<div style="background:${color};border-left:4px solid ${border};border-radius:0 12px 12px 0;padding:16px 20px;margin:16px 0;">
    ${content}
  </div>`;
}

// ─── Şablonlar ────────────────────────────────────────────────────────────────

/** 1. Hoş Geldin E-postası */
export function welcomeEmailTemplate(params: {
  fullName: string;
  role: string;
  loginUrl?: string;
}): { subject: string; html: string } {
  const loginUrl = params.loginUrl ?? `${BASE_URL}/login`;

  const content = `
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Hoş Geldiniz, ${params.fullName}! 🎉</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Eğitim Check-Up Pro ailesine katıldığınız için teşekkür ederiz. 
      Hesabınız <strong style="color:#0f2847;">${params.role}</strong> rolüyle başarıyla oluşturuldu.
    </p>
    ${infoBox(`
      <p style="margin:0 0 6px;color:#166534;font-size:13px;font-weight:700;">✅ Hesabınız aktif</p>
      <p style="margin:0;color:#166534;font-size:13px;">Platforma giriş yaparak psikometrik testlere erişebilirsiniz.</p>
    `)}
    <h2 style="margin:24px 0 12px;color:#0f2847;font-size:16px;font-weight:700;">Platformda Neler Yapabilirsiniz?</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${[
        ['🧠', 'Psikometrik Testler', '10 farklı test ile öğrencilerin güçlü yönlerini keşfedin'],
        ['📊', 'AI Raporlar', 'Yapay zeka destekli kişiselleştirilmiş analizler'],
        ['👥', 'Panel Yönetimi', 'Rol bazlı erişim ile ekibinizi yönetin'],
      ].map(([emoji, title, desc]) => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:36px;">
            <span style="font-size:20px;">${emoji}</span>
          </td>
          <td style="padding:8px 0 8px 8px;">
            <strong style="color:#0f2847;font-size:14px;">${title}</strong>
            <br/>
            <span style="color:#64748b;font-size:13px;">${desc}</span>
          </td>
        </tr>
      `).join('')}
    </table>
    ${ctaButton('Platforma Giriş Yap', loginUrl)}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Sorunuz mu var? <a href="mailto:destek@egitimcheckup.com" style="color:#10b981;">destek@egitimcheckup.com</a> adresimize yazın.
    </p>
  `;

  return {
    subject: `Eğitim Check-Up Pro'ya Hoş Geldiniz, ${params.fullName}!`,
    html: wrapLayout(content, `Hesabınız başarıyla oluşturuldu. Platforma giriş yapın.`),
  };
}

/** 2. Test Atandı Bildirimi (Öğrenciye) */
export function testAssignedEmailTemplate(params: {
  studentName: string;
  testName: string;
  teacherName: string;
  testUrl?: string;
}): { subject: string; html: string } {
  const testUrl = params.testUrl ?? `${BASE_URL}/student/my-tests`;

  const content = `
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Yeni Test Atandı 📝</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${params.studentName}</strong>,<br/>
      Öğretmeniniz <strong>${params.teacherName}</strong> size yeni bir test atadı.
    </p>
    ${infoBox(`
      <p style="margin:0 0 4px;color:#1e40af;font-size:13px;font-weight:700;">📋 Test Bilgisi</p>
      <p style="margin:0;color:#1e40af;font-size:15px;font-weight:800;">${params.testName}</p>
    `, '#eff6ff', '#3b82f6')}
    <p style="margin:16px 0;color:#64748b;font-size:14px;line-height:1.6;">
      Bu test, güçlü yönlerinizi ve öğrenme stilinizi keşfetmenize yardımcı olacak. 
      Soruları dikkatlice okuyun ve içtenlikle yanıtlayın.
    </p>
    ${ctaButton('Teste Başla', testUrl, '#7c3aed')}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Herhangi bir sorunuz varsa öğretmeninize danışın.
    </p>
  `;

  return {
    subject: `Yeni Test: ${params.testName} — Eğitim Check-Up Pro`,
    html: wrapLayout(content, `${params.teacherName} size ${params.testName} testini atadı.`),
  };
}

/** 3. Test Tamamlandı Bildirimi (Öğretmene) */
export function testCompletedEmailTemplate(params: {
  teacherName: string;
  studentName: string;
  testName: string;
  completedAt: string;
  resultsUrl?: string;
}): { subject: string; html: string } {
  const resultsUrl = params.resultsUrl ?? `${BASE_URL}/teacher/results`;

  const content = `
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Test Tamamlandı ✅</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${params.teacherName}</strong>,<br/>
      Öğrenciniz bir testi tamamladı.
    </p>
    ${infoBox(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:4px 0;color:#166534;font-size:13px;width:120px;font-weight:700;">👤 Öğrenci:</td>
          <td style="padding:4px 0;color:#166534;font-size:13px;font-weight:800;">${params.studentName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#166534;font-size:13px;width:120px;font-weight:700;">📋 Test:</td>
          <td style="padding:4px 0;color:#166534;font-size:13px;">${params.testName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#166534;font-size:13px;width:120px;font-weight:700;">🕐 Tarih:</td>
          <td style="padding:4px 0;color:#166534;font-size:13px;">${params.completedAt}</td>
        </tr>
      </table>
    `)}
    <p style="margin:16px 0;color:#64748b;font-size:14px;line-height:1.6;">
      AI analiz raporu üretmek için sonuçlar sayfasını ziyaret edin.
    </p>
    ${ctaButton('Sonuçları Gör ve Rapor Üret', resultsUrl)}
  `;

  return {
    subject: `${params.studentName} — ${params.testName} Tamamlandı`,
    html: wrapLayout(content, `${params.studentName} ${params.testName} testini tamamladı.`),
  };
}

/** 4. Rapor Hazır Bildirimi (Veliye) */
export function reportReadyEmailTemplate(params: {
  parentName: string;
  studentName: string;
  reportType: string;
  reportsUrl?: string;
}): { subject: string; html: string } {
  const reportsUrl = params.reportsUrl ?? `${BASE_URL}/parent/results`;

  const content = `
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">Rapor Hazır 📄</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${params.parentName}</strong>,<br/>
      Çocuğunuz için hazırlanan rapor artık görüntülemeye hazır.
    </p>
    ${infoBox(`
      <p style="margin:0 0 4px;color:#9d174d;font-size:13px;font-weight:700;">💝 Çocuğunuz için rapor hazırlandı</p>
      <p style="margin:0 0 4px;color:#9d174d;font-size:14px;">
        <strong>${params.studentName}</strong> için <strong>${params.reportType}</strong> raporu oluşturuldu.
      </p>
      <p style="margin:4px 0 0;color:#9d174d;font-size:12px;">
        Raporda çocuğunuzun gelişimine katkıda bulunacak özel öneriler ve destek rehberi yer almaktadır.
      </p>
    `, '#fdf2f8', '#ec4899')}
    <h3 style="margin:20px 0 12px;color:#0f2847;font-size:15px;font-weight:700;">Raporda Neler Bulacaksınız?</h3>
    <ul style="margin:0 0 20px;padding-left:20px;color:#64748b;font-size:14px;line-height:2;">
      <li>✨ Güçlü yönler ve özel yetenekler</li>
      <li>📚 Öğrenme stiline uygun çalışma önerileri</li>
      <li>💡 Evde yapabilecekleriniz (Yapın / Yapmayın listesi)</li>
      <li>🎯 Kısa ve uzun vadeli gelişim hedefleri</li>
    </ul>
    ${ctaButton('Raporu Görüntüle', reportsUrl, '#ec4899')}
  `;

  return {
    subject: `${params.studentName} için Veli Raporu Hazır — Eğitim Check-Up Pro`,
    html: wrapLayout(content, `${params.studentName} için özel veli raporu hazırlandı.`),
  };
}

/** 5. Lisans Süresi Dolmak Üzere (Okul Yöneticisine) */
export function licenseExpiringEmailTemplate(params: {
  adminName: string;
  schoolName: string;
  daysLeft: number;
  expiryDate: string;
  renewUrl?: string;
}): { subject: string; html: string } {
  const renewUrl = params.renewUrl ?? `${BASE_URL}/school/billing`;

  const urgencyColor = params.daysLeft <= 1 ? '#dc2626' : params.daysLeft <= 3 ? '#f59e0b' : '#3b82f6';

  const content = `
    <h1 style="margin:0 0 8px;color:#0f2847;font-size:24px;font-weight:800;">⚠️ Lisansınız Yakında Sona Eriyor</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${params.adminName}</strong>,<br/>
      <strong>${params.schoolName}</strong> okulunuzun lisansı dolmak üzere.
    </p>
    ${infoBox(`
      <div style="text-align:center;">
        <div style="font-size:48px;font-weight:800;color:${urgencyColor};">${params.daysLeft}</div>
        <div style="font-size:14px;color:${urgencyColor};font-weight:600;">gün kaldı</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">Son gün: ${params.expiryDate}</div>
      </div>
    `, '#fff7ed', urgencyColor)}
    <p style="margin:16px 0;color:#64748b;font-size:14px;line-height:1.6;">
      Lisansınız sona erdiğinde öğrencileriniz test çözme erişimini kaybedecek. 
      Hizmet kesintisi yaşamamak için lisansınızı şimdi yenileyin.
    </p>
    ${ctaButton('Lisansı Yenile', renewUrl, urgencyColor)}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Fatura veya ödeme konusunda yardım için <a href="mailto:destek@egitimcheckup.com" style="color:#10b981;">destek@egitimcheckup.com</a>
    </p>
  `;

  return {
    subject: `⚠️ Lisansınız ${params.daysLeft} Gün İçinde Sona Eriyor — ${params.schoolName}`,
    html: wrapLayout(content, `Dikkat: Lisansınız ${params.daysLeft} gün sonra sona eriyor.`),
  };
}

/** 6. Lisans Süresi Doldu (Okul Yöneticisine) */
export function licenseExpiredEmailTemplate(params: {
  adminName: string;
  schoolName: string;
  expiredDate: string;
  renewUrl?: string;
}): { subject: string; html: string } {
  const renewUrl = params.renewUrl ?? `${BASE_URL}/school/billing`;

  const content = `
    <h1 style="margin:0 0 8px;color:#dc2626;font-size:24px;font-weight:800;">🔴 Lisansınız Sona Erdi</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Merhaba <strong style="color:#0f2847;">${params.adminName}</strong>,<br/>
      <strong>${params.schoolName}</strong> okulunuzun lisansı <strong>${params.expiredDate}</strong> tarihinde sona erdi.
    </p>
    ${infoBox(`
      <p style="margin:0 0 6px;color:#991b1b;font-size:13px;font-weight:700;">❌ Erişim Kısıtlandı</p>
      <ul style="margin:0;padding-left:16px;color:#991b1b;font-size:13px;line-height:2;">
        <li>Öğrenciler yeni test çözemez</li>
        <li>Yeni AI raporu üretilemez</li>
        <li>Yeni kullanıcı eklenemez</li>
      </ul>
    `, '#fef2f2', '#dc2626')}
    <p style="margin:16px 0;color:#64748b;font-size:14px;line-height:1.6;">
      Mevcut raporlarınız ve verileriniz güvende. Lisansınızı yenilediğinizde tüm erişimleriniz anında açılacak.
    </p>
    ${ctaButton('Hemen Lisans Yenile', renewUrl, '#dc2626')}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Acil destek: <a href="tel:+908501234567" style="color:#dc2626;">0850 123 45 67</a> &nbsp;|&nbsp;
      <a href="mailto:destek@egitimcheckup.com" style="color:#10b981;">destek@egitimcheckup.com</a>
    </p>
  `;

  return {
    subject: `🔴 Lisans Sona Erdi — ${params.schoolName} Erişimi Kısıtlandı`,
    html: wrapLayout(content, `${params.schoolName} lisansınız sona erdi. Yenilemek için tıklayın.`),
  };
}
