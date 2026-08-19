import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/health
 *
 * Platformun GERÇEK sağlık durumu. Auth gerekmez, cache'lenmez.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN VAR (18 Ağustos 2026 kesintisi):
 *   Supabase projesi ödenmemiş fatura yüzünden askıya alındı. Veritabanı
 *   haftalarca tamamen erişilemez durumdaydı ama SİTE SAĞLIKLI GÖRÜNÜYORDU:
 *   sayfalar HTTP 200 dönüyor, /api/public/teachers "200 + boş liste"
 *   veriyordu. Kimse fark etmedi; sorun ancak bir öğrenci "giriş
 *   yapamıyorum" diye haber verince ortaya çıktı.
 *
 *   Kök sebep: Supabase istemcisi ağ hatasında THROW ETMİYOR, hatayı
 *   `{ data: null, error }` içinde döndürüyor. Kod sadece `data`yı
 *   destructure edince hata sessizce yutuluyor ve boş sonuç "veri yok"
 *   gibi görünüyor.
 *
 *   Bu endpoint o boşluğu kapatır: veritabanına GERÇEK bir sorgu atar,
 *   hatayı yutmaz, bozuksa 503 döner.
 *
 * ─────────────────────────────────────────────────────────────────────
 * İKİNCİ GÖREVİ — otomatik duraklatmayı önlemek:
 *   Free plan projeleri ~7 gün düşük aktivitede duraklatılır. Bu endpoint
 *   her çağrıldığında gerçek bir DB sorgusu üretir, dolayısıyla günlük
 *   cron ping'i (.github/workflows/health-ping.yml) projeyi ayakta tutar.
 *
 * ─────────────────────────────────────────────────────────────────────
 * GÜVENLİK: Ham hata mesajı client'a DÖNMEZ (iç yapıyı ifşa etmemek için),
 *   yalnızca sunucu log'una yazılır. Dışarıya sadece up/down bilgisi çıkar.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CheckState = 'up' | 'down';

export async function GET() {
  const startedAt = Date.now();

  let database: CheckState = 'down';
  let auth: CheckState = 'down';

  // ── 1) Veritabanı: gerçek sorgu, hata YUTULMAZ ──────────────────────
  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[health] database check failed:', error.message);
    } else {
      database = 'up';
    }

    // ── 2) Auth (GoTrue): DB ayakta olsa bile auth ayrı düşebilir ─────
    // Login "Failed to fetch" hatası tam olarak buradan geliyordu.
    try {
      const { error: authError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      if (authError) {
        console.error('[health] auth check failed:', authError.message);
      } else {
        auth = 'up';
      }
    } catch (authErr) {
      console.error('[health] auth check threw:', authErr);
    }
  } catch (err) {
    // createAdminClient env eksikse fırlatır; ağ katmanı da fırlatabilir.
    console.error('[health] fatal:', err);
  }

  const ok = database === 'up' && auth === 'up';

  return NextResponse.json(
    {
      ok,
      checks: { database, auth },
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
