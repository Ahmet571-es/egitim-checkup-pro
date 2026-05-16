'use client';

/**
 * /giris — Rol Seçim Paneli
 *
 * Sinematik video arka planlı premium hoş geldiniz sayfası.
 * - Background video: 960x960 looping clip (h264 + vp9 fallback), muted/autoplay/playsInline.
 * - Reduced-motion: video render edilmez, poster image gösterilir.
 * - Glass cards: backdrop-blur + warm overlay, video temasıyla bütünleşik.
 * - Mobile-first: poster preload, lazy video, koruyucu fallback.
 */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  GraduationCap, School, Shield, ArrowRight, ArrowLeft,
  Sparkles, CheckCircle2,
} from 'lucide-react';

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
    border: 'border-violet-200/70',
    accent: 'text-violet-700',
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
    border: 'border-emerald-200/70',
    accent: 'text-emerald-700',
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
    border: 'border-amber-200/70',
    accent: 'text-amber-700',
    perks: ['Kurum yönetimi', 'Kullanıcı kontrolü', 'Sistem ayarları'],
  },
];

export default function GirisPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // prefers-reduced-motion'a saygı duy
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Video oynatma garantisi (bazı tarayıcılar autoplay'i ihmal eder)
  useEffect(() => {
    if (reduceMotion) return;
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      /* autoplay engellendi — poster göster, sessizce devam et */
    });
  }, [reduceMotion]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* ═══ BACKGROUND VIDEO ═══ */}
      {!reduceMotion && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/giris-poster.jpg"
          onCanPlay={() => setVideoReady(true)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/giris-bg.webm" type="video/webm" />
          <source src="/giris-bg.mp4" type="video/mp4" />
        </video>
      )}

      {/* Reduced motion fallback — poster image */}
      {reduceMotion && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/giris-poster.jpg)' }}
          aria-hidden="true"
        />
      )}

      {/* ═══ OVERLAY KATMANLARI — minimal, video kendini göstermeli ═══ */}
      {/* 1) Çok ince warm wash — sadece kontrast için */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-white/15 to-rose-50/20"
        aria-hidden="true"
      />

      {/* 2) Güçlü vignette — kartlar öne çıksın, kenarlar yumuşak karanlık */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 110% 90% at center, transparent 25%, rgba(15,40,71,0.12) 65%, rgba(15,40,71,0.30) 100%)',
        }}
        aria-hidden="true"
      />

      {/* 3) Üst + alt yumuşak fade — nav ve footer okunaklılığı */}
      <div
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/35 via-white/15 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/35 via-white/15 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* ═══ İÇERİK ═══ */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Üst nav: geri dön + logo (her ikisi glass) */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-xl border border-white/70 text-slate-700 hover:bg-white hover:shadow-lg hover:scale-[1.03] transition-all text-sm font-bold min-h-[44px] shadow-md shadow-black/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>

          <Link
            href="/"
            aria-label="Eğitim Check-Up"
            className="flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-md shadow-black/5 hover:bg-white transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight hidden sm:inline">
              Eğitim Check-Up
            </span>
          </Link>
        </div>

        {/* Başlık bloğu */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 backdrop-blur-md border border-amber-300/70 mb-5 shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-extrabold text-amber-800 tracking-wider uppercase">Giriş Paneli</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0f2847] mb-4 tracking-tight"
            style={{ textShadow: '0 2px 24px rgba(255,255,255,0.85)' }}
          >
            Hoş Geldiniz
          </h1>

          <p
            className="text-base sm:text-lg text-[#1e3a5f] max-w-2xl mx-auto leading-relaxed font-semibold"
            style={{ textShadow: '0 1px 14px rgba(255,255,255,0.95)' }}
          >
            Devam etmek için hesap türünüzü seçin. Detaylı analiz raporlarına, kişiye özel önerilere ve gelişim takibine erişebilirsiniz.
          </p>
        </div>

        {/* ═══ ROL KARTLARI — frosted glass ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.id}
                href={role.href}
                className={`group relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur-2xl border ${role.border} shadow-xl shadow-slate-900/10 hover:shadow-2xl ${role.shadow} hover:-translate-y-1.5 hover:scale-[1.025] transition-all duration-300 ring-1 ${role.ring} hover:ring-2 hover:bg-white/95`}
              >
                {/* Üst gradient bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${role.gradient}`} />

                <div className="relative p-6 sm:p-7">
                  {/* Inner glow blob */}
                  <div
                    className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${role.gradient} opacity-[0.08] blur-2xl -translate-y-1/3 translate-x-1/3 pointer-events-none group-hover:opacity-[0.14] transition-opacity duration-500`}
                  />

                  {/* Icon container */}
                  <div
                    className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg ${role.shadow} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                  </div>

                  {/* Badge */}
                  <div
                    className={`inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent text-[10px] font-black tracking-wider uppercase mb-2`}
                  >
                    {role.badge}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-black text-[#0f2847] mb-2 tracking-tight">
                    {role.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-700 leading-relaxed mb-5">{role.desc}</p>

                  {/* Perks */}
                  <ul className="space-y-2 mb-6">
                    {role.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13px] text-slate-800 font-semibold">
                        <CheckCircle2 className={`w-4 h-4 ${role.accent} shrink-0`} />
                        {p}
                      </li>
                    ))}
                  </ul>

                  {/* CTA arrow */}
                  <div
                    className={`inline-flex items-center gap-2 text-sm font-extrabold ${role.accent} group-hover:gap-3 transition-all`}
                  >
                    Giriş Yap
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ═══ ALT BİLGİ — frosted footer ═══ */}
        <div className="mt-10 sm:mt-14 text-center">
          <div className="inline-block px-6 py-4 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 shadow-lg shadow-slate-900/5">
            <p className="text-sm text-slate-700 font-medium">
              Henüz hesabınız yok mu?{' '}
              <Link
                href="/register"
                className="font-bold text-[#0f2847] hover:text-amber-600 underline decoration-amber-500/50 hover:decoration-amber-500 underline-offset-4 transition-colors"
              >
                Öğrenci Hesabı Oluştur
              </Link>
            </p>
            <p className="mt-1.5 text-xs text-slate-600">
              Öğretmen / kurum kaydı için{' '}
              <Link href="/iletisim" className="font-semibold underline hover:text-[#0f2847]">
                bizimle iletişime geçin
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
