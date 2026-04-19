'use client';

import dynamic from 'next/dynamic';
import { Trophy, Award, Medal } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

const GamificationProfile = dynamic(() => import('@/components/student/GamificationProfile'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse shadow-md">
        <Trophy className="w-5 h-5 text-white" />
      </div>
    </div>
  ),
});

const Leaderboard = dynamic(() => import('@/components/student/Leaderboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center animate-pulse shadow-md">
        <Medal className="w-4 h-4 text-white" />
      </div>
    </div>
  ),
});

export default function AchievementsPage() {
  return (
    <div>
      <PageHeader
        role="student"
        icon={Trophy}
        title="Başarılarım"
        subtitle="Rozetlerin, seviyen ve sınıf sıralaması — başarılarını kutla! 🏆"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionCard
            icon={Award}
            title="Seviye & Rozetler"
            subtitle="XP, rozetler ve ilerleme durumun"
            gradient="from-violet-500 via-purple-500 to-fuchsia-600"
          >
            <GamificationProfile />
          </SectionCard>
        </div>
        <div>
          <SectionCard
            icon={Medal}
            title="Sıralama"
            subtitle="Sınıf liderlik tablosu"
            gradient="from-amber-500 via-orange-500 to-rose-500"
            delay={100}
          >
            <Leaderboard />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
