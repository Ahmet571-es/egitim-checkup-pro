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

  test('3. /giris default: only Öğrenci + Öğretmen cards visible (admin hidden)', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/i, level: 1 })).toBeVisible();

    // 2 visible role cards
    await expect(page.getByRole('heading', { name: 'Öğrenci Girişi', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Öğretmen Girişi', level: 2 })).toBeVisible();

    // Admin is hidden by default
    await expect(page.getByRole('heading', { name: 'Yönetici Girişi', level: 2 })).not.toBeVisible();

    // The admin link should not exist in DOM at all (true obscurity)
    const adminLink = page.locator('a[href="/yonetici"]');
    expect(await adminLink.count()).toBe(0);

    // No Veli card
    const veliHeadings = page.getByRole('heading', { name: /Veli/i });
    expect(await veliHeadings.count()).toBe(0);

    // Search input is visible
    await expect(page.getByRole('searchbox', { name: /Hesap türü ara/i })).toBeVisible();
  });

  test('3b. Search "yönetici" reveals admin card', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });

    const search = page.getByRole('searchbox', { name: /Hesap türü ara/i });
    await search.fill('yönetici');

    // Admin card now appears
    await expect(page.getByRole('heading', { name: 'Yönetici Girişi', level: 2 })).toBeVisible();
    await expect(page.locator('a[href="/yonetici"]')).toBeVisible();

    // Other roles hidden because search filters non-matches
    await expect(page.getByRole('heading', { name: 'Öğrenci Girişi', level: 2 })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Öğretmen Girişi', level: 2 })).not.toBeVisible();
  });

  test('3c. Search "admin" (English) reveals admin card', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.getByRole('searchbox', { name: /Hesap türü ara/i }).fill('admin');
    await expect(page.getByRole('heading', { name: 'Yönetici Girişi', level: 2 })).toBeVisible();
  });

  test('3d. Search "yonetici" (no diacritics) reveals admin card', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.getByRole('searchbox', { name: /Hesap türü ara/i }).fill('yonetici');
    await expect(page.getByRole('heading', { name: 'Yönetici Girişi', level: 2 })).toBeVisible();
  });

  test('3e. Search "asdfqwerty" shows empty state', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.getByRole('searchbox', { name: /Hesap türü ara/i }).fill('asdfqwerty');
    await expect(page.getByRole('heading', { name: /Eşleşen hesap türü bulunamadı/i })).toBeVisible();
  });

  test('3f. Clearing search restores default 2 cards (admin re-hides)', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    const search = page.getByRole('searchbox', { name: /Hesap türü ara/i });
    await search.fill('yönetici');
    await expect(page.locator('a[href="/yonetici"]')).toBeVisible();

    // Click the X clear button
    await page.getByRole('button', { name: /Aramayı temizle/i }).click();

    await expect(page.getByRole('heading', { name: 'Öğrenci Girişi', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Öğretmen Girişi', level: 2 })).toBeVisible();
    // Admin re-hidden
    expect(await page.locator('a[href="/yonetici"]').count()).toBe(0);
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

    // Admin card → must first search to reveal it, then click → /yonetici
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    await page.getByRole('searchbox', { name: /Hesap türü ara/i }).fill('yönetici');
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

  test('12. /giris background video is loaded and playing', async ({ page }) => {
    await page.goto(`${PROD}/giris`, { waitUntil: 'networkidle' });
    // Give the video a moment to start playing
    await page.waitForTimeout(3000);

    const videoState = await page.evaluate(async () => {
      const v = document.querySelector('video');
      if (!v) return { exists: false };
      // Ensure it's playing
      try { await v.play(); } catch {}
      await new Promise((r) => setTimeout(r, 500));
      return {
        exists: true,
        paused: v.paused,
        currentTime: v.currentTime,
        duration: v.duration,
        readyState: v.readyState, // 4 = HAVE_ENOUGH_DATA
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight,
        srcLoaded: v.currentSrc.length > 0,
        muted: v.muted, // must be true for autoplay
        loop: v.loop,
      };
    });

    expect(videoState.exists).toBe(true);
    expect(videoState.paused).toBe(false);
    expect(videoState.readyState).toBeGreaterThanOrEqual(2); // at least HAVE_CURRENT_DATA
    expect(videoState.currentTime).toBeGreaterThan(0); // actually advancing
    expect(videoState.videoWidth).toBe(960);
    expect(videoState.videoHeight).toBe(960);
    expect(videoState.muted).toBe(true);
    expect(videoState.loop).toBe(true);
    expect(videoState.srcLoaded).toBe(true);
  });

  test('13. /giris poster image is preloadable as fallback', async ({ page, request }) => {
    const res = await request.get(`${PROD}/giris-poster.jpg`);
    expect(res.status()).toBe(200);
    expect(parseInt(res.headers()['content-length'] || '0', 10)).toBeGreaterThan(10_000);
  });

  test('14. /giris video assets are reachable', async ({ request }) => {
    const mp4 = await request.get(`${PROD}/giris-bg.mp4`);
    expect(mp4.status()).toBe(200);
    const webm = await request.get(`${PROD}/giris-bg.webm`);
    expect(webm.status()).toBe(200);
  });
});
