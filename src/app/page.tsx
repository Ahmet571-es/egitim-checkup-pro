'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GraduationCap, Brain, Eye, Compass, Lightbulb, AlertTriangle,
  BookOpen, BarChart3, Focus, SplitSquareHorizontal, ArrowRight,
  CheckCircle2, Sparkles, Users, FileText, ChevronRight, Mail, Shield,
  Zap, TrendingUp, Award, UserCheck, School, ClipboardList,
  Menu, X, Lock
} from 'lucide-react';
import { useScrollReveal, useCountUp } from '@/hooks/useScrollReveal';
import HighlightModals, { type HighlightKey } from '@/components/HighlightModals';

/* ═══ DATA ═══ */
const TESTS = [
  // Satır 1
  { id: 'enneagram', name: 'Enneagram Kişilik', desc: '9 kişilik tipi derinlemesine analizi', count: '180 soru', icon: Brain, color: 'from-violet-500 to-purple-600', border: 'border-l-violet-500',
    purpose: 'Karakter ve mizaç tipinin temelini keşfetmek.',
    measures: '9 kişilik tipi içinden hangisine yatkın olduğunu, ana motivasyonlarını ve baş etme tarzını ölçer.' },
  { id: 'kaygi', name: 'Sınav Kaygısı', desc: 'Kaygı düzeyi ve kaynakları analizi', count: '50 soru', icon: AlertTriangle, color: 'from-rose-500 to-red-600', border: 'border-l-rose-500',
    purpose: 'Sınav öncesi ve anındaki gerginlik düzeyini ölçmek.',
    measures: 'Bilişsel ve duyuşsal kaygı seviyeni, kaygının kaynaklarını ve performansa etkisini değerlendirir.' },
  // Satır 2
  { id: 'meslek', name: 'Meslek Testi', desc: '6 mesleki ilgi alanı ve kariyer yönlendirme', count: '84 soru', icon: Compass, color: 'from-emerald-500 to-teal-600', border: 'border-l-emerald-500',
    purpose: 'Sana en uygun meslek alanlarını belirlemek.',
    measures: 'Holland\'ın 6 mesleki ilgi alanı (RIASEC) üzerinden eğilimlerini ve kariyer yatkınlıklarını gösterir.' },
  { id: 'akademik', name: 'Akademik Analiz', desc: 'Akademik güçlü yönler ve gelişim alanları', count: '54 soru', icon: BarChart3, color: 'from-cyan-500 to-teal-600', border: 'border-l-cyan-500',
    purpose: 'Akademik güçlü ve gelişime açık yönlerini ortaya koymak.',
    measures: 'Okuma anlama, matematik mantığı ve genel akademik becerilerini kapsamlı analiz eder.' },
  // Satır 3
  { id: 'vark', name: 'VARK Öğrenme Stilleri', desc: 'Görsel, İşitsel, Okuma-Yazma, Kinestetik', count: '16 soru', icon: Eye, color: 'from-sky-500 to-blue-600', border: 'border-l-sky-500',
    purpose: 'Hangi yöntemle daha kolay öğrendiğini bulmak.',
    measures: 'Görsel, işitsel, okuma-yazma ve kinestetik öğrenme tercihlerinin yüzdelik dağılımını verir.' },
  { id: 'dikkat', name: 'Dikkat ve Odaklanma Testi', desc: 'Orijinal Brickenkamp 14×47 formatı', count: '658 sembol', icon: Focus, color: 'from-pink-500 to-rose-600', border: 'border-l-pink-500',
    purpose: 'Sürekli dikkat ve hata yapma eğilimini ölçmek.',
    measures: 'Görsel tarama hızını, dikkat sürekliliğini, hata oranını ve konsantrasyon kapasitesini ortaya çıkarır.' },
  // Satır 4
  { id: 'coklu-zeka', name: 'Çoklu Zekâ', desc: '8 zekâ alanı profili çıkarma', count: '80 soru', icon: Lightbulb, color: 'from-amber-500 to-orange-600', border: 'border-l-amber-500',
    purpose: 'Hangi zekâ alanlarında daha güçlü olduğunu görmek.',
    measures: 'Sözel, mantıksal, görsel, müzikal, bedensel, sosyal, içsel ve doğa olmak üzere 8 zekâ profilini çıkarır.' },
  { id: 'calisma', name: 'Çalışma Davranışı', desc: '7 alt kategori, verimlilik analizi', count: '73 soru', icon: BookOpen, color: 'from-indigo-500 to-blue-600', border: 'border-l-indigo-500',
    purpose: 'Çalışma alışkanlıklarındaki güçlü ve zayıf yönleri tespit etmek.',
    measures: 'Plan yapma, motivasyon, zaman yönetimi, dikkat, ortam ve verimlilik gibi 7 alt boyutu inceler.' },
  // Satır 5
  { id: 'beyin', name: 'Sağ-Sol Beyin Dominansı', desc: 'Analitik mi yaratıcı mı analizi', count: '30 soru', icon: SplitSquareHorizontal, color: 'from-fuchsia-500 to-purple-600', border: 'border-l-fuchsia-500',
    purpose: 'Analitik mi yoksa yaratıcı mı düşündüğünü görmek.',
    measures: 'Mantıksal-sıralı (sol) ve bütünsel-yaratıcı (sağ) beyin yarımküresi tercihinin dengesini gösterir.' },
  { id: 'okuma', name: 'Hızlı Okuma / Anlama Oranı Ölçümü', desc: 'WPM ölçümü + okuduğunu anlama testi', count: 'Zamanlı', icon: BookOpen, color: 'from-lime-500 to-green-600', border: 'border-l-lime-500',
    purpose: 'Okuma hızını ve okuduğunu anlama oranını ölçmek.',
    measures: 'Dakikadaki kelime sayısını (WPM), okuduğunu anlama yüzdesini ve toplam okuma performansını verir.' },
];

