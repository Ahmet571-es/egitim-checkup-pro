/**
 * Admin Dashboard — Premium
 * WelcomeBanner + Premium TiltStatCards + Analytics
 */
import { Building2, Users, GraduationCap, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import AdminAnalyticsSection from './AdminAnalyticsSection';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  // Graceful query helper — hata olursa 0 döner, sayfa yine render olur
  async function safeCount(
    table: 'schools' | 'profiles' | 'test_results',
    filters: Array<[string, string | boolean]> = [],
  ): Promise<number> {
    try {
      let q = supabase.from(table).select('id', { count: 'exact', head: true });
      for (const [k, v] of filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q = q.eq(k, v as any);
      }
      const { count, error } = await q;
      if (error) {
        console.error(`[admin/dashboard] ${table} sorgu hatası:`, error.message);
        return 0;
      }
      return count || 0;
    } catch (e) {
      console.error(`[admin/dashboard] ${table} exception:`, e instanceof Error ? e.message : e);
      return 0;
    }
  }

  const [schoolsCount, usersCount, teachersCount, resultsCount] = await Promise.all([
    safeCount('schools'),
    safeCount('profiles', [['is_active', true]]),
    safeCount('profiles', [['role', 'teacher'], ['is_active', true]]),
    safeCount('test_results'),
  ]);

  const firstName = (profile?.full_name || 'Yönetici').split(' ')[0];

  const stats = [
    {
      label: 'Toplam Okul',
      value: schoolsCount,
      href: '/admin/schools',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      helperText: 'Okulları yönet',
    },
    {
      label: 'Toplam Kullanıcı',
      value: usersCount,
      href: '/admin/users',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
      helperText: 'Kullanıcıları yönet',
    },
    {
      label: 'Toplam Öğretmen',
      value: teachersCount,
      href: '/admin/users',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
      helperText: 'Öğretmenleri gör',
    },
    {
      label: 'Tamamlanan Test',
      value: resultsCount,
      href: '#',
      icon: FileCheck2,
      gradient: 'from-violet-500 to-purple-600',
      helperText: 'Test istatistikleri',
    },
  ];

  return (
    <div>
      <WelcomeBanner
        role="admin"
        title={`Hoş geldiniz, ${firstName}!`}
        subtitle="Platformdaki tüm okulları, kullanıcıları ve sistem metriklerini buradan yönetebilirsiniz."
        badge="Platform Kontrolü"
        emoji="⚡"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => (
          <TiltStatCard
            key={s.label}
            href={s.href}
            label={s.label}
            value={s.value}
            gradient={s.gradient}
            icon={s.icon}
            delay={100 + idx * 80}
            helperText={s.helperText}
          />
        ))}
      </div>

      {/* Analytics */}
      <div className="mt-6">
        <AdminAnalyticsSection />
      </div>
    </div>
  );
}
