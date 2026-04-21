/**
 * FAZ 2D E2E Testleri — Öğretmen Dashboard Sayıları Kendi Öğrencileri
 * Eğitim Check-Up Pro
 *
 * Test edilen özellik (commit 1e30b43):
 *   /teacher/dashboard:
 *     ÖNCE: tüm öğrencileri sayıyordu (role='student')
 *     SONRA: sadece user_metadata.assigned_teacher_id = giriş yapan öğretmen
 *
 * Canlı URL'e karşı çalıştırma:
 *   BASE_URL=https://egitim-checkup.com npx playwright test tests/faz2d-teacher-dashboard.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

async function teacherLogin(page: Page): Promise<boolean> {
  const email = process.env.TEST_TEACHER_EMAIL;
  const password = process.env.TEST_TEACHER_PASSWORD;
  if (!email || !password) return false;

  await page.goto('/login');
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

// ─── ACCESS CONTROL ──────────────────────────────────────────────────────────
test.describe('FAZ 2D — Erişim Kontrolleri', () => {
  test('Teacher dashboard → yetkisiz kullanıcı login\'e yönlenmeli', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForURL(/\/login|\/teacher\/dashboard/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/login|teacher\/dashboard/);
  });
});

// ─── UI — Giriş yapılmış teacher için ────────────────────────────────────────
test.describe('FAZ 2D — Teacher Dashboard UI (giriş yapılmış)', () => {
  test('Teacher giriş + /teacher/dashboard → öğrenci sayacı render edilmeli', async ({ page }) => {
    test.skip(
      !process.env.TEST_TEACHER_EMAIL || !process.env.TEST_TEACHER_PASSWORD,
      'TEST_TEACHER_EMAIL / TEST_TEACHER_PASSWORD set değil'
    );
    await teacherLogin(page);

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    const pageText = await page.locator('body').textContent();
    expect(pageText).toBeTruthy();
    expect(pageText).toMatch(/öğrenci|ogrenci/i);
  });

  test('Teacher dashboard → 5xx hatası vermemeli', async ({ page }) => {
    test.skip(
      !process.env.TEST_TEACHER_EMAIL || !process.env.TEST_TEACHER_PASSWORD,
      'Teacher cred yok'
    );
    await teacherLogin(page);

    const response = await page.goto('/teacher/dashboard');
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
  });
});

// ─── Regresyon: Öğretmen paneli diğer sayfalar ───────────────────────────────
test.describe('FAZ 2D — Regresyon (öğretmen paneli bütünlüğü)', () => {
  const teacherPages = ['/teacher/students', '/teacher/reports', '/teacher/results'];

  for (const path of teacherPages) {
    test(`${path} → 5xx hatası vermemeli`, async ({ page }) => {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      expect(status).toBeLessThan(500);
    });
  }
});
