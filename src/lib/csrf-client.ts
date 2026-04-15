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

/** Fetch wrapper — otomatik CSRF header ekler */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCSRFTokenFromCookie();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
  return fetch(url, { ...options, headers });
}
