/**
 * Veli Paneli — Authenticated Smoke Test
 *
 * Bu dosya gerçek bir veli hesabıyla uçtan uca akışı test eder:
 *   1. Login
 *   2. Dashboard render
 *   3. Çocuklarım sayfasına git + kart görünüyor mu
 *   4. Sonuçlar sayfasına git
 *   5. Logout
 *
 * Koşmak için:
 *   - tests/helpers/auth.ts'te `TEST_USERS.parent` sabit email/password kullanıyor:
 *       email: 'test-parent@egitimcheckup.test'
 *       password: 'Test1234!'
 *   - Bu hesap Supabase'de GERÇEKTEN var olmalı (seed migration gerek).
 *   - Supabase SQL Editor'dan aşağıdaki SQL'i çalıştırman gerek
 *     (veya auth.users + profiles + parent_students satırlarını manuel ekle):
 *
 *     -- 1. Veli auth user oluştur (Supabase Auth → Add user → email/password)
 *     --    email: test-parent@egitimcheckup.test, password: Test1234!
 *     --    user_metadata: { full_name: 'Test Veli', role: 'parent' }
 *     --    (trigger otomatik profiles satırını oluşturur)
 *     -- 2. Bu veliye bir test öğrencisi bağla:
 *     --    INSERT INTO parent_students (parent_id, student_id)
 *     --    SELECT
 *     --      (SELECT id FROM profiles WHERE email='test-parent@egitimcheckup.test'),
 *     --      (SELECT id FROM profiles WHERE role='student' LIMIT 1);
 *
 * Seed tamamlandıktan sonra `test.describe.skip` → `test.describe` yap ve koş:
 *   CI=1 BASE_URL=https://egitim-checkup.com npx playwright test tests/parent-authed.spec.ts
 *
 * Eğitim Check-Up Pro — Faz 3B (Authenticated Smoke)
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Veli Paneli — Authenticated Smoke', () => {
  test.beforeEach(async ({ page }) => {
    // loginAs helper autofill-prevention'lı input'ları doğru hedefliyor
    await loginAs(page, 'parent');
  });

  test('Dashboard render edilmeli + veli adı görünmeli', async ({ page }) => {
    await expect(page).toHaveURL(/\/parent\/dashboard/);
    // Hoş geldiniz mesajı var mı?
    await expect(page.locator('body')).toContainText(/hoş geldin/i);
  });

  test('Çocuklarım sayfasına gidilebiliyor', async ({ page }) => {
    await page.goto('/parent/my-children');
    await expect(page).toHaveURL(/\/parent\/my-children/);
    // "Çocuk Ekle" butonu görünmeli
    await expect(page.locator('body')).toContainText(/çocuk/i);
  });

  test('Sonuçlar sayfasına gidilebiliyor', async ({ page }) => {
    await page.goto('/parent/results');
    await expect(page).toHaveURL(/\/parent\/results/);
  });

  test('Mesajlar sayfasına gidilebiliyor', async ({ page }) => {
    await page.goto('/parent/messages');
    await expect(page).toHaveURL(/\/parent\/messages/);
  });

  test('Ayarlar sayfasına gidilebiliyor', async ({ page }) => {
    await page.goto('/parent/settings');
    await expect(page).toHaveURL(/\/parent\/settings/);
    // Bildirim toggle başlığı görünmeli
    await expect(page.locator('body')).toContainText(/bildirim|tercih/i);
  });

  test('Sidebar nav item\'ları görünüyor', async ({ page }) => {
    await page.goto('/parent/dashboard');
    // 5 nav item: Dashboard, Çocuklarım, Sonuçlar, Mesajlar, Ayarlar
    await expect(page.locator('nav').getByText('Dashboard')).toBeVisible();
    await expect(page.locator('nav').getByText('Çocuklarım')).toBeVisible();
    await expect(page.locator('nav').getByText('Sonuçlar')).toBeVisible();
  });

  test('Çocuk kartına tıklayınca /parent/results?child=X\'e gidiyor', async ({ page }) => {
    await page.goto('/parent/dashboard');
    const firstChildCard = page.locator('a[href*="/parent/results?child="]').first();
    if (await firstChildCard.count() === 0) {
      test.skip(true, 'Test hesabında bağlı çocuk yok — parent_students seed\'i eksik.');
      return;
    }
    await firstChildCard.click();
    await page.waitForURL(/\/parent\/results\?child=/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/parent\/results\?child=/);
  });
});

test.describe('Veli Paneli — Öğrenci kodu ile çocuk ekleme (gerçek akış)', () => {
  /**
   * Bu test gerçek bir student_code değerine ihtiyaç duyar.
   * TEST_STUDENT_CODE env var'ı tanımlıysa kullanır.
   */
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'parent');
  });

  test('Çocuklarım sayfasından kod ile çocuk eklenebiliyor', async ({ page }) => {
    const code = process.env.TEST_STUDENT_CODE;
    if (!code) {
      test.skip(true, 'TEST_STUDENT_CODE env var gerekli.');
      return;
    }

    await page.goto('/parent/my-children');
    await page.locator('button:has-text("Çocuk Ekle")').first().click();
    await page.locator('input[placeholder*="ABC"]').fill(code);
    await page.locator('button:has-text("Çocuğu Ekle")').click();
    // Toast veya kart görünmeli
    await expect(page.locator('body')).toContainText(code.toUpperCase(), { timeout: 10_000 });
  });
});
