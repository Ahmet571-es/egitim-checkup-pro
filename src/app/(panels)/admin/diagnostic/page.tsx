/**
 * Dummy diagnostic page — sadece createClient çağırır,
 * hata olursa hata mesajını ekrana yazar (production'da bile).
 *
 * /admin/_diag route'u — Mehmet'in 500 sebebini görebilmesi için.
 */
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DiagPage() {
  const diagnostics: Record<string, string> = {};

  // Step 1: createClient
  try {
    const supabase = await createClient();
    diagnostics.createClient = 'OK';

    // Step 2: auth.getUser
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        diagnostics.auth_getUser = `ERROR: ${error.message}`;
      } else {
        diagnostics.auth_getUser = data.user ? `OK (user: ${data.user.email})` : 'OK (no user)';
      }
    } catch (e) {
      diagnostics.auth_getUser = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Step 3: schools count
    try {
      const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
      diagnostics.schools_count = error ? `ERROR: ${error.message}` : `OK (count=${count})`;
    } catch (e) {
      diagnostics.schools_count = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Step 4: profiles count
    try {
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      diagnostics.profiles_count = error ? `ERROR: ${error.message}` : `OK (count=${count})`;
    } catch (e) {
      diagnostics.profiles_count = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Step 5: test_results count
    try {
      const { count, error } = await supabase.from('test_results').select('id', { count: 'exact', head: true });
      diagnostics.test_results_count = error ? `ERROR: ${error.message}` : `OK (count=${count})`;
    } catch (e) {
      diagnostics.test_results_count = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Step 6: holistic_reports count (Faz 9 yeni kolonlu sorgu)
    try {
      const { count, error } = await supabase.from('holistic_reports').select('id, audience, package_type', { count: 'exact', head: true });
      diagnostics.holistic_reports_with_audience = error ? `ERROR: ${error.message}` : `OK (count=${count})`;
    } catch (e) {
      diagnostics.holistic_reports_with_audience = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }
  } catch (e) {
    diagnostics.createClient = `FATAL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // ENV kontrolleri
  diagnostics.has_supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'YES' : 'NO';
  diagnostics.has_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES' : 'NO';
  diagnostics.has_service_role = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO';
  diagnostics.url_starts = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 30);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
      <h1 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        🔍 Admin Dashboard Diagnostic
      </h1>
      <p style={{ marginBottom: 12, color: '#6b7280' }}>
        Bu sayfa /admin/dashboard 500 hatasının sebebini bulmak için. Test sonrası silinecek.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Object.entries(diagnostics).map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 8, fontWeight: 'bold', width: 250 }}>{k}</td>
              <td style={{
                padding: 8,
                color: v.startsWith('OK') || v === 'YES' ? '#059669' :
                       v.startsWith('NO') ? '#d97706' : '#dc2626',
              }}>
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
