/**
 * Admin Dashboard — Premium
 * WelcomeBanner + Premium TiltStatCards + Analytics
 *
 * Top-level try/catch ile graceful degradation: hiçbir koşulda 500 dönmez.
 */
import { Building2, Users, GraduationCap, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import AdminAnalyticsSection from './AdminAnalyticsSection';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';

export const dynamic = 'force-dynamic';

interface DashboardData {
  firstName: string;
  schoolsCount: number;
  usersCount: number;
  teachersCount: number;
  resultsCount: number;
  errorMessage: string | null;
}

async function loadDashboardData(): Promise<DashboardData> {
  const result: DashboardData = {
    firstName: 'Yönetici',
    schoolsCount: 0,
    usersCount: 0,
    teachersCount: 0,
    resultsCount: 0,
    errorMessage: null,
  };

  try {
    const profile = await getCurrentProfile();
    if (profile?.full_name) {
      result.firstName = profile.full_name.split(' ')[0];
    }
  } catch (e) {
    console.error('[admin/dashboard] getCurrentProfile:', e instanceof Error ? e.message : e);
  }

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error('[admin/dashboard] createClient:', e instanceof Error ? e.message : e);
    result.errorMessage = 'Veritabanı bağlantısı kurulamadı.';
    return result;
  }

  async function safeCount(
    table: 'schools' | 'profiles' | 'test_results',
    filters: Array<[string, string | boolean]> = [],
  ): Promise<number> {
    if (!supabase) return 0;
    try {
      let q = supabase.from(table).select('id', { count: 'exact', head: true });
      for (const [k, v] of filters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        q = q.eq(k, v as any);
      }
      const { count, error } = await q;
      if (error) {
        console.error(`[admin/dashboard] ${table}:`, error.message);
        return 0;
      }
      return count || 0;
    } catch (e) {
      console.error(`[admin/dashboard] ${table} exception:`, e instanceof Error ? e.message : e);
      return 0;
    }
  }

  const counts = await Promise.all([
    safeCount('schools'),
    safeCount('profiles', [['is_active', true]]),
    safeCount('profiles', [['role', 'teacher'], ['is_active', true]]),
    safeCount('test_results'),
  ]);
  result.schoolsCount = counts[0];
  result.usersCount = counts[1];
  result.teachersCount = counts[2];
  result.resultsCount = counts[3];
  return result;
}

export default async function Page() {
  let data: DashboardData;
  try {
    data = await loadDashboardData();
  } catch (e) {
    console.error('[admin/dashboard] FATAL:', e instanceof Error ? e.message : e);
    data = {
      firstName: 'Yönetici',
      schoolsCount: 0,
      usersCount: 0,
      teachersCount: 0,
      resultsCount: 0,
      errorMessage: 'Veriler yüklenirken beklenmeyen bir hata oluştu.',
    };
  }

  const stats = [
    {
      label: 'Toplam Okul',
      value: data.schoolsCount,
      href: '/admin/schools',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      helperText: 'Okulları yönet',
    },
    {
      label: 'Toplam Kullanıcı',
      value: data.usersCount,
      href: '/admin/users',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
      helperText: 'Kullanıcıları yönet',
    },
    {
      label: 'Toplam Öğretmen',
      value: data.teachersCount,
      href: '/admin/users',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
      helperText: 'Öğretmenleri gör',
    },
    {
      label: 'Tamamlanan Test',
      value: data.resultsCount,
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
        title={`Hoş geldiniz, ${data.firstName}!`}
        subtitle="Platformdaki tüm okulları, kullanıcıları ve sistem metriklerini buradan yönetebilirsiniz."
        badge="Platform Kontrolü"
        emoji="⚡"
      />

      {data.errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          ⚠ {data.errorMessage} — istatistikler kısmen veya tamamen 0 görünebilir.
        </div>
      )}

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

      <div className="mt-6">
        <AdminAnalyticsSection />
      </div>
    </div>
  );
}
