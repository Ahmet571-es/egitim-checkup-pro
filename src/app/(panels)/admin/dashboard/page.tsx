/**
 * Admin Dashboard — DİAGNOSTİK MOD (minimal)
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let firstName = 'Yönetici';
  let stats = { schools: 0, users: 0, teachers: 0, results: 0 };
  let errMsg = '';

  try {
    const profile = await getCurrentProfile();
    if (profile?.full_name) firstName = profile.full_name.split(' ')[0];
  } catch (e) {
    errMsg += `getCurrentProfile: ${e instanceof Error ? e.message : e}\n`;
  }

  try {
    const supabase = await createClient();
    const [s, u, t, r] = await Promise.all([
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
      supabase.from('test_results').select('id', { count: 'exact', head: true }),
    ]);
    stats = {
      schools: s.count || 0,
      users: u.count || 0,
      teachers: t.count || 0,
      results: r.count || 0,
    };
  } catch (e) {
    errMsg += `sorgu: ${e instanceof Error ? e.message : e}\n`;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Hoş geldiniz, {firstName}!
      </h1>
      {errMsg && (
        <pre style={{ background: '#fee', padding: 12, marginBottom: 16, fontSize: 12 }}>
          {errMsg}
        </pre>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Okul', value: stats.schools },
          { label: 'Kullanıcı', value: stats.users },
          { label: 'Öğretmen', value: stats.teachers },
          { label: 'Test Sonucu', value: stats.results },
        ].map((s) => (
          <div key={s.label} style={{
            padding: 16, borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f2847', marginTop: 4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
