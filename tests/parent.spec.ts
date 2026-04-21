/**
 * Veli Paneli E2E Testleri
 *
 * FAZ 3B: /parent/* route'ları ve /register/veli inşa edildi.
 *   - Access control testleri aktif (tüm /parent/* login redirect etmeli)
 *   - /register/veli public — oturum gerektirmemeli
 *
 * Authenticated smoke test'ler (gerçek veli hesabı ile çocuk ekleme, rapor
 * indirme vb.) ayrı bir file'da, manuel credential ile çalıştırılır.
 *
 * Eğitim Check-Up Pro — Faz 3B (Veli Paneli)
 */
import { test, expect } from '@playwright/test';

test.describe('Veli Paneli — Erişim Kontrolleri (Anonim)', () => {
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

  test('my-children auto_code param ile bile → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/my-children?auto_code=ABC123');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Veli Kayıt — Public Erişim', () => {
  test('/register/veli açılıyor (login redirect yok)', async ({ page }) => {
    const res = await page.goto('/register/veli');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/register\/veli/);
    // Sayfa içeriği yüklendi mi? "Veli" kelimesi başlıkta veya formda olmalı
    await expect(page.locator('body')).toContainText(/veli/i);
  });

  test('/register/veli formu alanları içeriyor', async ({ page }) => {
    await page.goto('/register/veli');
    // Input sayısı en az 5 olmalı (ad, soyad, email, şifre, kod)
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(5);
  });
});

test.describe('Veli API — Yetkisiz Erişim', () => {
  test('/api/parent/link-child anonim → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/parent/link-child', {
      data: { student_code: 'ABC123' },
    });
    // CSRF koruması 403 de dönebilir. Her ikisi de "yetkisiz" anlamında geçerli.
    expect([401, 403]).toContain(res.status());
  });

  test('/api/parent/link-child geçersiz kod formatı → 400/401/403', async ({ request }) => {
    const res = await request.post('/api/parent/link-child', {
      data: { student_code: 'xyz' },
    });
    // Auth'suz: 401/403. Auth'lu olsaydı 400 beklerdik.
    expect([400, 401, 403]).toContain(res.status());
  });
});
