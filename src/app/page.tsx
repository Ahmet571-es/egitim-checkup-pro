'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GraduationCap, Brain, Eye, Compass, Lightbulb, AlertTriangle,
  BookOpen, BarChart3, Focus, SplitSquareHorizontal, ArrowRight,
  CheckCircle2, Sparkles, Users, FileText, ChevronRight, Mail, Shield,
  Zap, TrendingUp, Award, UserCheck, School, ClipboardList, Heart
} from 'lucide-react';
import { useScrollReveal, useCountUp } from '@/hooks/useScrollReveal';

/* ═══ DATA ═══ */
const TESTS = [
  { name: 'Enneagram Kişilik', desc: '9 kişilik tipi derinlemesine analizi', count: '180 soru', icon: Brain, color: 'from-violet-500 to-purple-600', border: 'border-l-violet-500' },
  { name: 'VARK Öğrenme Stilleri', desc: 'Görsel, İşitsel, Okuma-Yazma, Kinestetik', count: '16 soru', icon: Eye, color: 'from-sky-500 to-blue-600', border: 'border-l-sky-500' },
  { name: 'Meslek Testi', desc: '6 mesleki ilgi alanı ve kariyer yönlendirme', count: '84 soru', icon: Compass, color: 'from-emerald-500 to-teal-600', border: 'border-l-emerald-500' },
  { name: 'Çoklu Zekâ', desc: '8 zekâ alanı profili çıkarma', count: '80 soru', icon: Lightbulb, color: 'from-amber-500 to-orange-600', border: 'border-l-amber-500' },
  { name: 'Sınav Kaygısı', desc: 'Kaygı düzeyi ve kaynakları analizi', count: '50 soru', icon: AlertTriangle, color: 'from-rose-500 to-red-600', border: 'border-l-rose-500' },
  { name: 'Çalışma Davranışı', desc: '7 alt kategori, verimlilik analizi', count: '73 soru', icon: BookOpen, color: 'from-indigo-500 to-blue-600', border: 'border-l-indigo-500' },
  { name: 'Akademik Analiz', desc: 'Akademik güçlü yönler ve gelişim alanları', count: '54 soru', icon: BarChart3, color: 'from-cyan-500 to-teal-600', border: 'border-l-cyan-500' },
  { name: 'Hızlı Okuma', desc: 'WPM ölçümü + okuduğunu anlama testi', count: 'Zamanlı', icon: BookOpen, color: 'from-lime-500 to-green-600', border: 'border-l-lime-500' },
  { name: 'D2 Dikkat Testi', desc: 'Orijinal Brickenkamp 14×47 formatı', count: '658 sembol', icon: Focus, color: 'from-pink-500 to-rose-600', border: 'border-l-pink-500' },
  { name: 'Sağ-Sol Beyin Dominansı', desc: 'Analitik mi yaratıcı mı analizi', count: '30 soru', icon: SplitSquareHorizontal, color: 'from-fuchsia-500 to-purple-600', border: 'border-l-fuchsia-500' },
];

const STEPS = [
  { num: '01', title: 'Okulunuzu Kaydedin', desc: 'Kurulum sadece 5 dakika. Okulunuzu tanımlayın ve sınıflarınızı oluşturun.', gradient: 'from-emerald-500 to-teal-600', icon: School },
  { num: '02', title: 'Testleri Atayın', desc: 'Sınıflarınıza testleri tek tıkla atayın. Öğrenciler kendi panellerinden çözer.', gradient: 'from-sky-500 to-blue-600', icon: ClipboardList },
  { num: '03', title: 'Test Analiz Raporlarınızı Alın', desc: 'Detaylı analizler ve kişiselleştirilmiş öneriler.', gradient: 'from-violet-500 to-purple-600', icon: Sparkles },
];

