/**
 * Basit in-memory rate limiter.
 * Aynı kullanıcıdan belirli süre içinde belirli sayıdan fazla istek kabul etmez.
 *
 * NOT: Serverless ortamda her instance kendi Map'ini tutar.
 * Vercel'de genellikle tek instance aktif olduğundan yeterlidir.
 * Tam koruma için Redis tabanlı çözüm önerilir.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Eski kayıtları periyodik temizle (memory leak önleme)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 dakika
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Rate limit kontrolü yapar.
 * @param key - Benzersiz anahtar (genellikle userId veya userId+endpoint)
 * @param maxRequests - Pencere içinde izin verilen max istek sayısı
 * @param windowMs - Zaman penceresi (ms), varsayılan 60 saniye
 * @returns { allowed: boolean, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 3,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterMs: number } {
  cleanup(windowMs);

  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Pencere dışındaki eski timestamp'leri temizle
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    // En eski isteğin süresi dolana kadar beklemesi gereken süre
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  // İstek izinli — timestamp ekle
  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}
