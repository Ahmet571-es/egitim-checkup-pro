'use client';

import dynamic from 'next/dynamic';

const CoachingTracking = dynamic(() => import('@/components/teacher/CoachingTracking'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function CoachingTrackingSection() {
  return <CoachingTracking />;
}