const HIGHLIGHTS = [
  { icon: Brain, title: 'Derinlemesine Analiz', desc: 'Kapsamlı öğrenci profilleme ve değerlendirme', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { icon: TrendingUp, title: 'Gelişim Takibi', desc: 'Longitudinal veri ile öğrenci gelişimini izleyin', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { icon: Award, title: 'Koçluk Sistemi', desc: 'Haftalık görevler ve gamification ile motivasyon', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

/* ═══ SUB-COMPONENTS ═══ */

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    w: Math.round(Math.random() * 4 + 2),
    left: Math.round(Math.random() * 100),
    top: Math.round(Math.random() * 100),
    bg: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5],
    opacity: +(0.15 + Math.random() * 0.2).toFixed(2),
    delay: +(Math.random() * 10).toFixed(1),
    dur: +(15 + Math.random() * 20).toFixed(1),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle absolute rounded-full"
          style={{
            width: `${p.w}px`, height: `${p.w}px`,
            left: `${p.left}%`, top: `${p.top}%`,
            background: p.bg, opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function TypingText({ words, className }: { words: string[]; className?: string }) {
  const [currentWord, setCurrentWord] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWord];
    const timeout = deleting ? 40 : 80;

    if (!deleting && displayed === word) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed === '') {
      setDeleting(false);
      setCurrentWord((prev) => (prev + 1) % words.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayed(deleting ? word.substring(0, displayed.length - 1) : word.substring(0, displayed.length + 1));
    }, timeout);
    return () => clearTimeout(timer);
  }, [displayed, deleting, currentWord, words]);

  return (
    <span className={className}>
      {displayed}
      <span className="inline-block w-[3px] h-[0.9em] bg-emerald-500 ml-0.5 align-middle animate-[blink-cursor_0.8s_step-end_infinite]" />
    </span>
  );
}

/* ═══ LANDING PAGE ═══ */
export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const highlights = useScrollReveal(0.15);
  const tests = useScrollReveal(0.1);
  const steps = useScrollReveal(0.15);
  const footer = useScrollReveal(0.1);

  return (
    <div className="min-h-screen relative">
      {/* ═══ GLOBAL BACKGROUND VIDEO — tüm sayfa boyunca arka planda fixed ═══ */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden hero-video-bg"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero-bg.webm" type="video/webm" />
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Tek katmanlı kademeli koyu gradient — metin okunaklılığı için yeterli */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/40 dark:from-black/40 dark:via-black/35 dark:to-black/55" />
      </div>

      {/* Tüm içerik video'nun üzerinde (z-index 10) */}
      <div className="relative" style={{ zIndex: 10 }}>
      {/* ═══ NAVBAR ═══ */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        navScrolled
          ? 'bg-white/92 backdrop-blur-2xl border-gray-200 dark:border-slate-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border-white/40 dark:border-slate-700/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ana sayfaya git" className="flex items-center gap-2.5 min-h-[44px] hover:scale-[1.03] transition-transform duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Eğitim Check-Up</span>
          </Link>

        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Sayfa ile video tonunu eşitleyen warm blob'lar (GPU dostu, sadece transform) */}
        <div className="absolute top-[-200px] right-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-amber-300/30 to-orange-300/20 blur-3xl pointer-events-none blob-float" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-300/25 to-pink-300/15 blur-3xl pointer-events-none blob-float-delay" />
        {/* Aurora flowing lights — warm tones */}
        <div className="absolute top-[10%] left-[-20%] w-[900px] h-[300px] bg-gradient-to-r from-amber-300/20 via-orange-200/15 to-rose-300/20 blur-3xl pointer-events-none aurora rounded-full" />
        <div className="absolute bottom-[5%] right-[-15%] w-[700px] h-[250px] bg-gradient-to-r from-pink-300/15 via-amber-200/10 to-orange-300/15 blur-3xl pointer-events-none aurora-delay rounded-full" />
        <FloatingParticles />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-28 text-center">
          {/* Badge — holographic float (videodaki tablet'ten ilk hologram çıkışı gibi) */}
          <div className="hero-badge inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 dark:bg-slate-800/85 backdrop-blur-xl border-2 border-amber-200/80 dark:border-amber-700/60 shadow-2xl shadow-amber-500/30 mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/30 to-orange-500/0 -skew-x-12 hero-shimmer pointer-events-none" />
            <div className="relative w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md animate-[pulse-soft_2s_ease-in-out_infinite]">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">11 Bilimsel Test · Detaylı Analiz · 4 Panel</span>
          </div>

          {/* Başlık — holografik yükselme, iki kelime stagger ile (videodaki ikonların sırayla çıkması) */}
          <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-4xl mx-auto hero-title-shadow">
            <span className="hero-word-1 inline-block text-white">
              Öğrencilerinizi
            </span>
            <br className="hidden sm:block" />
            <span className="hero-word-2 hero-word-3 inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] cursor-default" style={{ filter: 'drop-shadow(0 4px 16px rgba(245, 158, 11, 0.5))' }}>
              Gerçekten Tanıyın
            </span>
          </h1>

          {/* Subtitle — daha sonra yükselen üçüncü hologram */}
          <div className="hero-subtitle mt-6 text-lg sm:text-xl text-white/95 dark:text-slate-100 max-w-2xl mx-auto leading-relaxed min-h-[56px] flex flex-wrap items-center justify-center gap-x-1.5 font-semibold">
            <span>Psikometrik testler ile öğrencilerinizin</span>
            <TypingText
              words={['potansiyeli keşfedin', 'kariyer yolunu çizin', 'gelişimi takip edin', 'öğrenme stilini belirleyin', 'mizacını anlayın', 'güçlü yönlerini bulun']}
              className="text-amber-300 font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            />
          </div>

          {/* Giriş Butonları */}
          <div className="hero-cta mt-10 grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link href="/login"
              className="touch-feedback group relative px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white font-extrabold shadow-xl shadow-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 text-[12px] sm:text-[14.5px] tracking-wide overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">ÖĞRENCİ</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            <Link href="/login/ogretmen"
              className="touch-feedback group relative px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-extrabold shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 text-[12px] sm:text-[14.5px] tracking-wide overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <School className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">ÖĞRETMEN</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            <Link href="/yonetici"
              className="touch-feedback group relative px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 text-[12px] sm:text-[14.5px] tracking-wide overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">YÖNETİCİ</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            <Link href="/login/veli"
              className="touch-feedback group relative px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white font-extrabold shadow-xl shadow-pink-500/40 hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 text-[12px] sm:text-[14.5px] tracking-wide overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:scale-110 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">VELİ</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>

          <div className="hero-trust mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/95 dark:text-slate-100 font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            <span className="flex items-center gap-1.5 hero-trust-item" style={{ animationDelay: '0s' }}>
              <Shield className="w-3.5 h-3.5 text-amber-300" /> KVKK Uyumlu
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/60" />
            <span className="flex items-center gap-1.5 hero-trust-item" style={{ animationDelay: '0.4s' }}>
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Detaylı Analiz Raporları
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/60" />
            <span className="flex items-center gap-1.5 hero-trust-item" style={{ animationDelay: '0.8s' }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" /> Bilimsel Temelli
            </span>
          </div>
        </div>
      </section>

      {/* ═══ HIGHLIGHTS ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24" ref={highlights.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${highlights.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Neden Eğitim Check-Up?</h2>
          <p className="mt-3 text-white/90 dark:text-slate-300 text-lg max-w-xl mx-auto font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-[float-text_3s_ease-in-out_infinite]">Öğrencilerinizi tanımanın en kapsamlı ve akıllı yolu</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {HIGHLIGHTS.map((h, i) => (
            <div key={h.title}
              className={`group bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border p-6 shadow-sm text-center
                hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ${h.color}
                ${highlights.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: highlights.visible ? `${i * 100}ms` : '0ms' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 dark:border-slate-700/60 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <h.icon className="w-7 h-7" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0f2847] dark:text-slate-100 mb-2">{h.title}</h3>
              <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTS ═══ */}
      <section id="testler" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 scroll-mt-20" ref={tests.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Testlerimiz</h2>
          <p className="mt-3 text-white/90 dark:text-slate-300 text-lg max-w-xl mx-auto font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-[float-text_3s_ease-in-out_infinite]">Bilimsel temelli 11 farklı psikometrik test ile kapsamlı öğrenci profili</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TESTS.map((t, i) => (
            <div key={t.name}
              className={`test-card group bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 border-l-[3px] ${t.border} p-5 shadow-sm
                hover:-translate-y-1.5 hover:shadow-lg hover:border-l-[5px] transition-all duration-300
                ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: tests.visible ? `${i * 80}ms` : '0ms' }}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-[5deg] group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#0f2847] dark:text-slate-100">{t.name}</h3>
                    <span className="text-[12px] text-gray-400 dark:text-slate-500 font-semibold bg-gray-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-full shrink-0 ml-2">{t.count}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1 group-hover:text-gray-700 dark:text-slate-300 transition-colors duration-200">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" ref={steps.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Nasıl Çalışır?</h2>
          <p className="mt-3 text-white/90 dark:text-slate-300 text-lg font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-[float-text_3s_ease-in-out_infinite]">3 adımda profesyonel öğrenci analizi</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute top-[56px] left-[16.7%] right-[16.7%] h-[2px] overflow-hidden z-0">
            <div className={`h-full bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 transition-all duration-1000 ${steps.visible ? 'w-full' : 'w-0'}`}
                 style={{ transitionDelay: '300ms' }} />
          </div>
          {STEPS.map((s, i) => (
            <div key={s.num}
              className={`relative z-10 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-7 shadow-sm text-center
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                ${steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: steps.visible ? `${i * 150}ms` : '0ms' }}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg ${steps.visible ? 'animate-[icon-pulse_2s_ease-in-out_infinite]' : ''}`}
                   style={{ animationDelay: `${i * 500}ms` }}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-[12px] font-bold text-gray-300 mb-2 tracking-wider">ADIM {s.num}</div>
              <h3 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRUST BADGES (Animated) ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Güvenle Kullanın</h2>
          <p className="mt-3 text-white/90 dark:text-slate-300 text-lg font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-[float-text_3s_ease-in-out_infinite]">Eğitim psikolojisi standartlarına uygun altyapı</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'KVKK Uyumlu', desc: 'Veriler güvenle saklanır', gradient: 'from-sky-500 to-blue-600' },
            { icon: '🧪', title: 'Bilimsel Testler', desc: 'Geçerlilik-güvenirlik kanıtlı', gradient: 'from-violet-500 to-purple-600' },
            { icon: '📊', title: 'Anlık Raporlar', desc: '3 format: öğretmen · öğrenci · veli', gradient: 'from-amber-500 to-orange-600' },
          ].map((item, i) => (
            <div
              key={item.title}
              className="group relative bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 text-center shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative">
                <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">{item.icon}</div>
                <h3 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100 mb-1">{item.title}</h3>
                <p className="text-[12px] text-gray-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f2847]/85 via-[#1a3a5c]/80 to-[#0f2847]/85 backdrop-blur-md border border-white/10 p-10 sm:p-14 text-center shadow-2xl">
          <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-amber-500/15 blur-2xl" />
          <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-orange-500/15 blur-2xl" />
          <h2 className="relative text-2xl sm:text-3xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] mb-4">Öğrencilerinizin Potansiyelini Keşfedin</h2>
          <p className="relative text-white/90 max-w-lg mx-auto font-semibold animate-[float-text_3s_ease-in-out_infinite]">Bilimsel testler ve detaylı analizler ile her öğrenciyi bireysel olarak tanıyın.</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/15" ref={footer.ref}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500 ${footer.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Üst kısım: marka + ana linkler */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">Eğitim Check-Up</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              <Link href="/paketler" className="footer-link hover:text-amber-300 transition-colors py-1.5 min-h-[44px] inline-flex items-center">
                Paketler
              </Link>
              <Link href="/pricing" className="footer-link hover:text-amber-300 transition-colors py-1.5 min-h-[44px] inline-flex items-center">
                Ücretlendirme
              </Link>
              <Link href="/hakkimizda" className="footer-link hover:text-amber-300 transition-colors py-1.5 min-h-[44px] inline-flex items-center">
                Hakkımızda
              </Link>
              <Link href="/iletisim" className="footer-link hover:text-amber-300 transition-colors py-1.5 min-h-[44px] inline-flex items-center">
                İletişim
              </Link>
            </div>
          </div>

          {/* Yasal linkler — küçük puntolarla */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/95 font-semibold drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] border-t border-white/15 pt-5">
            <Link href="/kvkk" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 py-1.5 min-h-[36px]">
              <Shield className="w-3 h-3" /> KVKK
            </Link>
            <span className="text-white/40">·</span>
            <Link href="/gizlilik-politikasi" className="hover:text-amber-300 transition-colors py-1.5 min-h-[36px]">
              Gizlilik Politikası
            </Link>
            <span className="text-white/40">·</span>
            <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-amber-300 transition-colors py-1.5 min-h-[36px]">
              Mesafeli Satış Sözleşmesi
            </Link>
            <span className="text-white/40">·</span>
            <Link href="/iade-ve-teslimat-sartlari" className="hover:text-amber-300 transition-colors py-1.5 min-h-[36px]">
              İade ve Teslimat Şartları
            </Link>
            <span className="text-white/40">·</span>
            <a href="mailto:info@egitimcheckup.com" className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 py-1.5 min-h-[36px]">
              <Mail className="w-3 h-3" /> info@egitimcheckup.com
            </a>
          </div>

          <p className="text-xs text-white/85 font-semibold text-center mt-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
        </div>
      </footer>
      </div>{/* /content wrapper */}
    </div>
  );
}
