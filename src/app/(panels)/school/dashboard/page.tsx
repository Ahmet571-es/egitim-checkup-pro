/**
 * Okul Dashboard — Faz 5: Lisans durumu + hızlı özet
 */
import Link from 'next/link';
import { BookOpen, Users, GraduationCap, Heart } from 'lucide-react';
import { getCurrentProfile } from '@/lib/actions/auth';
import { checkLicense } from '@/lib/license/check';
import LicenseBanner from '@/components/LicenseBanner';
import { createClient } from '@/lib/supabase/server';
import AnalyticsSection from './AnalyticsSection';

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

  const stats = [
    {
      label: 'Sınıflar',
      value: classCount,
      href: '/school/classes',
      icon: BookOpen,
      gradient: 'from-sky-500 to-blue-600',
    },
    {
      label: 'Öğretmenler',
      value: teacherCount,
      href: '/school/teachers',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Öğrenciler',
      value: `${state.studentCount}/${state.maxStudents}`,
      href: '/school/students',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Veliler',
      value: parentCount,
      href: '/school/parents',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Okul Dashboard</h1>
      <p className="text-gray-500 text-sm mb-5">
        {state.school?.name || 'Okulunuz'} — genel bakış
      </p>

      <LicenseBanner
        status={state.status}
        daysLeft={state.daysLeft}
        studentCount={state.studentCount}
        maxStudents={state.maxStudents}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-lg mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{s.value}</p>
            </Link>
          );
        })}
      </div>

      {/* FAZ 3: Okul Analitik Dashboard */}
      <div className="mt-6">
        <AnalyticsSection />
      </div>
    </div>
  );
}
