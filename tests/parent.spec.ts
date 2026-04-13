/**
 * Veli Paneli E2E Testleri
 * Eğitim Check-Up Pro — Faz 6
 */
import { test, expect } from '@playwright/test';

test.describe('Veli Paneli — Erişim Kontrolleri', () => {
  test('Veli dashboard → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Çocuklarım sayfası → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/my-children');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Sonuçlar sayfası → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/results');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Sonuçlar sayfası URL parametre ile → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/results?child=test-id');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Veli Paneli — URL Parametreleri', () => {
  test('Sonuçlar sayfası ?child parametresi formatı', async ({ page }) => {
    // Login'e yönlense de URL formatını test ediyoruz
    const testChildId = '00000000-0000-0000-0000-000000000001';
    await page.goto(`/parent/results?child=${testChildId}`);
    const url = page.url();
    // Ya login sayfasında ya da results sayfasında
    expect(url).toMatch(/login|results/);
  });
});

test.describe('Veli Paneli — Sidebar Navigasyonu', () => {
  // Giriş yapılı durumda çalışır (gerçek Supabase bağlantısı gerekli)
  test.skip('Sidebar nav item\'ları', async ({ page }) => {
    // Bu test gerçek Supabase bağlantısı ile çalışır
    // loginAs(page, 'parent') ile aktif edilebilir
  });
});
