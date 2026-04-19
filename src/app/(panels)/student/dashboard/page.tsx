'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { BookOpen, User, Bell, ArrowRight, Target, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ALL_TESTS } from '@/lib/tests/index';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';
import SectionCard from '@/components/ui/SectionCard';

const GrowthTimeline = dynamic(
  () => import('@/components/student/GrowthTimeline'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();

interface HomeworkTest {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function Page() {
  const [homework, setHomework] = useState<HomeworkTest[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount] = useState(10);
  const [firstName, setFirstName] = useState('Öğrenci');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const meta = user.user_metadata || {};
        const fullName = (meta.full_name as string) || '';
        if (fullName) setFirstName(fullName.split(' ')[0]);

        const assigned = ((meta.assigned_tests as string[]) || []).map(norm);

        // Tamamlanmış testleri çek
        const { data: results } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id)
          .not('completed_at', 'is', null);

        const completedSet = new Set((results || []).map(r => norm(r.test_type || '')));
        setCompletedCount(completedSet.size);

        // Atanan ama tamamlanmamış ödevleri bul
        if (assigned.length > 0) {
          const pending = assigned.filter(t => !completedSet.has(t));
          const homeworkList: HomeworkTest[] = [];
          for (const assignedId of pending) {
            const test = ALL_TESTS.find(t => norm(t.id) === assignedId);
            if (test) {
              homeworkList.push({
                id: test.id,
                name: test.name,
                color: test.color,
                icon: test.icon,
              });
            }
          }
          setHomework(homeworkList);
        }
      } catch (err) {
        console.error('[dashboard] data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <WelcomeBanner
        role="student"
        title={`Merhaba ${firstName}!`}
        subtitle="Kendini keşfetmek için testlerini çöz, gelişim grafiğini takip et."
        badge="Bugün ne yapalım?"
        emoji="🎓"
      />

      {/* ÖDEV KARTI — Sadece bekleyen ödev varsa */}
      {!loading && homework.length > 0 && (
        <Link
          href="/student/my-tests"
          className="group block relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 mb-6 shadow-lg shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 transition-all animate-fade-in-up"
        >
          {/* Dekoratif parıltılar */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl -mb-10" />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent hw-shimmer" />

          {/* Pulse ring animasyonu */}
          <div className="absolute top-4 left-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-slate-800 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white dark:bg-slate-800" />
            </span>
          </div>

          <div className="relative flex items-center gap-4 pl-6">
            <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-md border border-white/20">
              <Bell size={28} className="text-white" />
            </div>

            <div className="flex-1 text-white min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-[18px] font-extrabold drop-shadow-sm">Öğretmeninden Ödev Var!</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-orange-600 text-[12px] font-extrabold shadow-sm">
                  {homework.length}
                </span>
              </div>
              <p className="text-white/90 text-[13px] mb-2">
                <strong>{homework.length}</strong> test seni bekliyor. Önce bunları çözmen tavsiye edilir.
              </p>

              <div className="flex flex-wrap gap-1.5">
                {homework.slice(0, 3).map(hw => (
                  <span key={hw.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/10">
                    <Target size={10} />
                    {hw.name}
                  </span>
                ))}
                {homework.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/10">
                    +{homework.length - 3} daha
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-orange-600 text-[13px] font-extrabold shadow-md group-hover:bg-orange-50 group-hover:scale-105 transition-all">
              Hemen Çöz
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <style jsx>{`
            .hw-shimmer {
              animation: hw-shimmer 5s ease-in-out infinite;
            }
            @keyframes hw-shimmer {
              0% { transform: translateX(-200%) skewX(-12deg); }
              100% { transform: translateX(300%) skewX(-12deg); }
            }
          `}</style>
        </Link>
      )}

      {/* STAT KARTLAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <TiltStatCard
          href="/student/my-tests"
          label="Tamamlanan Test"
          value={completedCount}
          gradient="from-violet-500 to-purple-600"
          icon={BookOpen}
          delay={100}
          helperText="Testleri gör"
        />
        <TiltStatCard
          href="/student/my-tests"
          label="Kalan Test"
          value={totalCount - completedCount}
          gradient="from-fuchsia-500 to-pink-600"
          icon={Target}
          delay={180}
          helperText="Hadi başla"
        />
        <TiltStatCard
          href="/student/profile"
          label="Profilim"
          value="Görüntüle"
          gradient="from-indigo-500 to-violet-600"
          icon={User}
          delay={260}
          helperText="Bilgilerim"
          disableCountUp
        />
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Link
          href="/student/achievements"
          className="group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Trophy size={20} />
            </div>
            <div>
              <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-sm">Başarılarım</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Rozetlerimi gör</p>
            </div>
          </div>
        </Link>

        <Link
          href="/student/coaching"
          className="group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-sm">AI Koçluk</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Kişiselleştirilmiş rehber</p>
            </div>
          </div>
        </Link>

        <Link
          href="/student/profile-360"
          className="group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-sm">360° Profil</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Tüm analizler bir arada</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Gelişim Grafiği */}
      <SectionCard
        icon={TrendingUp}
        title="Gelişim Grafiği"
        subtitle="Zaman içindeki test performansını takip et"
        gradient="from-violet-500 via-purple-500 to-fuchsia-600"
        delay={400}
      >
        <GrowthTimeline />
      </SectionCard>
    </div>
  );
}
