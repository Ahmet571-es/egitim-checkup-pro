/**
 * Admin Dashboard — DİAGNOSTİK ADIM 1: TiltStatCard ekle
 */
import { Building2, Users, GraduationCap, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import TiltStatCard from '@/components/ui/TiltStatCard';

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
          { label: 'Okul', value: stats.schools, icon: Building2, gradient: 'from-amber-500 to-orange-600' },
          { label: 'Kullanıcı', value: stats.users, icon: Users, gradient: 'from-sky-500 to-blue-600' },
          { label: 'Öğretmen', value: stats.teachers, icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Test Sonucu', value: stats.results, icon: FileCheck2, gradient: 'from-violet-500 to-purple-600' },
        ].map((s, idx) => (
          <TiltStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            gradient={s.gradient}
            delay={100 + idx * 80}
          />
        ))}
      </div>
    </div>
  );
}
