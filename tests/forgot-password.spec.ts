/**
 * Öğretmen şifremi unuttum self-serve akışı testleri.
 *
 * - /forgot-password/ogretmen sayfası public erişilebilir
 * - API'ler validation çalışıyor
 * - Kayıtsız email → 200 (user enumeration koruması)
 */
import { test, expect } from '@playwright/test';

test.describe('Şifremi Unuttum — Public erişim + Validation', () => {
  test('/forgot-password/ogretmen → public erişilebilir', async ({ page }) => {
    await page.goto('/forgot-password/ogretmen');
    await expect(page).toHaveURL(/\/forgot-password\/ogretmen/);
    await expect(page.locator('body')).toContainText(/şifre|unutum|sıfırla|sifre/i);
  });

  test('/api/auth/password-reset-send geçersiz email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-send', {
      data: { email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/password-reset-send kayıtsız email → 200 (user enumeration koruması)', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-send', {
      data: { email: `nonexistent-${Date.now()}@egitimcheckup.test` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('/api/auth/password-reset-verify geçersiz email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-verify', {
      data: { email: 'bad', code: '123456', new_password: 'Test1234' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/password-reset-verify eksik kod → 400', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-verify', {
      data: { email: 'test@test.com', code: '12', new_password: 'Test1234' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/password-reset-verify kısa şifre → 400', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-verify', {
      data: { email: 'test@test.com', code: '123456', new_password: 'short' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/auth/password-reset-verify sadece harf → 400 (karmaşıklık)', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-verify', {
      data: { email: 'test@test.com', code: '123456', new_password: 'abcdefgh' },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(String(data.error || '')).toMatch(/harf|rakam/i);
  });

  test('/api/auth/password-reset-verify olmayan kod → 404', async ({ request }) => {
    const res = await request.post('/api/auth/password-reset-verify', {
      data: {
        email: `nonexistent-${Date.now()}@egitimcheckup.test`,
        code: '123456',
        new_password: 'Test1234',
      },
    });
    expect([404, 400]).toContain(res.status());
  });
});