// Şu anda ücretsiz trial (kayıtsız) sayfası hazır olan testler.
// Çalışma Davranışı engine yazıldıktan sonra buraya eklenecek.
// Diğer 6 test (Enneagram, Sınav Kaygısı, Meslek, Akademik, Dikkat, Hızlı Okuma)
// için kullanıcı kayıt olmak zorunda.
const TRIAL_AVAILABLE = ['vark', 'beyin', 'coklu-zeka', 'calisma'];

const STEPS = [
  { num: '01', title: 'Kişisel Bilgilerinizi Girin', desc: 'Ad, soyad, doğum tarihi ve sınıfınızı (veya mezun olduğunuzu) belirtin. Yaş otomatik hesaplanır.', gradient: 'from-emerald-500 to-teal-600', icon: UserCheck },
  { num: '02', title: 'E-posta, Şifre ve KVKK Onayı', desc: 'E-posta adresinizi belirleyin, en az 6 karakterli bir şifre oluşturun ve KVKK aydınlatma metnini onaylayın.', gradient: 'from-sky-500 to-blue-600', icon: Shield },
  { num: '03', title: 'Giriş Yapın ve Testlere Başlayın', desc: 'Hesabınız oluştuktan sonra giriş yapın ve panelinizden atanan testleri çözmeye başlayın.', gradient: 'from-violet-500 to-purple-600', icon: Sparkles },
];

