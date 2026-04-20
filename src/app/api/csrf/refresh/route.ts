/**
 * GET /api/csrf/refresh
 * CSRF cookie'sini yeniler — proxy middleware cookie yoksa otomatik set eder.
 * Bu endpoint'in kendisi bir şey yapmaz; sadece proxy'nin cookie set etmesi için
 * bir hedef sağlar. Client tarafında secureFetch cookie yokken burayı çağırır.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true });
}
