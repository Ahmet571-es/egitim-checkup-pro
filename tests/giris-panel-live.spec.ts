// E2E live test — verifies the new /giris panel deployment on production.
// Run: npx playwright test tests/giris-panel-live.spec.ts --project=chromium

import { test, expect } from '@playwright/test';

const PROD = 'https://egitim-checkup.com';

test.describe('Giriş Paneli — Live Deployment', () => {
  test.setTimeout(60_000);

  test('1. Homepage no longer shows 4 role login buttons in hero', async ({ page }) => {
    await page.goto(PROD, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Eğitim Check-Up/i);

    // Hero should NOT have the old role-specific buttons
    const heroCta = page.locator('.hero-cta');
    await expect(heroCta).toBeVisible();
    const heroText = (await heroCta.innerText()).toUpperCase();

    expect(heroText).not.toMatch(/\bÖĞRENCİ\b/);
    expect(heroText).not.toMatch(/\bÖĞRETMEN\b/);
    expect(heroText).not.toMatch(/\bYÖNETİCİ\b/);
    expect(heroText).not.toMatch(/\bVELİ\b/);

    // Hero SHOULD have the new 2 CTAs
    expect(heroText).toMatch(/TESTLERİ KEŞFET/);
    expect(heroText).toMatch(/GİRİŞ YAP/);
  });

  test('2. Navbar shows Giriş Yap button (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PROD, { waitUntil: 'networkidle' });

    const navGirisLink = page.locator('nav a[href="/giris"]').first();
    await expect(navGirisLink).toBeVisible();
    await expect(navGirisLink).toContainText(/Giriş Yap/i);
  });

  test('3. /giris page loads with 3 role cards', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/i, level: 1 })).toBeVisible();

    // 3 role cards
    await expect(page.getByRole('heading', { name: 'Öğrenci Girişi', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Öğretmen Girişi', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yönetici Girişi', level: 2 })).toBeVisible();

    // No Veli card
    const veliHeadings = page.getByRole('heading', { name: /Veli/i });
    expect(await veliHeadings.count()).toBe(0);

    // Verify the card links
    const studentLink = page.locator('a[href="/login"]').filter({ hasText: 'Öğrenci Girişi' });
    const teacherLink = page.locator('a[href="/login/ogretmen"]').filter({ hasText: 'Öğretmen Girişi' });
    const adminLink = page.locator('a[href="/yonetici"]').filter({ hasText: 'Yönetici Girişi' });
    await expect(studentLink).toBeVisible();
    await expect(teacherLink).toBeVisible();
    await expect(adminLink).toBeVisible();
  });

  test('4. /login/veli route returns 404 (deleted)', async ({ page }) => {
    const response = await page.goto(`${PROD}/login/veli`, { waitUntil: 'domcontentloaded' });
    // Either 404 status, or redirected, or our not-found page is shown
    const status = response?.status() ?? 0;
    const content = (await page.content()).toLowerCase();
    const is404 = status === 404 || content.includes('404') || content.includes('not found') || content.includes('bulunamadı');
    expect(is404).toBeTruthy();
  });

  test('5. Trial VARK page loads (CTA verified by test #11 end-to-end)', async ({ page }) => {
    const response = await page.goto(`${PROD}/trial/vark`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: /Teste Başla/i })).toBeVisible();
  });

  test('6. Trial Beyin page loads', async ({ page }) => {
    const response = await page.goto(`${PROD}/trial/beyin`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
  });

  test('7. Trial Calisma page loads', async ({ page }) => {
    const response = await page.goto(`${PROD}/trial/calisma`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
  });

  test('8. Trial Çoklu Zekâ page loads', async ({ page }) => {
    const response = await page.goto(`${PROD}/trial/coklu-zeka`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
  });

  test('9. /giris cards navigate to correct login pages', async ({ page }) => {
    // Student card → /login
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.locator('a[href="/login"]').filter({ hasText: 'Öğrenci Girişi' }).click();
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');

    // Teacher card → /login/ogretmen
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.locator('a[href="/login/ogretmen"]').filter({ hasText: 'Öğretmen Girişi' }).click();
    await page.waitForURL(/\/login\/ogretmen/, { timeout: 10_000 });
    expect(page.url()).toContain('/login/ogretmen');

    // Admin card → /yonetici
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.locator('a[href="/yonetici"]').filter({ hasText: 'Yönetici Girişi' }).click();
    await page.waitForURL(/\/yonetici/, { timeout: 10_000 });
    expect(page.url()).toContain('/yonetici');
  });

  test('10. Hero "Giriş Yap" CTA navigates to /giris', async ({ page }) => {
    await page.goto(PROD, { waitUntil: 'networkidle' });
    await page.locator('.hero-cta a[href="/giris"]').click();
    await page.waitForURL(/\/giris/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/i })).toBeVisible();
  });

  test('11. FULL E2E: complete VARK trial → verify result CTA points to /giris', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(`${PROD}/trial/vark`, { waitUntil: 'networkidle' });

    // Start the test
    await page.getByRole('button', { name: /Teste Başla/i }).click();

    // Answer all 16 questions by clicking the first option (a) each time
    for (let i = 0; i < 16; i++) {
      // Click option "A" (first option button — they show A/B/C/D badges)
      const optionA = page.locator('button:has-text("A")').filter({ has: page.locator('div', { hasText: /^A$/ }) }).first();
      await optionA.click({ timeout: 5_000 });

      // Click İleri or Sonucu Gör
      const nextBtn = page.getByRole('button', { name: /İleri|Sonucu Gör/i });
      await nextBtn.click();
      // brief wait for state transition
      await page.waitForTimeout(150);
    }

    // Now we should be on the result page — verify the new CTAs
    const girisLink = page.locator('a[href="/giris"]').first();
    await expect(girisLink).toBeVisible({ timeout: 10_000 });
    await expect(girisLink).toContainText(/Detaylı Analiz İçin Giriş Yap/i);

    const paketLink = page.locator('a[href="/paketler"]').filter({ hasText: /Paketleri İncele/i }).first();
    await expect(paketLink).toBeVisible();
  });
});
