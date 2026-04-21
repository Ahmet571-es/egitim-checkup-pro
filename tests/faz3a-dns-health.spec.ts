/**
 * FAZ 3A — Vercel DNS Cache Overflow Health Check
 *
 * Sorun: /api/auth/*, /api/reports/*, /login gibi endpoint'ler arada bir
 *   503 "DNS cache overflow" dönüyor. Vercel lambda'ları Supabase admin
 *   client'ını her request'te yeniden kuruyor → Node DNS resolver
 *   cache'i doluyor.
 *
 * Fix: createAdminClient() artık module-level lazy singleton — warm
 *   lambda invocation'larında aynı client tekrar kullanılıyor.
 *
 * Test stratejisi: kritik endpoint'lere 30 istek at, altyapı-seviyesi
 *   503 sayısını ölç. Fix'ten SONRA 0 beklenir (tolerans: 1, ağ
 *   gürültüsü için).
 *
 * Eğitim Check-Up Pro — Faz 3A (Stabilite)
 */
import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';

const BURST_COUNT = 30;
const MAX_INFRA_503 = 1; // Ağ gürültüsü toleransı

interface Probe {
  status: number;
  body: string;
  isInfra503: boolean;
}

async function probe(request: APIRequestContext, method: 'GET' | 'POST', path: string, data?: unknown): Promise<Probe> {
  let res: APIResponse;
  if (method === 'GET') {
    res = await request.get(path);
  } else {
    res = await request.post(path, { data });
  }
  const body = await res.text();
  const status = res.status();
  // Altyapı 503'ü: status 503 + JSON olmayan body (örn. "DNS cache overflow").
  const isInfra503 = status === 503 && !body.trim().startsWith('{');
  return { status, body, isInfra503 };
}

async function burst(
  request: APIRequestContext,
  method: 'GET' | 'POST',
  path: string,
  dataFn?: (i: number) => unknown
): Promise<Probe[]> {
  const out: Probe[] = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    out.push(await probe(request, method, path, dataFn?.(i)));
  }
  return out;
}

function countInfra503(probes: Probe[]): number {
  return probes.filter((p) => p.isInfra503).length;
}

test.describe('FAZ 3A — DNS cache overflow health check', () => {
  test(`/login — ${BURST_COUNT} istekte altyapı 503 ≤ ${MAX_INFRA_503} olmalı`, async ({ request }) => {
    const probes = await burst(request, 'GET', '/login');
    const infra503 = countInfra503(probes);
    const summary = `infra503=${infra503}/${BURST_COUNT} statuses=${probes.map((p) => p.status).join(',')}`;
    expect(infra503, summary).toBeLessThanOrEqual(MAX_INFRA_503);
  });

  test(`/api/auth/send-code — ${BURST_COUNT} istekte altyapı 503 ≤ ${MAX_INFRA_503} olmalı`, async ({
    request,
  }) => {
    const probes = await burst(request, 'POST', '/api/auth/send-code', (i) => ({
      email: `dns-probe-${Date.now()}-${i}@egitimcheckup.test`,
    }));
    const infra503 = countInfra503(probes);
    const summary = `infra503=${infra503}/${BURST_COUNT} statuses=${probes.map((p) => p.status).join(',')}`;
    expect(infra503, summary).toBeLessThanOrEqual(MAX_INFRA_503);
  });

  test(`/ (ana sayfa) — ${BURST_COUNT} istekte altyapı 503 ≤ ${MAX_INFRA_503} olmalı`, async ({
    request,
  }) => {
    const probes = await burst(request, 'GET', '/');
    const infra503 = countInfra503(probes);
    const summary = `infra503=${infra503}/${BURST_COUNT} statuses=${probes.map((p) => p.status).join(',')}`;
    expect(infra503, summary).toBeLessThanOrEqual(MAX_INFRA_503);
  });
});
