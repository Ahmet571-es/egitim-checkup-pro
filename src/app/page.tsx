'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GraduationCap, Brain, Eye, Compass, Lightbulb, AlertTriangle,
  BookOpen, BarChart3, Focus, SplitSquareHorizontal, ArrowRight,
  CheckCircle2, Sparkles, Users, FileText, ChevronRight, Mail, Shield,
  Zap, TrendingUp, Award, UserCheck, School, ClipboardList
} from 'lucide-react';
import { useScrollReveal, useCountUp } from '@/hooks/useScrollReveal';

/* ═══ DATA ═══ */
const TESTS = [
  { name: 'Enneagram Kişilik', desc: '9 kişilik tipi derinlemesine analizi', count: '180 soru', icon: Brain, color: 'from-violet-500 to-purple-600', border: 'border-l-violet-500' },
  { name: 'VARK Öğrenme Stilleri', desc: 'Görsel, İşitsel, Okuma-Yazma, Kinestetik', count: '16 soru', icon: Eye, color: 'from-sky-500 to-blue-600', border: 'border-l-sky-500' },
  { name: 'Holland RIASEC', desc: '6 mesleki ilgi alanı ve kariyer yönlendirme', count: '84 soru', icon: Compass, color: 'from-emerald-500 to-teal-600', border: 'border-l-emerald-500' },
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
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      {/* ═══ NAVBAR ═══ */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        navScrolled
          ? 'bg-white/92 backdrop-blur-2xl border-gray-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-white/60 backdrop-blur-xl border-white/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ana sayfaya git" className="flex items-center gap-2.5 hover:scale-[1.03] transition-transform duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight">Eğitim Check-Up</span>
          </Link>

        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[800px] h-[800px] top-[-200px] right-[-200px] opacity-30"
               style={{ background: 'conic-gradient(from 0deg at 50% 50%, #10b98122, #3b82f622, #8b5cf622, #10b98122)', animation: 'mesh-rotate 20s linear infinite', filter: 'blur(80px)' }} />
        </div>
        <div className="absolute top-[-200px] right-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 blur-3xl pointer-events-none blob-float" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/15 blur-3xl pointer-events-none blob-float-delay" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-200/20 to-purple-200/10 blur-3xl pointer-events-none blob-float-delay2" />
        {/* Aurora flowing lights */}
        <div className="absolute top-[10%] left-[-20%] w-[900px] h-[300px] bg-gradient-to-r from-emerald-300/15 via-teal-200/10 to-cyan-300/15 blur-3xl pointer-events-none aurora rounded-full" />
        <div className="absolute bottom-[5%] right-[-15%] w-[700px] h-[250px] bg-gradient-to-r from-blue-300/10 via-violet-200/10 to-purple-300/10 blur-3xl pointer-events-none aurora-delay rounded-full" />
        <FloatingParticles />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-28 text-center">
          <div className="hero-badge inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-lg border border-white/50 shadow-sm mb-8">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-[13px] font-semibold text-gray-600">10 Bilimsel Test · Detaylı Analiz · 4 Panel</span>
          </div>

          <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0f2847] leading-tight tracking-tight max-w-4xl mx-auto">
            <span className="hero-word-1 inline-block animate-[float-text_3s_ease-in-out_infinite]">Öğrencilerinizi </span>
            <br className="hidden sm:block" />
            <span className="hero-word-2 hero-word-3 inline-block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] hover:scale-[1.05] transition-transform duration-500 cursor-default">
              Gerçekten Tanıyın
            </span>
          </h1>

          <div className="hero-subtitle mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed min-h-[56px] flex flex-wrap items-center justify-center gap-x-1.5">
            <span>Psikometrik testler ile öğrencilerinizin</span>
            <TypingText
              words={['potansiyeli keşfedin', 'kariyer yolunu çizin', 'gelişimi takip edin', 'öğrenme stilini belirleyin']}
              className="text-emerald-600 font-semibold"
            />
          </div>

          {/* Giriş Butonları */}
          <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"
              className="touch-feedback group px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.04] active:scale-[0.97] transition-all flex items-center gap-3 text-[16px] pulse-glow">
              <GraduationCap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              ÖĞRENCİ GİRİŞİ
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link href="/login/ogretmen"
              className="touch-feedback group px-10 py-4 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/50 text-[#0f2847] font-bold shadow-sm hover:shadow-lg hover:bg-white/80 hover:scale-[1.04] active:scale-[0.97] transition-all text-[16px] inline-flex items-center gap-3">
              <School className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-300" />
              ÖĞRETMEN GİRİŞİ
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
            <Link href="/yonetici"
              className="touch-feedback group px-10 py-4 rounded-2xl bg-[#0f2847]/90 backdrop-blur-lg border border-[#0f2847]/20 text-white font-bold shadow-sm hover:shadow-lg hover:bg-[#0f2847] hover:scale-[1.04] active:scale-[0.97] transition-all text-[16px] inline-flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors duration-300" />
              YÖNETİCİ GİRİŞİ
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          </div>

          <div className="hero-trust mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-gray-400">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> KVKK Uyumlu</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Detaylı Analiz Raporları</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Bilimsel Temelli</span>
          </div>
        </div>
      </section>

      {/* ═══ ANIMATED MARQUEE ═══ */}
      <section className="relative -mt-6 z-10 overflow-hidden py-6">
        <div className="flex animate-marquee whitespace-nowrap gap-6">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-6 shrink-0">
              {[
                { emoji: '🧠', text: 'Enneagram Kişilik', color: 'from-violet-500 to-purple-600' },
                { emoji: '📖', text: 'VARK Öğrenme Stili', color: 'from-sky-500 to-blue-600' },
                { emoji: '🧭', text: 'Holland Kariyer', color: 'from-emerald-500 to-teal-600' },
                { emoji: '🎯', text: 'Çoklu Zeka Analizi', color: 'from-amber-500 to-orange-600' },
                { emoji: '📝', text: 'Sınav Kaygısı Ölçeği', color: 'from-rose-500 to-pink-600' },
                { emoji: '📚', text: 'Çalışma Davranışı', color: 'from-lime-500 to-green-600' },
                { emoji: '🔬', text: 'Akademik Analiz', color: 'from-cyan-500 to-sky-600' },
                { emoji: '⚡', text: 'P2 Dikkat Testi', color: 'from-indigo-500 to-violet-600' },
                { emoji: '🧩', text: 'Sağ-Sol Beyin', color: 'from-fuchsia-500 to-pink-600' },
                { emoji: '📖', text: 'Hızlı Okuma', color: 'from-teal-500 to-emerald-600' },
              ].map((item) => (
                <div key={`${setIdx}-${item.text}`} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${item.color} text-white text-[13px] font-bold shadow-lg hover:scale-105 transition-transform cursor-default`}>
                  <span className="text-lg">{item.emoji}</span>
                  {item.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHTS ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24" ref={highlights.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${highlights.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Neden Eğitim Check-Up?</h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">Öğrencilerinizi tanımanın en kapsamlı ve akıllı yolu</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {HIGHLIGHTS.map((h, i) => (
            <div key={h.title}
              className={`group bg-white/70 backdrop-blur-xl rounded-2xl border p-6 shadow-sm text-center
                hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ${h.color}
                ${highlights.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: highlights.visible ? `${i * 100}ms` : '0ms' }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <h.icon className="w-7 h-7" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0f2847] mb-2">{h.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTS ═══ */}
      <section id="testler" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 scroll-mt-20" ref={tests.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Testlerimiz</h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">Bilimsel temelli 10 farklı psikometrik test ile kapsamlı öğrenci profili</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TESTS.map((t, i) => (
            <div key={t.name}
              className={`test-card group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 border-l-[3px] ${t.border} p-5 shadow-sm
                hover:-translate-y-1.5 hover:shadow-lg hover:border-l-[5px] transition-all duration-300
                ${tests.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: tests.visible ? `${i * 80}ms` : '0ms' }}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-[5deg] group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#0f2847]">{t.name}</h3>
                    <span className="text-[12px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-full shrink-0 ml-2">{t.count}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1 group-hover:text-gray-700 transition-colors duration-200">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" ref={steps.ref}>
        <div className={`text-center mb-14 transition-all duration-500 ${steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Nasıl Çalışır?</h2>
          <p className="mt-3 text-gray-500 text-lg">3 adımda profesyonel öğrenci analizi</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute top-[56px] left-[16.7%] right-[16.7%] h-[2px] overflow-hidden z-0">
            <div className={`h-full bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 transition-all duration-1000 ${steps.visible ? 'w-full' : 'w-0'}`}
                 style={{ transitionDelay: '300ms' }} />
          </div>
          {STEPS.map((s, i) => (
            <div key={s.num}
              className={`relative z-10 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-7 shadow-sm text-center
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                ${steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: steps.visible ? `${i * 150}ms` : '0ms' }}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg ${steps.visible ? 'animate-[icon-pulse_2s_ease-in-out_infinite]' : ''}`}
                   style={{ animationDelay: `${i * 500}ms` }}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-[12px] font-bold text-gray-300 mb-2 tracking-wider">ADIM {s.num}</div>
              <h3 className="text-lg font-bold text-[#0f2847] mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TRUST BADGES (Animated) ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Güvenle Kullanın</h2>
          <p className="mt-3 text-gray-500 text-lg">Eğitim psikolojisi standartlarına uygun altyapı</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'KVKK Uyumlu', desc: 'Veriler güvenle saklanır', gradient: 'from-sky-500 to-blue-600' },
            { icon: '🧪', title: 'Bilimsel Testler', desc: 'Geçerlilik-güvenirlik kanıtlı', gradient: 'from-violet-500 to-purple-600' },
            { icon: '📊', title: 'Anlık Raporlar', desc: '3 format: öğretmen · öğrenci · veli', gradient: 'from-amber-500 to-orange-600' },
          ].map((item, i) => (
            <div
              key={item.title}
              className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 text-center shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative">
                <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">{item.icon}</div>
                <h3 className="text-[15px] font-extrabold text-[#0f2847] mb-1">{item.title}</h3>
                <p className="text-[12px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f2847] via-[#1a3a5c] to-[#0f2847] p-10 sm:p-14 text-center shadow-2xl">
          <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-teal-500/10 blur-2xl" />
          <h2 className="relative text-2xl sm:text-3xl font-extrabold text-white mb-4">Öğrencilerinizin Potansiyelini Keşfedin</h2>
          <p className="relative text-gray-300 max-w-lg mx-auto">Bilimsel testler ve detaylı analizler ile her öğrenciyi bireysel olarak tanıyın.</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-gray-200/50 bg-white/40 backdrop-blur-lg" ref={footer.ref}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500 ${footer.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[#0f2847]">Eğitim Check-Up</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/kvkk" className="footer-link hover:text-[#0f2847] transition-colors flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> KVKK
              </Link>
              <a href="mailto:info@egitimcheckup.com" className="footer-link hover:text-[#0f2847] transition-colors flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> info@egitimcheckup.com
              </a>
            </div>
            <p className="text-xs text-gray-400">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
