/**
 * Migration Doğrulama — parent_students.approved_at + approved_by
 *
 * Migration'ın (supabase/migration_parent_approval.sql) çalıştırılıp
 * çalıştırılmadığını Supabase REST API üzerinden kesin olarak doğrular.
 *
 * Strateji:
 *   - Supabase REST API'de olmayan bir kolon sorgulandığında
 *     "column does not exist" (code 42703) hatası döner.
 *   - Var olan kolon sorgulandığında RLS'ye takılsa bile sorgu başarılı
 *     sayılır — [] veya filtrelenmiş veri döner.
 *
 * Bu test migration'ın schema düzeyinde çalıştığının doğrudan kanıtıdır.
 *
 * Bağımlılık: Supabase anon key (public — HTML bundle'da zaten var).
 */
import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://orvrjtcxowdrcdrctgqc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydnJqdGN4b3dkcmNkcmN0Z3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDE5OTksImV4cCI6MjA5MTQxNzk5OX0.AFHaKOolfiugSWtaMGx4Tai8sH2wP-UF4PqAsovb0Ak';

async function queryColumn(
  request: import('@playwright/test').APIRequestContext,
  column: string,
) {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/parent_students?select=${column}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    },
  );
  return { status: res.status(), body: await res.text() };
}

test.describe('Migration Doğrulama — parent_students onay kolonları', () => {
  test('Kontrol: olmayan kolon → 42703 (column does not exist)', async ({ request }) => {
    const { status, body } = await queryColumn(request, 'bu_kolon_kesin_yok');
    // Hata 400 veya 404 olarak döner, PostgREST mesajı 42703 kodu içerir
    expect([400, 404]).toContain(status);
    expect(body).toContain('42703');
    expect(body).toContain('does not exist');
  });

  test('approved_at kolonu var (Grup B migration çalışmış)', async ({ request }) => {
    const { status, body } = await queryColumn(request, 'approved_at');
    expect(status).toBe(200);
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test('approved_by kolonu var (Grup B migration çalışmış)', async ({ request }) => {
    const { status, body } = await queryColumn(request, 'approved_by');
    expect(status).toBe(200);
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test('Tam schema uyumu: id, parent_id, student_id, approved_at, approved_by, created_at', async ({ request }) => {
    const { status, body } = await queryColumn(
      request,
      'id,parent_id,student_id,approved_at,approved_by,created_at',
    );
    expect(status).toBe(200);
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed)).toBe(true);
  });
});
