'use client';

import dynamic from 'next/dynamic';

const StudentTrendView = dynamic(
  () => import('@/components/teacher/StudentTrendView'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function StudentTrendSection() {
  return <StudentTrendView />;
}
