'use client';

import dynamic from 'next/dynamic';

const ClassStrategy = dynamic(() => import('@/components/teacher/ClassStrategy'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ClassStrategySection() {
  return <ClassStrategy />;
}
