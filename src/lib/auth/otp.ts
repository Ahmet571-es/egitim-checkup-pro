import { randomInt } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * OTP (tek kullanımlık kod) güvenlik yardımcıları.
 *
 * Şifre sıfırlama / e-posta doğrulama kodlarının ÜRETİM ve DOĞRULAMASINI
 * tek yerde toplar. Amaç: brute-force ile hesap ele geçirmeyi engellemek.
 *
 * Katmanlı savunma:
 *   1) Kriptografik güvenli kod üretimi — Math.random YASAK (tahmin edilebilir PRNG).
 *   2) Kod üretim cooldown'u — aynı e-posta için art arda kod isteme sınırı.
 *      Hem e-posta bombardımanını hem "kod yenile → brute-force" döngüsünü yavaşlatır.
 *   3) Deneme sayacı + kilitleme — `maxAttempts` yanlış denemeden sonra kod iptal.
 *
 * (3) 'attempts' kolonuna ihtiyaç duyar (migration: 20260722_otp_attempts.sql).
 * Kolon henüz yoksa kod HATA VERMEZ — sadece sayaç atlanır (graceful degrade),
 * böylece migration uygulanana kadar sıfırlama akışı çalışmaya devam eder.
 */

const CODE_MIN = 100000;
const CODE_MAX = 1000000; // randomInt üst sınırı hariç tutar → 100000..999999

/** 6 haneli, kriptografik güvenli doğrulama kodu. */
export function generateSecureCode(): string {
  return String(randomInt(CODE_MIN, CODE_MAX));
}

export interface CooldownResult {
  ok: boolean;
  /** ok=false ise: yeniden denemeden önce beklenmesi gereken saniye. */
  retryAfter?: number;
}

/**
 * Aynı e-posta için son kod `seconds` içinde üretildiyse yeni kod üretimini
 * reddeder. Yalnızca created_at kullanır — ek kolon gerekmez.
 */
export async function checkCodeCooldown(
  admin: SupabaseClient,
  email: string,
  seconds = 60,
): Promise<CooldownResult> {
  try {
    const { data } = await admin
      .from('verification_codes')
      .select('created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.created_at) {
      const elapsed =
        (Date.now() - new Date(data.created_at as string).getTime()) / 1000;
      if (elapsed < seconds) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil(seconds - elapsed)) };
      }
    }
  } catch {
    // Cooldown sorgusu başarısızsa üretimi engelleme (cooldown için fail-open).
  }
  return { ok: true };
}

export type OtpVerifyResult =
  | { ok: true; recordId: string }
  | { ok: false; status: number; error: string };

interface CodeRow {
  id: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts?: number;
}

/**
 * E-posta için en son kodu getirir. 'attempts' kolonu migration sonrası gelir;
 * yoksa attempts'siz sorguya düşer (geriye dönük uyumluluk).
 */
async function fetchLatestCode(
  admin: SupabaseClient,
  email: string,
): Promise<CodeRow | null> {
  let res = await admin
    .from('verification_codes')
    .select('id, code, expires_at, used, attempts')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (res.error) {
    // Muhtemelen 'attempts' kolonu henüz yok → attempts'siz tekrar dene.
    res = await admin
      .from('verification_codes')
      .select('id, code, expires_at, used')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  return (res.data as CodeRow) ?? null;
}

/**
 * Kodu doğrular. Yanlış denemeleri sayar; `maxAttempts`'e ulaşınca kodu iptal
 * eder (used=true). Başarılıysa kodu kullanıldı olarak işaretler.
 *
 * NOT: Tek seferde tek geçerli kod vardır (send tarafı eski kodları siler),
 * bu yüzden "en son kod" üzerinden doğrulamak güvenlidir.
 */
export async function verifyOtpCode(
  admin: SupabaseClient,
  email: string,
  code: string,
  maxAttempts = 5,
): Promise<OtpVerifyResult> {
  const record = await fetchLatestCode(admin, email);

  if (!record) {
    return { ok: false, status: 404, error: 'Kod bulunamadı. Yeni bir kod talep edin.' };
  }
  if (record.used) {
    return {
      ok: false,
      status: 400,
      error:
        'Bu kod kullanılmış veya çok fazla hatalı deneme yapıldı. Yeni bir kod talep edin.',
    };
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'Kodun süresi doldu. Yeni bir kod talep edin.' };
  }

  if (record.code !== code) {
    // Yanlış kod → deneme sayacını artır (kolon varsa) ve gerekiyorsa kilitle.
    const nextAttempts =
      (typeof record.attempts === 'number' ? record.attempts : 0) + 1;
    try {
      if (nextAttempts >= maxAttempts) {
        await admin
          .from('verification_codes')
          .update({ used: true, attempts: nextAttempts })
          .eq('id', record.id);
        return {
          ok: false,
          status: 429,
          error:
            'Çok fazla hatalı deneme. Bu kod iptal edildi, lütfen yeni bir kod talep edin.',
        };
      }
      await admin
        .from('verification_codes')
        .update({ attempts: nextAttempts })
        .eq('id', record.id);
    } catch {
      // 'attempts' kolonu yoksa sayaç güncellenemez → yalnızca hatalı-kod mesajı dön.
    }

    const remaining = Math.max(0, maxAttempts - nextAttempts);
    return {
      ok: false,
      status: 400,
      error:
        remaining > 0 ? `Kod hatalı. ${remaining} deneme hakkınız kaldı.` : 'Kod hatalı.',
    };
  }

  // Doğru kod → kullanıldı işaretle.
  await admin.from('verification_codes').update({ used: true }).eq('id', record.id);
  return { ok: true, recordId: record.id };
}
