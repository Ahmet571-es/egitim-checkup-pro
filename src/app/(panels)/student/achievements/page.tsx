'use client';

import dynamic from 'next/dynamic';

const GamificationProfile = dynamic(() => import('@/components/student/GamificationProfile'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const Leaderboard = dynamic(() => import('@/components/student/Leaderboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function AchievementsPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2">Başarılarım</h1>
      <p className="text-gray-500 text-sm mb-6">
        Rozetlerin, seviyen ve sınıf sıralaması
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GamificationProfile />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
