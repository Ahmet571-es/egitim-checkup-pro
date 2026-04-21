/**
 * FAZ 3A — Resend Email Güvenlik Zafiyeti Testleri
 *
 * Zafiyet: /api/auth/send-code endpoint'i email servisi fail olduğunda
 *   response'ta `fallback_code` field'ında gerçek doğrulama kodunu
 *   açık dönüyordu. İnternete açık endpoint, herkes herhangi bir email
 *   için kod alıp öğretmen kaydı yapabiliyordu.
 *
 * Fix: Email fail olursa response'ta kod ASLA dönmez. Server 503 döner,
 *   client generic hata görür, kod sadece server log'una yazılır.
 *
 * Not: Vercel altyapı seviyesinde ara sıra 503 "DNS cache overflow"
 *   dönüyor (A.2 issue). Bu testler flakiness'ı yenmek için çoklu
 *   deneme yapar — tek bir uygulama-seviyesi response bile fallback_code
 *   veya 6 haneli kod içerirse test FAIL eder.
 *
 * Eğitim Check-Up Pro — Faz 3A (Güvenlik)
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

const ENDPOINT = '/api/auth/send-code';
const ATTEMPTS = 8; // Vercel 503 flakiness'ını aşmak için çoklu deneme

interface Attempt {
  status: number;
  bodyText: string;
  body: Record<string, unknown>;
}

async function probeEndpoint(request: APIRequestContext, email: string): Promise<Attempt> {
  const res = await request.post(ENDPOINT, { data: { email } });
  const bodyText = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    // Altyapı 503'leri JSON olmayabilir ("DNS cache overflow" gibi).
  }
  return { status: res.status(), bodyText, body };
}

function isInfrastructure503(attempt: Attempt): boolean {
  return attempt.status === 503 && !attempt.bodyText.trim().startsWith('{');
}

async function collectAppResponses(
  request: APIRequestContext,
  label: string,
  attempts: number = ATTEMPTS
): Promise<Attempt[]> {
  const results: Attempt[] = [];
  for (let i = 0; i < attempts; i++) {
    const email = `${label}-${Date.now()}-${i}@egitimcheckup.test`;
    const attempt = await probeEndpoint(request, email);
    // Altyapı (DNS cache overflow) 503'lerini ayırıyoruz; sadece
    // app-seviyesi cevapları (200, 400, 503 JSON) güvenlik açısından
    // değerlendiriyoruz.
    if (!isInfrastructure503(attempt)) {
      results.push(attempt);
    }
  }
  return results;
}

test.describe('FAZ 3A — Resend email güvenlik zafiyeti', () => {
  test('Hiçbir response fallback_code field\'ı içermemeli', async ({ request }) => {
    const responses = await collectAppResponses(request, 'sec-fallback');
    expect(responses.length, 'En az 1 app-seviyesi response alınmalı').toBeGreaterThan(0);
    for (const r of responses) {
      expect(
        r.body,
        `fallback_code sızıntısı! status=${r.status} body=${r.bodyText.slice(0, 200)}`
      ).not.toHaveProperty('fallback_code');
    }
  });

  test('Hiçbir response gövdesinde 6 haneli kod görünmemeli', async ({ request }) => {
    const responses = await collectAppResponses(request, 'sec-6digit');
    expect(responses.length).toBeGreaterThan(0);
    for (const r of responses) {
      expect(
        r.bodyText,
        `Olası kod sızıntısı! status=${r.status} body=${r.bodyText.slice(0, 200)}`
      ).not.toMatch(/\b\d{6}\b/);
    }
  });

  test('Email servisi yoksa 503 + { success:false, error:string } dönmeli', async ({ request }) => {
    const responses = await collectAppResponses(request, 'sec-503-shape');
    expect(responses.length).toBeGreaterThan(0);
    for (const r of responses) {
      expect([200, 503]).toContain(r.status);
      if (r.status === 503) {
        expect(r.body).toHaveProperty('error');
        expect(r.body.success).toBe(false);
        expect(String(r.body.error ?? '')).not.toMatch(/\d{6}/);
      }
    }
  });

  test('Geçersiz email formatı → 400', async ({ request }) => {
    let lastStatus = 0;
    let lastBody: Record<string, unknown> = {};
    for (let i = 0; i < 5; i++) {
      const attempt = await probeEndpoint(request, 'invalid-no-at-sign');
      if (!isInfrastructure503(attempt)) {
        lastStatus = attempt.status;
        lastBody = attempt.body;
        break;
      }
    }
    expect(lastStatus).toBe(400);
    expect(lastBody).not.toHaveProperty('fallback_code');
  });

  test('Boş email → 400', async ({ request }) => {
    let lastStatus = 0;
    let lastBody: Record<string, unknown> = {};
    for (let i = 0; i < 5; i++) {
      const attempt = await probeEndpoint(request, '');
      if (!isInfrastructure503(attempt)) {
        lastStatus = attempt.status;
        lastBody = attempt.body;
        break;
      }
    }
    expect(lastStatus).toBe(400);
    expect(lastBody).not.toHaveProperty('fallback_code');
  });
});
