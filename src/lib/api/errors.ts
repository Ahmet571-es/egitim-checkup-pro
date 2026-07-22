import { NextResponse } from 'next/server';

/**
 * Sunucu/DB hatasını LOG'lar ve client'a GENERIC mesaj döner.
 *
 * Neden: Ham hata mesajı (Supabase/PostgREST detayı, kısıt adları, RLS ipuçları)
 * client'a dönerse iç yapıyı ifşa eder ve saldırgana yol gösterir. Gerçek hata
 * yalnızca sunucu log'una (Vercel) yazılır; kullanıcı nötr bir mesaj görür.
 *
 * NOT: console.error next.config removeConsole ayarında `exclude` listesindedir,
 * yani prod'da da korunur — sunucu tarafı hata izlenebilirliği bozulmaz.
 */
export function serverError(
  label: string,
  err: unknown,
  status = 500,
  clientMessage = 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.',
): NextResponse {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[${label}] ${detail}`);
  return NextResponse.json({ error: clientMessage }, { status });
}

/**
 * Ham hatayı LOG'lar, client'a verilecek GENERIC mesaj STRING'ini döner.
 * İfade konumunda kullanım için (çok satırlı NextResponse.json, {ok:false,...} vb.).
 * Örn: { error: logAndMsg('label', err, 'Kayıt silinemedi.') }
 */
export function logAndMsg(label: string, err: unknown, clientMessage: string): string {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[${label}] ${detail}`);
  return clientMessage;
}
