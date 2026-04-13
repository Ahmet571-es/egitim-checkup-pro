'use client';

import dynamic from 'next/dynamic';

const CoachingDashboard = dynamic(() => import('@/components/student/CoachingDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const AICoach = dynamic(() => import('@/components/student/AICoach'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function CoachingPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2">AI Koçluk</h1>
      <p className="text-gray-500 text-sm mb-6">
        Kişisel görevlerin ve AI koçunla sohbet
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CoachingDashboard />
        </div>
        <div>
          <AICoach />
        </div>
      </div>
    </div>
  );
}
