'use client';

import dynamic from 'next/dynamic';
import { Sparkles, Target, MessageCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

const CoachingDashboard = dynamic(() => import('@/components/student/CoachingDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse shadow-md">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
    </div>
  ),
});

const AICoach = dynamic(() => import('@/components/student/AICoach'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center animate-pulse shadow-md">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
    </div>
  ),
});

export default function CoachingPage() {
  return (
    <div>
      <PageHeader
        role="student"
        icon={Sparkles}
        title="AI Koçluk"
        subtitle="Kişiselleştirilmiş görevlerin ve AI koçunla sohbet — kendini geliştir"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          icon={Target}
          title="Görevlerim"
          subtitle="Kişisel gelişim görevlerin"
          gradient="from-violet-500 via-purple-500 to-fuchsia-600"
        >
          <CoachingDashboard />
        </SectionCard>

        <SectionCard
          icon={MessageCircle}
          title="AI Koç ile Sohbet"
          subtitle="Sorularını sor, önerileri al"
          gradient="from-fuchsia-500 via-pink-500 to-rose-600"
          delay={100}
        >
          <AICoach />
        </SectionCard>
      </div>
    </div>
  );
}
