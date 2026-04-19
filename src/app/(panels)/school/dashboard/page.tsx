/**
 * Okul Dashboard — Premium
 * WelcomeBanner + License Banner + Premium Stats + Analytics
 */
import { BookOpen, Users, GraduationCap, Heart } from 'lucide-react';
import { getCurrentProfile } from '@/lib/actions/auth';
import { checkLicense } from '@/lib/license/check';
import LicenseBanner from '@/components/LicenseBanner';
import { createClient } from '@/lib/supabase/server';
import AnalyticsSection from './AnalyticsSection';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const state = await checkLicense(profile?.school_id || null);

  // Özet sayıları
  let classCount = 0;
  let teacherCount = 0;
  let parentCount = 0;
  if (profile?.school_id) {
    const supabase = await createClient();
    const [c, t, p] = await Promise.all([
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', profile.school_id),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', profile.school_id)
        .eq('role', 'parent')
        .eq('is_active', true),
    ]);
    classCount = c.count || 0;
    teacherCount = t.count || 0;
    parentCount = p.count || 0;
  }

  const firstName = (profile?.full_name || 'Yönetici').split(' ')[0];
  const schoolName = state.school?.name || 'Okulunuz';

  const stats = [
    {
      label: 'Sınıflar',
      value: classCount,
      href: '/school/classes',
      icon: BookOpen,
      gradient: 'from-sky-500 to-blue-600',
      helperText: 'Sınıfları yönet',
    },
    {
      label: 'Öğretmenler',
      value: teacherCount,
      href: '/school/teachers',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
      helperText: 'Öğretmen paneli',
    },
    {
      label: 'Öğrenciler',
      value: `${state.studentCount}/${state.maxStudents}`,
      href: '/school/students',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      helperText: 'Öğrencileri gör',
      disableCountUp: true,
    },
    {
      label: 'Veliler',
      value: parentCount,
      href: '/school/parents',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
      helperText: 'Veli hesapları',
    },
  ];

  return (
    <div>
      <WelcomeBanner
        role="school_admin"
        title={`Hoş geldiniz, ${firstName}!`}
        subtitle={`${schoolName} — okulunuzun tüm verilerini, sınıflarını ve kullanıcılarını buradan yönetebilirsiniz.`}
        badge="Okul Yönetimi"
        emoji="🏫"
      />

      <LicenseBanner
        status={state.status}
        daysLeft={state.daysLeft}
        studentCount={state.studentCount}
        maxStudents={state.maxStudents}
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
            disableCountUp={s.disableCountUp}
          />
        ))}
      </div>

      {/* Analytics */}
      <div className="mt-6">
        <AnalyticsSection />
      </div>
    </div>
  );
}
