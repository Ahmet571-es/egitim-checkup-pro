'use client';

import dynamic from 'next/dynamic';

const KPIDashboard = dynamic(() => import('@/components/admin/KPIDashboard'), { ssr: false });
const RiskDistribution = dynamic(() => import('@/components/admin/RiskDistribution'), { ssr: false });

export default function AdminAnalyticsSection() {
  return (
    <div className="space-y-6">
      <KPIDashboard />
      <RiskDistribution />
    </div>
  );
}
