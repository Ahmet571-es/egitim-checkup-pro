'use client';

import dynamic from 'next/dynamic';

const ClassComparison = dynamic(() => import('@/components/teacher/ClassComparison'), { ssr: false });

export default function ClassComparisonSection() {
  return <ClassComparison />;
}
