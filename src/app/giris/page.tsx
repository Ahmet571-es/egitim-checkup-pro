'use client';

/**
 * /giris — Rol Seçim Paneli
 * Öğrenci / Öğretmen / Yönetici giriş sayfalarına yönlendirme.
 * Trial test bitiren öğrenci buraya yönlendirilir.
 */

import Link from 'next/link';
import { GraduationCap, School, Shield, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

const ROLES = [
  {
    id: 'student',
    href: '/login',
    badge: 'Öğrenci',
    title: 'Öğrenci Girişi',
    desc: 'Detaylı analiz raporlarını gör, gelişimini takip et, koçluk görevlerini tamamla.',
    icon: GraduationCap,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    shadow: 'shadow-violet-500/30',
    ring: 'ring-violet-500/20',
    bg: 'from-violet-50 to-fuchsia-50',
    border: 'border-violet-200',
    accent: 'text-violet-600',
    perks: ['Tam detaylı PDF raporu', 'Kişisel öneriler', 'Gelişim grafikleri'],
  },
  {
    id: 'teacher',
    href: '/login/ogretmen',
    badge: 'Öğretmen',
    title: 'Öğretmen Girişi',
    desc: 'Öğrencilerini yönet, test ata, sınıf bazlı analiz ve raporlara eriş.',
    icon: School,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    shadow: 'shadow-emerald-500/30',
    ring: 'ring-emerald-500/20',
    bg: 'from-emerald-50 to-cyan-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
    perks: ['Sınıf yönetimi', 'Toplu test atama', 'Detaylı öğrenci raporları'],
  },
  {
    id: 'admin',
    href: '/yonetici',
    badge: 'Yönetici',
    title: 'Yönetici Girişi',
    desc: 'Kurum yönetimi, öğretmen ve öğrenci hesapları, sistem ayarları.',
    icon: Shield,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    shadow: 'shadow-amber-500/30',
    ring: 'ring-amber-500/20',
    bg: 'from-amber-50 to-rose-50',
    border: 'border-amber-200',
    accent: 'text-amber-600',
    perks: ['Kurum yönetimi', 'Kullanıcı kontrolü', 'Sistem ayarları'],
  },
];

export default function GirisPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/40">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-violet-200/30 to-fuchsia-200/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-emerald-200/30 to-cyan-200/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[440px] h-[440px] rounded-full bg-gradient-to-br from-amber-200/30 to-rose-200/20 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,40,71,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,40,71,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Üst nav: geri dön */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-slate-200 text-slate-700 hover:bg-white hover:shadow-md transition-all text-sm font-bold min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>

          <Link href="/" aria-label="Eğitim Check-Up" className="flex items-center gap-2.5 min-h-[44px]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight hidden sm:inline">
              Eğitim Check-Up
            </span>
          </Link>
        </div>

        {/* Başlık */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/60 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-extrabold text-amber-700 tracking-wider uppercase">Giriş Paneli</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0f2847] mb-4 tracking-tight">
            Hoş Geldiniz
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Devam etmek için hesap türünüzü seçin. Detaylı analiz raporlarına, kişiye özel önerilere ve gelişim takibine erişebilirsiniz.
          </p>
        </div>

        {/* Rol Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.id}
                href={role.href}
                className={`group relative overflow-hidden rounded-3xl bg-white border ${role.border} shadow-lg hover:shadow-2xl ${role.shadow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ring-1 ${role.ring} hover:ring-2`}
              >
                {/* Üst gradient bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${role.gradient}`} />

                {/* Background blob */}
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${role.bg} blur-2xl opacity-60 -translate-y-1/3 translate-x-1/3 pointer-events-none`} />

                <div className="relative p-6 sm:p-7">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg ${role.shadow} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Badge */}
                  <div className={`inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent text-[10px] font-black tracking-wider uppercase mb-2`}>
                    {role.badge}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-2 tracking-tight">
                    {role.title}
                  </h2>

                  {/* Desc */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {role.desc}
                  </p>

                  {/* Perks */}
                  <ul className="space-y-2 mb-6">
                    {role.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13px] text-slate-700 font-semibold">
                        <CheckCircle2 className={`w-4 h-4 ${role.accent} shrink-0`} />
                        {p}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className={`inline-flex items-center gap-2 text-sm font-extrabold ${role.accent} group-hover:gap-3 transition-all`}>
                    Giriş Yap
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Alt bilgi */}
        <div className="mt-10 sm:mt-14 text-center">
          <p className="text-sm text-slate-600 font-medium">
            Henüz hesabınız yok mu?{' '}
            <Link href="/register" className="font-bold text-[#0f2847] hover:text-amber-600 underline decoration-amber-500/40 hover:decoration-amber-500 underline-offset-4 transition-colors">
              Öğrenci Hesabı Oluştur
            </Link>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Öğretmen / kurum kaydı için{' '}
            <Link href="/iletisim" className="font-semibold underline hover:text-[#0f2847]">
              bizimle iletişime geçin
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
