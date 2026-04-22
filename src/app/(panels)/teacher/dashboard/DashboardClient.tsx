'use client';

import { Users, FileCheck2 } from 'lucide-react';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';
import ParentNotes from '@/components/teacher/ParentNotes';
import PendingParents from '@/components/teacher/PendingParents';

export default function DashboardClient({
  firstName, studentCount, resultCount, teacherId,
}: {
  firstName: string;
  studentCount: number;
  resultCount: number;
  teacherId: string | null;
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

      {/* Onay bekleyen veli bağlantıları — patron'un isteği */}
      <div className="mt-6">
        <PendingParents />
      </div>

      {/* Veli Notları — FAZ 3B: öğretmen dashboard'ında veli mesajları */}
      {teacherId && (
        <div className="mt-6">
          <ParentNotes teacherId={teacherId} />
        </div>
      )}
    </div>
  );
}
