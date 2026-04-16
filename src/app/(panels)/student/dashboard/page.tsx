'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { BarChart2, BookOpen, Bell, ArrowRight, Target } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ALL_TESTS } from '@/lib/tests/index';

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

// test_type normalize
const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();

interface HomeworkTest {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function Page() {
  const [homework, setHomework] = useState<HomeworkTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomework() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const meta = user.user_metadata || {};
        const assigned = ((meta.assigned_tests as string[]) || []).map(norm);

        if (assigned.length === 0) { setLoading(false); return; }

        // Tamamlanmış testleri çek
        const { data: results } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id)
          .not('completed_at', 'is', null);

        const completed = new Set((results || []).map(r => norm(r.test_type || '')));

        // Atanan ama tamamlanmamışları bul
        const pending = assigned.filter(t => !completed.has(t));

        // Test bilgilerini eşleştir
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
      } catch (err) {
        console.error('[dashboard] homework fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomework();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2">
        Öğrenci Paneli
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Testlerin, sonuçların ve gelişim grafiğin
      </p>

      {/* ÖDEV KARTI — Sadece bekleyen ödev varsa */}
      {!loading && homework.length > 0 && (
        <Link
          href="/student/my-tests"
          className="group block relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 mb-6 shadow-lg hover:shadow-xl transition-all"
        >
          {/* Dekoratif parıltılar */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl -mb-10" />

          {/* Pulse ring animasyonu */}
          <div className="absolute top-4 left-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
          </div>

          <div className="relative flex items-center gap-4 pl-6">
            <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-md">
              <Bell size={28} className="text-white" />
            </div>

            <div className="flex-1 text-white min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-[18px] font-extrabold">Öğretmeninden Ödev Var!</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-600 text-[12px] font-extrabold shadow-sm">
                  {homework.length}
                </span>
              </div>
              <p className="text-white/90 text-[13px] mb-2">
                <strong>{homework.length}</strong> test seni bekliyor. Önce bunları çözmen tavsiye edilir.
              </p>

              {/* Ödev test adları (max 3 chip) */}
              <div className="flex flex-wrap gap-1.5">
                {homework.slice(0, 3).map(hw => (
                  <span key={hw.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold">
                    <Target size={10} />
                    {hw.name}
                  </span>
                ))}
                {homework.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold">
                    +{homework.length - 3} daha
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-orange-600 text-[13px] font-extrabold shadow-md group-hover:bg-orange-50 transition-all">
              Hemen Çöz
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* Hizli erisim kartlari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/student/my-tests"
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Testlerim</p>
            <p className="text-xs text-gray-400">Testleri çöz</p>
          </div>
        </Link>

        <Link
          href="/student/profile"
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <BarChart2 size={20} className="text-sky-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Profilim</p>
            <p className="text-xs text-gray-400">Bilgilerimi gör</p>
          </div>
        </Link>
      </div>

      {/* Gelisim Grafigi */}
      <GrowthTimeline />
    </div>
  );
}
