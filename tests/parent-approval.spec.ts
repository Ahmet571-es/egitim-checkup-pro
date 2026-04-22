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

  test('/api/teacher/approve-parent — auth/CSRF yok → 401 veya 403', async ({ request }) => {
    const res = await request.post('/api/teacher/approve-parent', {
      data: { link_id: 'fake-id', action: 'approve' },
    });
    // CSRF middleware önce 403 döndürüyor (beklenen). Auth olsa 401.
    expect([401, 403]).toContain(res.status());
  });

  test('/api/teacher/approve-parent — boş body → 400/401/403', async ({ request }) => {
    const res = await request.post('/api/teacher/approve-parent', {
      data: {},
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});
