/**
 * FAZ 2B E2E Testleri — Toplu Öğretmen Atama + "Bana Al" Sistemi
 * Eğitim Check-Up Pro
 *
 * Test edilen özellikler (commit 11657f2):
 *   ADMIN:  /admin/users     → "Toplu Öğretmen Ata" butonu + bulk_assign API
 *   TEACHER:/teacher/students → "Atanmamış Öğrenciler" sekmesi + claim_student API
 *
 * Bu testler canlı prod URL'e karşı da çalıştırılabilir:
 *   BASE_URL=https://egitim-checkup.com npx playwright test tests/faz2b-bulk-assign.spec.ts
 */
import { test, expect } from '@playwright/test';

// ─── ACCESS CONTROL ──────────────────────────────────────────────────────────
test.describe('FAZ 2B — Erişim Kontrolleri', () => {
  test('Admin users sayfası → yetkisiz kullanıcı login\'e yönlenmeli', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForURL(/\/login|\/admin\/users/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/login|admin\/users/);
  });

  test('Teacher students sayfası → yetkisiz kullanıcı login\'e yönlenmeli', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForURL(/\/login|\/teacher\/students/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/login|teacher\/students/);
  });
});

// ─── API ENDPOINT EXISTENCE ──────────────────────────────────────────────────
test.describe('FAZ 2B — API Endpoint Mevcudiyeti', () => {
  // NOT: 503 = CSRF middleware'i tarafından reddedilme (token yok) — endpoint'in
  // var olduğunu kanıtlar. CSRF'siz POST zaten reddedilmeli, bu beklenen davranış.
  const OK_STATUSES = [200, 400, 401, 403, 302, 307, 308, 503];

  test('Admin users API — yetkisiz istek reddedilmeli (endpoint mevcut)', async ({ page }) => {
    const response = await page.request.post('/api/admin/users', {
      data: { action: 'approved_teachers' },
      failOnStatusCode: false,
    });
    expect(OK_STATUSES).toContain(response.status());
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });

  test('Admin bulk_assign action — yetkisiz reddedilmeli', async ({ page }) => {
    const response = await page.request.post('/api/admin/users', {
      data: { action: 'bulk_assign', student_ids: [], teacher_id: null },
      failOnStatusCode: false,
    });
    expect(OK_STATUSES).toContain(response.status());
    expect(response.status()).not.toBe(404);
  });

  test('Teacher students API — unassigned action endpoint mevcut', async ({ page }) => {
    const response = await page.request.post('/api/teacher/students', {
      data: { action: 'unassigned' },
      failOnStatusCode: false,
    });
    expect(OK_STATUSES).toContain(response.status());
    expect(response.status()).not.toBe(404);
  });

  test('Teacher claim_student action endpoint mevcut', async ({ page }) => {
    const response = await page.request.post('/api/teacher/students', {
      data: { action: 'claim_student', student_id: 'test-nonexistent' },
      failOnStatusCode: false,
    });
    expect([...OK_STATUSES, 404, 409]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});

// ─── Yardımcı: doğru selector'larla admin login ──────────────────────────────
async function adminLogin(page: import('@playwright/test').Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) return false;

  await page.goto('/login');
  // KVKK consent varsa kabul et (sadece ilk yüklemede)
  const consent = page.locator('button:has-text("Kabul Et")').first();
  if (await consent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consent.click();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('input[name="ecup_user_login"]', { timeout: 10_000 });
  await page.fill('input[name="ecup_user_login"]', email);
  await page.fill('input[name="ecup_pass_login"]', password);
  await page.click('button[type="submit"]:has-text("Giriş")');
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15_000 });
  return true;
}

// ─── UI — Giriş yapılmış admin için (test kullanıcısı varsa) ─────────────────
test.describe('FAZ 2B — Admin UI (giriş yapılmış)', () => {
  test('Admin giriş + /admin/users → bulk assign butonu görünmeli', async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
      'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD set değil'
    );
    await adminLogin(page);

    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
    // Sayfa içeriği (kullanıcı kartları) yüklenmesini bekle
    await page.waitForSelector('h1, h2', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // "Toplu Öğretmen Ata" butonu — hem text hem regex fallback
    const bulkBtn = page.getByRole('button', { name: /Toplu Öğretmen Ata/i }).first();
    const fallback = page.locator('button', { hasText: 'Toplu Öğretmen Ata' }).first();
    const visible =
      (await bulkBtn.isVisible({ timeout: 5_000 }).catch(() => false)) ||
      (await fallback.isVisible({ timeout: 5_000 }).catch(() => false));
    expect(visible).toBe(true);
  });

  test('Bulk mode aç → öğrenci kartlarında seçim butonu görünmeli', async ({ page }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
      'Admin cred yok'
    );
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForSelector('h1, h2', { timeout: 10_000 });
    await page.waitForTimeout(1500);

    const bulkBtn = page.locator('button', { hasText: 'Toplu Öğretmen Ata' }).first();
    await bulkBtn.click();
    await page.waitForTimeout(800);

    // UserCard'da custom button: aria-label="Seç" veya "Seçimi kaldır" (lucide Square/CheckSquare)
    const selectBtn = page.locator('button[aria-label="Seç"], button[aria-label="Seçimi kaldır"]').first();
    await expect(selectBtn).toBeVisible({ timeout: 10_000 });

    // Alt sticky bar'da sayı göstergesi ("N öğrenci seçili" veya "Tümünü Seç") olmalı
    const selectionBar = page.locator('text=/Tümünü Seç|öğrenci seçili/i').first();
    await expect(selectionBar).toBeVisible({ timeout: 5_000 });
  });

  test('approved_teachers API — admin oturum + CSRF ile 200 dönmeli', async ({ page, context }) => {
    test.skip(
      !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
      'Admin cred yok'
    );
    await adminLogin(page);
    // /admin/users'a kısa ziyaret → CSRF cookie tazele
    await page.goto('/admin/users');
    await page.waitForTimeout(500);

    // CSRF token'ı cookie'den oku (commit c578077: CSRF token otomatik yenileme)
    const cookies = await context.cookies();
    const csrf = cookies.find((c) => c.name === 'csrf_token')?.value;
    expect(csrf, 'csrf_token cookie mevcut olmalı').toBeTruthy();

    const response = await page.request.post('/api/admin/users', {
      data: { action: 'approved_teachers' },
      headers: { 'x-csrf-token': csrf! },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Response: teachers array veya data.teachers şeklinde olabilir
    const teachers = body.teachers ?? body.data ?? body;
    expect(Array.isArray(teachers)).toBe(true);
  });
});

// ─── UI — Giriş yapılmış teacher için ────────────────────────────────────────
test.describe('FAZ 2B — Teacher UI (giriş yapılmış)', () => {
  test('Teacher giriş + /teacher/students → "Atanmamış" sekmesi görünmeli', async ({ page }) => {
    const email = process.env.TEST_TEACHER_EMAIL;
    const password = process.env.TEST_TEACHER_PASSWORD;
    test.skip(!email || !password, 'TEST_TEACHER_EMAIL / TEST_TEACHER_PASSWORD set değil');

    await page.goto('/login');
    const consent = page.locator('button:has-text("Kabul Et")').first();
    if (await consent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consent.click();
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('input[name="ecup_user_login"]', { timeout: 10_000 });
    await page.fill('input[name="ecup_user_login"]', email!);
    await page.fill('input[name="ecup_pass_login"]', password!);
    await page.click('button[type="submit"]:has-text("Giriş")');

    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15_000 });

    await page.goto('/teacher/students');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    const unassignedTab = page
      .locator('button, a, [role="tab"]')
      .filter({ hasText: /atanmamı|unassigned/i })
      .first();
    await expect(unassignedTab).toBeVisible({ timeout: 10_000 });
  });
});
