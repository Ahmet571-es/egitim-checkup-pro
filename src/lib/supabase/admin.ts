/**
 * Supabase Admin (Service Role) — RLS bypass.
 * SADECE server-side route handlers'da kullanılmalı.
 * SUPABASE_SERVICE_ROLE_KEY env'i Vercel'de tanımlı olmalı.
 *
 * A.2 FIX (DNS cache overflow):
 *   Önceden her `createAdminClient()` çağrısı yeni bir Supabase client
 *   üretiyordu. Vercel serverless lambda'ları warm instance'larda her
 *   request'te yeni fetch/DNS path açtığından Node DNS resolver cache'i
 *   doluyor ve 503 "DNS cache overflow" hataları ortaya çıkıyordu.
 *   Çözüm: module-level lazy singleton — cold start'ta 1 kez kurulur,
 *   warm invocation'larda tekrar kullanılır.
 *
 *   NOT: server.ts (createServerClient) için aynı pattern uygulanamaz.
 *   Oradaki client cookie-binding'e bağlı ve per-request olmak zorunda,
 *   yoksa kullanıcı oturumları karışır.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Module-level cache: warm lambda'larda paylaşılır, cold start'ta null.
let _adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (_adminClient) {
    return _adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.',
    );
  }

  _adminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

/**
 * Test/dev hook: module state'i sıfırlar. Production kodunda çağırılmamalı.
 */
export function __resetAdminClientForTests(): void {
  _adminClient = null;
}
