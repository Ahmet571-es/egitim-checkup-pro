/**
 * Ogretmen Dashboard — Faz C: hos geldin + 3 stat kart (RLS isolated)
 * Faz 1: Ogrenci Gelisim Takibi eklendi
 */
import Link from 'next/link';
import { Users, FileCheck2 } from 'lucide-react';
import { getCurrentProfile } from '@/lib/actions/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import StudentTrendSection from './StudentTrendSection';
import RiskDashboardSection from './RiskDashboardSection';
import ClassComparisonSection from './ClassComparisonSection';
import TeacherParentNotesSection from './TeacherParentNotesSection';
import CoachingTrackingSection from './CoachingTrackingSection';
import AIQuerySection from './AIQuerySection';
import ClassStrategySection from './ClassStrategySection';


export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const firstName = (profile?.full_name || '').split(' ')[0] || 'Öğretmenim';

  let studentCount = 0;
  let resultCount = 0;

  // Öğrencilerim sayfasıyla tutarlı sayım: tüm role=student profilleri
  // ve tüm tamamlanmış test_results
  try {
    const admin = createAdminClient();

    const { count: sc } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');
    studentCount = sc || 0;

    const { count: rc } = await admin
      .from('test_results')
      .select('id', { count: 'exact', head: true })
      .not('completed_at', 'is', null);
    resultCount = rc || 0;
  } catch (e) {
    console.error('[teacher dashboard count]', e);
  }

  const stats = [
    {
      label: 'Öğrencilerim',
      value: studentCount,
      href: '/teacher/students',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
    },
    {
      label: 'Tamamlanan Test',
      value: resultCount,
      href: '/teacher/results',
      icon: FileCheck2,
      gradient: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div>
      <div className="mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/20">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
          Hoş geldiniz, {firstName}!
        </h1>
        <p className="text-emerald-50 text-sm">
          Tüm okullardaki öğrencileri Öğrencilerim sayfasından yönetebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Risk Altındaki Öğrenciler (FAZ 2) */}
      <div className="mt-6">
        <RiskDashboardSection />
      </div>

      {/* FAZ 3: Sınıf Karşılaştırma */}
      <div className="mt-6">
        <ClassComparisonSection />
      </div>

      {/* FAZ 4: Veli Notları */}
      <div className="mt-6">
        <TeacherParentNotesSection />
      </div>

      {/* FAZ 5: Koçluk Takip */}
      <div className="mt-6">
        <CoachingTrackingSection />
      </div>

      {/* FAZ 8: AI Asistan */}
      <div className="mt-6">
        <AIQuerySection />
      </div>

      {/* FAZ 8: Sınıf Strateji Önerisi */}
      <div className="mt-6">
        <ClassStrategySection />
      </div>

      {/* Ogrenci Gelisim Takibi */}
      <div className="mt-6">
        <StudentTrendSection />
      </div>
    </div>
  );
}
