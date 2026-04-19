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

  const [schoolsRes, usersRes, teachersRes, resultsRes] = await Promise.all([
    supabase.from('schools').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher')
      .eq('is_active', true),
    supabase.from('test_results').select('id', { count: 'exact', head: true }),
  ]);

  const firstName = (profile?.full_name || 'Yönetici').split(' ')[0];

  const stats = [
    {
      label: 'Toplam Okul',
      value: schoolsRes.count || 0,
      href: '/admin/schools',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      helperText: 'Okulları yönet',
    },
    {
      label: 'Toplam Kullanıcı',
      value: usersRes.count || 0,
      href: '/admin/users',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
      helperText: 'Kullanıcıları yönet',
    },
    {
      label: 'Toplam Öğretmen',
      value: teachersRes.count || 0,
      href: '/admin/users',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
      helperText: 'Öğretmenleri gör',
    },
    {
      label: 'Tamamlanan Test',
      value: resultsRes.count || 0,
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
