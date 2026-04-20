/**
 * Client-side CSRF helper — 'use client' bileşenlerinde kullanılır.
 * Server-side importları yok, tarayıcıda çalışır.
 */

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/** Cookie'den CSRF token oku */
function getCSRFTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  return match?.[1] || '';
}

/** CSRF token'ı server'dan yenile (cookie expired olduysa) */
async function refreshCSRFToken(): Promise<string> {
  try {
    // Herhangi bir API GET isteği → proxy yeni cookie set edecek
    await fetch('/api/csrf/refresh', { method: 'GET', credentials: 'same-origin' });
  } catch { /* ignore */ }
  return getCSRFTokenFromCookie();
}

/** Fetch wrapper — otomatik CSRF header ekler; 403 CSRF durumunda 1 kez retry yapar */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getCSRFTokenFromCookie();

  // Cookie yoksa önce yenile
  if (!token) {
    token = await refreshCSRFToken();
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
  const res = await fetch(url, { ...options, headers, credentials: 'same-origin' });

  // 403 CSRF hatası → bir kez otomatik yenile ve tekrar dene
  if (res.status === 403) {
    try {
      const clone = res.clone();
      const body = await clone.json().catch(() => ({}));
      if (body?.code === 'CSRF_TOKEN_INVALID') {
        const newToken = await refreshCSRFToken();
        if (newToken && newToken !== token) {
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set(CSRF_HEADER, newToken);
          return fetch(url, { ...options, headers: retryHeaders, credentials: 'same-origin' });
        }
      }
    } catch { /* düzgün JSON parse edilemedi, orijinal response'u dön */ }
  }

  return res;
}