const HIGHLIGHTS: { icon: typeof Brain; title: string; desc: string; color: string; key: NonNullable<HighlightKey> }[] = [
  { icon: Brain, title: 'Derinlemesine Analiz', desc: 'Kapsamlı öğrenci profilleme ve değerlendirme', color: 'text-violet-600 bg-violet-50 border-violet-200', key: 'analiz' },
  { icon: TrendingUp, title: 'Gelişim Takibi', desc: 'Longitudinal veri ile öğrenci gelişimini izleyin', color: 'text-sky-600 bg-sky-50 border-sky-200', key: 'gelisim' },
  { icon: Award, title: 'Koçluk Sistemi', desc: 'Haftalık görevler ve gamification ile motivasyon', color: 'text-amber-600 bg-amber-50 border-amber-200', key: 'kocluk' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestIdx, setActiveTestIdx] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightKey>(null);

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
          {/* Logo */}
          <Link href="/" aria-label="Ana sayfaya git" className="flex items-center gap-2.5 min-h-[44px] hover:scale-[1.03] transition-transform duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Eğitim Check-Up</span>
          </Link>

          {/* Desktop nav links + Giriş Yap CTA */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/paketler', label: 'Paketler' },
              { href: '/pricing', label: 'Ücretlendirme' },
              { href: '/hakkimizda', label: 'Hakkımızda' },
              { href: '/iletisim', label: 'İletişim' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group min-h-[44px] inline-flex items-center
                  ${navScrolled
                    ? 'text-[#0f2847] dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700/50 hover:text-amber-600 dark:hover:text-amber-300'
                    : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:text-amber-200 hover:drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'}`}
              >
                <span className="relative z-10">{link.label}</span>
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-3/5 transition-all duration-300 rounded-full
                  ${navScrolled ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-amber-300 to-orange-300'}`} />
              </Link>
            ))}
            {/* Giriş Yap — primary CTA */}
            <Link
              href="/giris"
              className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold min-h-[44px] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.04] active:scale-[0.97] transition-all"
            >
              <Lock className="w-4 h-4" />
              Giriş Yap
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileMenuOpen}
            className={`md:hidden p-2.5 rounded-xl transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center
              ${navScrolled
                ? 'text-[#0f2847] hover:bg-amber-50 hover:text-amber-600'
                : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:bg-white/15'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? 'max-h-[400px] border-t border-white/20 dark:border-slate-700/50' : 'max-h-0'
        } ${navScrolled ? 'bg-white/95 backdrop-blur-2xl' : 'bg-[#0f2847]/85 backdrop-blur-xl'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {[
              { href: '/paketler', label: 'Paketler' },
              { href: '/pricing', label: 'Ücretlendirme' },
              { href: '/hakkimizda', label: 'Hakkımızda' },
              { href: '/iletisim', label: 'İletişim' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 min-h-[48px] flex items-center
                  ${navScrolled
                    ? 'text-[#0f2847] hover:bg-amber-50 hover:text-amber-600'
                    : 'text-white hover:bg-white/15 hover:text-amber-200'}`}
              >
                <ChevronRight className="w-4 h-4 mr-2 opacity-60" />
                {link.label}
              </Link>
            ))}
            {/* Mobile Giriş Yap CTA */}
            <Link
              href="/giris"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-extrabold min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 active:scale-[0.97] transition-all"
            >
              <Lock className="w-4 h-4" />
              Giriş Yap
            </Link>
          </div>
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

          {/* Hero CTAs — Testleri Keşfet + Giriş Yap */}
          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <a href="#testler"
              className="touch-feedback group relative px-6 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-extrabold shadow-xl shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-2 sm:gap-2.5 text-[13px] sm:text-[15px] tracking-wide overflow-hidden w-full sm:w-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">TESTLERİ KEŞFET</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
            </a>

            <Link href="/giris"
              className="touch-feedback group relative px-6 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all flex items-center justify-center gap-2 sm:gap-2.5 text-[13px] sm:text-[15px] tracking-wide overflow-hidden w-full sm:w-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition" />
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
              <span className="relative z-10">GİRİŞ YAP</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
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
            <button key={h.title}
              type="button"
              onClick={() => setActiveHighlight(h.key)}
              aria-label={`${h.title} — örnek içeriği aç`}
              className={`group cursor-pointer text-left w-full bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border p-6 shadow-sm text-center
                hover:-translate-y-2 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-300 ${h.color}
                ${highlights.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: highlights.visible ? `${i * 100}ms` : '0ms' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 dark:border-slate-700/60 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <h.icon className="w-7 h-7" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0f2847] dark:text-slate-100 mb-2">{h.title}</h3>
              <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-relaxed">{h.desc}</p>
              <p className="mt-3 text-[12px] font-semibold text-amber-700 dark:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                Örneği gör →
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHT MODALS ═══ */}
      <HighlightModals active={activeHighlight} onClose={() => setActiveHighlight(null)} />

      {/* ═══ TESTS ═══ */}
      <section id="testler" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 scroll-mt-20" ref={tests.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Testlerimiz</h2>
          <p className="mt-3 text-white/90 dark:text-slate-300 text-lg max-w-xl mx-auto font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-[float-text_3s_ease-in-out_infinite]">Bilimsel temelli 10 farklı psikometrik test ile kapsamlı öğrenci profili</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TESTS.map((t, i) => {
            const isActive = activeTestIdx === i;
            return (
            <div key={t.name}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTestIdx(isActive ? null : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTestIdx(isActive ? null : i);
                }
              }}
              aria-expanded={isActive}
              aria-label={`${t.name} - detayları ${isActive ? 'gizle' : 'göster'}`}
              className={`test-card group bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 border-l-[3px] ${t.border} p-5 shadow-sm cursor-pointer
                hover:-translate-y-1.5 hover:shadow-xl hover:border-l-[5px] hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all duration-300
                ${isActive ? '-translate-y-1.5 shadow-xl border-l-[5px] bg-white/90 dark:bg-slate-800/80' : ''}
                ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: tests.visible ? `${i * 80}ms` : '0ms' }}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg shrink-0 transition-all duration-300
                  group-hover:rotate-[5deg] group-hover:scale-110 group-hover:shadow-xl
                  ${isActive ? 'rotate-[5deg] scale-110 shadow-xl' : ''}`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#0f2847] dark:text-slate-100">{t.name}</h3>
                    <span className="text-[12px] text-gray-400 dark:text-slate-500 font-semibold bg-gray-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-full shrink-0 ml-2">{t.count}</span>
                  </div>
                  <p className={`text-[13px] mt-1 transition-colors duration-200 dark:text-slate-300
                    ${isActive ? 'text-gray-700 dark:text-slate-300' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-700'}`}>{t.desc}</p>
                </div>
              </div>

              {/* ═══ Açılan içerik: hover (desktop) VEYA click (mobile/desktop) ═══ */}
              <div className={`overflow-hidden transition-[max-height] duration-500 ease-out
                ${isActive ? 'max-h-[400px]' : 'max-h-0 group-hover:max-h-[400px]'}`}>
                <div className={`mt-4 pt-4 border-t border-gray-200/60 dark:border-slate-700/50 space-y-3 transition-opacity duration-300 delay-150
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Amaç
                    </p>
                    <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">{t.purpose}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" /> Ne Ölçer?
                    </p>
                    <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">{t.measures}</p>
                  </div>
                  {!TRIAL_AVAILABLE.includes(t.id) && (
                    <Link
                      href="/paketler"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${t.name} - üyelere özel, paketleri gör`}
                      className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all border border-slate-500/40 hover:from-amber-600 hover:to-orange-700"
                    >
                      <Lock className="w-4 h-4" />
                      Paketlerde Mevcut
                      <span className="text-[9px] font-extrabold bg-amber-400/30 text-amber-100 backdrop-blur-md px-2 py-0.5 rounded-full tracking-[0.08em] ml-1">ÜYELERE ÖZEL</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {TRIAL_AVAILABLE.includes(t.id) && (
                    <Link
                      href={`/trial/${t.id}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${t.name} ücretsiz test dene`}
                      className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all border border-amber-400/40"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ücretsiz Test Dene
                      <span className="text-[9px] font-extrabold bg-white/30 backdrop-blur-md px-2 py-0.5 rounded-full tracking-[0.08em] ml-1 animate-pulse">HAZIR</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
            );
          })}
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
        <div
          className="relative overflow-hidden rounded-3xl border border-amber-200/25 backdrop-blur-[3px] p-10 sm:p-14 text-center shadow-2xl shadow-amber-950/40"
          style={{
            background:
              'linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(249,115,22,0.06) 50%, rgba(244,63,94,0.10) 100%)',
          }}
        >
          {/* Center radial vignette — yazılar için kontrast (videoyla uyumlu, sadece merkezi koyulaştırır) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(15,40,71,0.35) 0%, rgba(15,40,71,0.15) 40%, transparent 75%)',
            }}
          />
          {/* Warm decorative blobs — daha belirgin ki "kart" hissi kalsın */}
          <div className="absolute top-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-amber-400/30 blur-3xl animate-[pulse-glow_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full bg-rose-400/30 blur-3xl animate-[pulse-glow_5s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-orange-400/15 blur-3xl" />

          {/* Başlık — geniş paletli, dinamik gradient kayması + drop-shadow */}
          <h2
            className="relative text-2xl sm:text-3xl lg:text-4xl font-black inline-block bg-gradient-to-r from-amber-200 via-yellow-100 via-pink-200 via-orange-200 to-rose-200 bg-clip-text text-transparent bg-[length:300%_auto] animate-[gradient-shift_5s_ease-in-out_infinite] mb-4"
            style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.55))' }}
          >
            Öğrencilerinizin Potansiyelini Keşfedin
          </h2>

          {/* Alt yazı — beyaz/amber/beyaz döngülü, float ile bağlı */}
          <p
            className="relative max-w-xl mx-auto font-bold bg-gradient-to-r from-white via-amber-100 via-white via-amber-100 to-white bg-clip-text text-transparent bg-[length:250%_auto] animate-[gradient-shift_6s_ease-in-out_infinite,float-text_3s_ease-in-out_infinite]"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.65))' }}
          >
            Bilimsel testler ve detaylı analizler ile her öğrenciyi bireysel olarak tanıyın.
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/15" ref={footer.ref}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500 ${footer.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Yasal linkler — küçük puntolarla */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/95 font-semibold drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
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
