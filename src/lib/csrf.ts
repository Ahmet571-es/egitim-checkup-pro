/**
 * CSRF Token Koruması
 * Double Submit Cookie pattern — token cookie'de ve header'da eşleşmeli
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/** Rastgele CSRF token oluştur */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

/** Cookie'den CSRF token oku, yoksa oluştur */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE);
  if (existing?.value) return existing.value;

  const token = generateToken();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // Client JS okuyabilmeli (header'a eklemek için)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 86400, // 24 saat
  });
  return token;
}

/** API route'larında CSRF doğrulama */
export function validateCSRF(request: NextRequest): { valid: boolean; error?: string } {
  // GET, HEAD, OPTIONS muaf
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // API v1 (public API) muaf — kendi auth mekanizması var
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    return { valid: true };
  }

  // Payment callback muaf — dış servis çağırıyor
  if (request.nextUrl.pathname.startsWith('/api/payment/callback')) {
    return { valid: true };
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return { valid: false, error: 'CSRF token eksik' };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, error: 'CSRF token eşleşmiyor' };
  }

  return { valid: true };
}

/** Client-side: Cookie'den CSRF token oku */
export function getCSRFTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  return match?.[1] || '';
}

/** Client-side: Fetch wrapper — otomatik CSRF header ekler */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCSRFTokenFromCookie();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set(CSRF_HEADER, token);
  }
  return fetch(url, { ...options, headers });
}
