'use client';

import Link from 'next/link';
import { Users, FileCheck2, ClipboardList, Sparkles, FileText, BarChart3 } from 'lucide-react';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';

interface QuickLink {
  href: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function DashboardClient({
  firstName, studentCount, resultCount,
}: {
  firstName: string;
  studentCount: number;
  resultCount: number;
}) {
  const quickLinks: QuickLink[] = [
    {
      href: '/teacher/assign-test',
      title: 'Test Ata',
      subtitle: 'Öğrencilerine test ata',
      gradient: 'from-emerald-500 to-teal-600',
      icon: ClipboardList,
    },
    {
      href: '/teacher/reports',
      title: 'Raporlar',
      subtitle: 'AI destekli rapor üret',
      gradient: 'from-cyan-500 to-sky-600',
      icon: FileText,
    },
    {
      href: '/teacher/coaching',
      title: 'AI Koçluk',
      subtitle: 'Öğretmen rehberi',
      gradient: 'from-violet-500 to-purple-600',
      icon: Sparkles,
    },
    {
      href: '/teacher/guidance-plan',
      title: 'Rehberlik Planı',
      subtitle: 'Yıllık plan oluştur',
      gradient: 'from-amber-500 to-orange-600',
      icon: BarChart3,
    },
  ];

  return (
    <div>
      <WelcomeBanner
        role="teacher"
        title={`Hoş geldiniz, ${firstName}!`}
        subtitle="Tüm okullardaki öğrencileri Öğrencilerim sayfasından yönetebilir, AI destekli raporlar üretebilirsiniz."
        badge="Bugünün özeti"
        emoji="👋"
      />

      {/* Ana Stat Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
          href="/teacher/results"
          label="Tamamlanan Test"
          value={resultCount}
          gradient="from-violet-500 to-purple-600"
          icon={FileCheck2}
          delay={180}
          helperText="Sonuçları incele"
        />
      </div>

      {/* Hızlı Aksiyonlar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="ql-card group relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
              style={{ animationDelay: `${260 + idx * 60}ms` }}
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${link.gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
              <div className="relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  <Icon size={20} />
                </div>
                <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-[14px]">{link.title}</p>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">{link.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .ql-card {
          animation: ql-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes ql-enter {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
