'use client';

import { Users, FileCheck2 } from 'lucide-react';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';

export default function DashboardClient({
  firstName, studentCount, resultCount,
}: {
  firstName: string;
  studentCount: number;
  resultCount: number;
}) {
  return (
    <div>
      <WelcomeBanner
        role="teacher"
        title={`Hoş geldiniz, ${firstName}!`}
        subtitle="Tüm okullardaki öğrencileri Öğrencilerim sayfasından yönetebilirsiniz."
        badge="Bugünün özeti"
        emoji="👋"
      />

      {/* Ana Stat Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TiltStatCard
          href="/teacher/students"
          label="Öğrencilerim"
          value={studentCount}
          gradient="from-sky-500 to-blue-600"
          icon={Users}
          delay={100}
          helperText="Öğrencileri yönet"
        />
        <TiltStatCard
          label="Tamamlanan Test"
          value={resultCount}
          gradient="from-violet-500 to-purple-600"
          icon={FileCheck2}
          delay={180}
          helperText="Toplam çözüm"
        />
      </div>
    </div>
  );
}
