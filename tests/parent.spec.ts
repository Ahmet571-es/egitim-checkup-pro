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

  test('Mesajlar sayfası → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/messages');
    await page.waitForURL('**/login**', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('Mesajlar sayfası child parametre ile → giriş gerektirmeli', async ({ page }) => {
    await page.goto('/parent/messages?child=00000000-0000-0000-0000-000000000001');
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
    expect([401, 403]).toContain(res.status());
  });

  test('/api/parent/link-child geçersiz kod formatı → 400/401/403', async ({ request }) => {
    const res = await request.post('/api/parent/link-child', {
      data: { student_code: 'xyz' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('/api/export/holistic/pdf anonim → 401', async ({ request }) => {
    const res = await request.get('/api/export/holistic/pdf?id=00000000-0000-0000-0000-000000000000&audience=ebeveyn');
    expect([401, 403]).toContain(res.status());
  });

  test('/api/export/pdf anonim → 401', async ({ request }) => {
    const res = await request.get('/api/export/pdf?test_result_id=00000000-0000-0000-0000-000000000000&audience=ebeveyn');
    expect([401, 403]).toContain(res.status());
  });

  test('/api/parent/send-note anonim → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/parent/send-note', {
      data: { student_id: '00000000-0000-0000-0000-000000000000', note: 'test' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('/api/parent/notes anonim → 401 veya 403', async ({ request }) => {
    const res = await request.get('/api/parent/notes?student_id=00000000-0000-0000-0000-000000000000');
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Rapor API — Veli Yetki Koruması (Anonim)', () => {
  // Bu testler anonim olarak çalışır; auth eksikse 401/403 beklenir.
  // Auth'lu veli testleri parent-authed.spec.ts'e gider.

  test('/api/reports/generate anonim → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/reports/generate', {
      data: { student_id: '00000000-0000-0000-0000-000000000000', report_type: 'holistic' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('/api/reports/holistic (list) anonim → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/reports/holistic', {
      data: { studentId: '00000000-0000-0000-0000-000000000000' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('/api/reports/holistic/[id] DELETE anonim → 401 veya 403', async ({ request }) => {
    const res = await request.delete('/api/reports/holistic/00000000-0000-0000-0000-000000000000');
    expect([401, 403]).toContain(res.status());
  });

  test('/api/reports/integrated POST anonim → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/reports/integrated', {
      data: { student_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('/api/reports/integrated PUT anonim → 401 veya 403', async ({ request }) => {
    const res = await request.put('/api/reports/integrated', {
      data: { student_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect([401, 403]).toContain(res.status());
  });
});
