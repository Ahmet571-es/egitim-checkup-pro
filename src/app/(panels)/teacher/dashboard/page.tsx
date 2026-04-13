/**
 * Ogretmen Dashboard — Faz C: hos geldin + 3 stat kart (RLS isolated)
 * Faz 1: Ogrenci Gelisim Takibi eklendi
 */
import Link from 'next/link';
import { BookOpen, Users, FileCheck2 } from 'lucide-react';
import { getCurrentProfile } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
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

  let classCount = 0;
  let studentCount = 0;
  let resultCount = 0;

  if (profile?.id) {
    const supabase = await createClient();

    // RLS: teacher_id = auth.uid()
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', profile.id);

    const classIds = (classes || []).map((c) => c.id);
    classCount = classIds.length;

    if (classIds.length > 0) {
      // Öğrenci sayısı
      const { count: sc } = await supabase
        .from('class_students')
        .select('id', { count: 'exact', head: true })
        .in('class_id', classIds);
      studentCount = sc || 0;

      // Tamamlanan test sayısı (RLS otomatik kısıtlar)
      const { count: rc } = await supabase
        .from('test_results')
        .select('id', { count: 'exact', head: true });
      resultCount = rc || 0;
    }
  }

  const stats = [
    {
      label: 'Sınıflarım',
      value: classCount,
      href: '/teacher/classes',
      icon: BookOpen,
      gradient: 'from-emerald-500 to-teal-600',
    },
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
          Sadece kendi sınıflarınızı ve öğrencilerinizi görüyorsunuz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
