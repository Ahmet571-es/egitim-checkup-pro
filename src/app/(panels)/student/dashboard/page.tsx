'use client';

import dynamic from 'next/dynamic';
import { BarChart2, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';

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

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2">
        Ogrenci Paneli
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Testlerin, sonuclarin ve gelisim grafigin
      </p>

      {/* Hizli erisim kartlari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          href="/student/my-tests"
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Testlerim</p>
            <p className="text-xs text-gray-400">Testleri coz</p>
          </div>
        </Link>

        <Link
          href="/student/my-results"
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Award size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Sonuclarim</p>
            <p className="text-xs text-gray-400">Tamamlanan testler</p>
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
            <p className="text-xs text-gray-400">Bilgilerimi gor</p>
          </div>
        </Link>
      </div>

      {/* Gelisim Grafigi */}
      <GrowthTimeline />
    </div>
  );
}
