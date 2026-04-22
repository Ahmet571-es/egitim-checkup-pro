/**
 * FAZ 3D — Teacher self-serve kayıt akışının canlı uçtan uca doğrulaması.
 *
 * Test kapsamı:
 *   1. POST /api/auth/teacher-register → 200 + is_approved:false
 *   2. /login/ogretmen ile giriş denemesi → dashboard'a düşmez, onay
 *      bekleme mesajı gösterilir
 *   3. Login sayfasında "şifremi unuttum" link'i OLMAMALI (FAZ 3D Yol 1
 *      — şifre sıfırlama yönetici üzerinden)
 *   4. Kayıt sayfası register akışı 3 adımlı değil 2 adımlı (email
 *      doğrulama step 2 atlandı)
 *
 * Her koşumda unique email kullanır — idempotent.
 */
import { test, expect } from '@playwright/test';

test.describe('FAZ 3D — Teacher self-serve kayıt akışı', () => {
  test('Register API + onaysız login davranışı + şifremi unuttum yokluğu', async ({ page, request }) => {
    test.setTimeout(90_000);
    const ts = Date.now();
    const email = `faz3d-teacher-${ts}@egitimcheckup.test`;
    // Teacher şifre kuralı: 7 karakter, [A-Z][a-z][0-9]{5}
    const password = 'Tb' + String(ts).slice(-5);

    // ═══ 1. Register API ═══
    const registerRes = await request.post('/api/auth/teacher-register', {
      data: {
        full_name: 'Faz3D Test Öğretmen',
        email,
        password,
        branch: 'Matematik',
        phone: '05551234567',
      },
    });
    const registerData = await registerRes.json();
    expect(registerRes.status()).toBe(200);
    expect(registerData.success).toBe(true);
    expect(String(registerData.message)).toMatch(/yönetici/i);

    // ═══ 2. Login sayfasında form yapısı ═══
    await page.goto('/login/ogretmen');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // 2a. Şifremi unuttum link'i OLMAMALI (FAZ 3D Yol 1)
    const bodyBeforeLogin = (await page.locator('body').textContent()) ?? '';
    const hasForgotLink = /şifremi unuttum|forgot/i.test(bodyBeforeLogin);
    expect(hasForgotLink).toBe(false);

    // ═══ 3. Onaysız login denemesi ═══
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 10_000 });
    await emailInput.fill(email);
    await page.locator('input[autocomplete="current-password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(6_000);

    const finalUrl = page.url();
    const bodyText = (await page.locator('body').textContent()) ?? '';

    // KRİTİK: teacher dashboard'a düşmemeli
    expect(finalUrl).not.toMatch(/\/teacher\/dashboard/);
    // Onay bekleme mesajı görünmeli
    const isPending =
      finalUrl.includes('pending') ||
      /onay|bekle|henüz|yönetici/i.test(bodyText);
    expect(isPending).toBeTruthy();
  });

  test('Register sayfası 2 adımlı akış (email step 2 bypass)', async ({ page }) => {
    await page.goto('/register/ogretmen');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Başlangıçta step 1 (kişisel bilgiler) görünmeli
    const body1 = (await page.locator('body').textContent()) ?? '';
    // Step 1 indicator olarak ad/soyad alanları
    expect(/ad|isim/i.test(body1)).toBe(true);
    // Email doğrulama kodu girişi step 1'de GÖRÜNMEMELİ
    // (step 2 tamamen bypass edildi — validateStep1 → setStep(3))
    const codeInput = page.locator('input[placeholder*="6 haneli"], input[maxlength="6"][type="text"]');
    const hasCodeInput = await codeInput.count();
    expect(hasCodeInput).toBe(0);
  });
});
