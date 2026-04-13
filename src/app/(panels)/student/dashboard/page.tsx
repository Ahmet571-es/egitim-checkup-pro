'use client';

import dynamic from 'next/dynamic';
import { BarChart2, BookOpen, Award, Radar, Sparkles, Trophy } from 'lucide-react';
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
        Öğrenci Paneli
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Testlerin, sonuçların ve gelişim grafiğin
      </p>

      {/* Hizli erisim kartlari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
          href="/student/my-results"
          className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Award size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Sonuçlarım</p>
            <p className="text-xs text-gray-400">Tamamlanan testler</p>
          </div>
        </Link>

        <Link
          href="/student/coaching"
          className="bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-xl rounded-2xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">AI Koçluk</p>
            <p className="text-xs text-amber-500">Kişisel görevler</p>
          </div>
        </Link>

        <Link
          href="/student/achievements"
          className="bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-xl rounded-2xl border border-yellow-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">Başarılarım</p>
            <p className="text-xs text-yellow-500">Rozetler & XP</p>
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

        <Link
          href="/student/profile-360"
          className="bg-gradient-to-br from-violet-50 to-purple-50 backdrop-blur-xl rounded-2xl border border-violet-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Radar size={20} className="text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-[#0f2847] text-sm">360 Profil</p>
            <p className="text-xs text-violet-500">Bütüncül analiz</p>
          </div>
        </Link>
      </div>

      {/* Gelisim Grafigi */}
      <GrowthTimeline />
    </div>
  );
}
