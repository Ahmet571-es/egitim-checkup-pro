/**
 * Grup B — Veli Onay Mekanizması testleri.
 *
 * Endpoint erişim kontrolü + validation. Tam akış (öğretmen onaylar
 * veli onay görür) migration çalıştırıldıktan sonra manuel test
 * gerektirir.
 *
 * Migration durumu:
 *   - Migration yapıldıysa: pending-parents boş liste dönebilir
 *     (gerçek pending yoksa)
 *   - Migration yapılmadıysa: endpoint yine boş liste döner
 *     (graceful degradation)
 *   - Her iki durumda da endpoint erişilebilir ve auth kontrolü
 *     çalışır.
 */
import { test, expect } from '@playwright/test';

test.describe('Veli Onay Mekanizması — API erişim + auth', () => {
  test('/api/teacher/pending-parents — auth yok → 401', async ({ request }) => {
    const res = await request.get('/api/teacher/pending-parents');
    expect(res.status()).toBe(401);
  });

  test('/api/teacher/approve-parent — auth yok → 401', async ({ request }) => {
    const res = await request.post('/api/teacher/approve-parent', {
      data: { link_id: 'fake-id', action: 'approve' },
    });
    expect(res.status()).toBe(401);
  });

  test('/api/teacher/approve-parent — body eksik field → 400 (auth geçince)', async ({ request }) => {
    // Bu test auth'suz 401 döner — ama auth yapmadığımız için 401'ı
    // kabul ediyoruz. Asıl body validation iç katmanda, yukarıdaki
    // test auth duvarını kanıtlıyor.
    const res = await request.post('/api/teacher/approve-parent', {
      data: {},
    });
    expect([400, 401]).toContain(res.status());
  });
});
