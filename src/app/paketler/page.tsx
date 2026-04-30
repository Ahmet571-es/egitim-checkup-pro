/**
 * Faz 1: Hizmet Paketleri sayfası
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/paketler' eklenmiş.
 * Server component (interactivity yok) — SEO için metadata export edilebilir.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Sparkles, Brain, GraduationCap, Target, Compass, Crown,
  CheckCircle2, Mail, Shield
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hizmet Paketleri | Eğitim Check-Up',
  description: 'Okul öncesinden üniversiteye kadar 5 farklı paket: Potansiyel & Mizaç, Akademik Performans, Sınav Strateji, Kariyer & Gelecek ve VIP Tam Kapsamlı.',
  alternates: { canonical: 'https://egitim-checkup.com/paketler' },
};

type Package = {
  id: string;
  name: string;
  audience: string;
  tests: string[];
  goal: string;
  priceTry: number;
  icon: typeof Brain;
  gradient: string;
  border: string;
  badge?: string;
};

const PACKAGES: Package[] = [
  {
    id: 'potansiyel-mizac',
    name: 'Potansiyel & Mizaç Paketi',
    audience: 'Okul Öncesi ve İlkokul (Keşif Odaklı)',
    tests: ['Genetik Test (Dermatoglifik)', 'Enneagram (Mizaç)', 'Çoklu Zekâ Testi'],
    goal: 'Çocuğun doğuştan gelen donanımını, yetenek alanlarını ve mizaç yapısını keşfederek doğru ebeveynlik ve eğitim dilini belirlemek.',
    priceTry: 5500,
    icon: Brain,
    gradient: 'from-violet-500 to-purple-600',
    border: 'border-l-violet-500',
  },
  {
    id: 'akademik-performans',
    name: 'Akademik Performans Paketi',
    audience: 'Ortaokul ve Lise (Başarı Odaklı)',
    tests: [
      'Akademik Analiz (Okuma / Matematik / Mantık)',
      'D2 Dikkat Testi',
      'Öğrenme Stilleri Testi',
      'Çalışma Davranışı Ölçme Ölçeği',
      'Çoklu Zekâ Testi',
    ],
    goal: 'Öğrencinin mevcut akademik seviyesini, bilişsel hızını ve öğrenme stilini ölçerek ders başarısını artıracak stratejiler geliştirmek.',
    priceTry: 8000,
    icon: GraduationCap,
    gradient: 'from-sky-500 to-blue-600',
    border: 'border-l-sky-500',
  },
  {
    id: 'sinav-strateji',
    name: 'Sınav Strateji Paketi',
    audience: 'LGS & YKS Grubu (Sonuç Odaklı)',
    tests: [
      'Sınav Kaygısı Ölçme Ölçeği',
      'Çalışma Davranışı Ölçme Ölçeği',
      'D2 Dikkat Testi',
      'Akademik Analiz',
    ],
    goal: 'Sınav maratonundaki öğrencinin kaygısını yönetmek, çalışma verimini artırmak ve odaklanma sorunlarını minimize etmek.',
    priceTry: 7000,
    icon: Target,
    gradient: 'from-rose-500 to-red-600',
    border: 'border-l-rose-500',
  },
  {
    id: 'kariyer-gelecek',
    name: 'Kariyer & Gelecek Paketi',
    audience: 'Lise ve Üniversite Hazırlık',
    tests: [
      'Meslek Testi (Mesleki Yatkınlık)',
      'Genetik Test (Mesleki Eğilimler)',
      'Enneagram (Kariyer Hattı)',
    ],
    goal: 'Bireyin kişilik özelliklerine ve genetik yatkınlıklarına en uygun mesleği seçmesini sağlamak.',
    priceTry: 6500,
    icon: Compass,
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-l-emerald-500',
  },
  {
    id: 'vip-tam-kapsamli',
    name: 'VIP Tam Kapsamlı Eğitim Check-Up Paketi',
    audience: 'Tüm Öğrenciler (Bütünsel Analiz)',
    tests: ['Envanterdeki 11 Testin Tamamı', 'Genetik Rapor', 'Bütüncül Uzman Yorumu'],
    goal: 'Öğrenciyi 360 derece analiz eden, tüm verilerin uzman heyet tarafından karşılaştırmalı yorumlandığı en üst düzey "Check-Up" deneyimi.',
    priceTry: 16000,
    icon: Crown,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    border: 'border-l-amber-500',
    badge: 'EN KAPSAMLI',
  },
];

function formatPrice(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      {/* Üst nav */}
      <nav className="sticky top-0 z-50 border-b border-white/40 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Ana sayfaya git" className="flex items-center gap-2.5 min-h-[44px] hover:scale-[1.03] transition-transform duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Eğitim Check-Up</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#0f2847] flex items-center gap-1.5 py-2 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-md mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold text-[#0f2847]">Hizmet Paketlerimiz</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f2847] mb-4 leading-tight">
          Her Yaş ve İhtiyaç İçin
          <br />
          <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Doğru Paket
          </span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Okul öncesinden üniversiteye kadar, öğrencinin gelişim aşamasına ve hedefine göre özel olarak tasarlanmış 5 farklı paket.
        </p>
      </section>

      {/* Paket kartları */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              className={`group relative bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/40 border-l-[4px] ${pkg.border} p-7 shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-l-[6px] transition-all duration-300 ${pkg.id === 'vip-tam-kapsamli' ? 'md:col-span-2' : ''}`}
            >
              {pkg.badge && (
                <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[11px] font-extrabold shadow-md tracking-wider">
                  {pkg.badge}
                </div>
              )}

              <div className="flex items-start gap-4 mb-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-[5deg] group-hover:scale-110 transition-all duration-300`}>
                  <pkg.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100 leading-tight">{pkg.name}</h2>
                  <p className="text-[13px] text-gray-500 mt-1">{pkg.audience}</p>
                </div>
              </div>

              <div className="mb-5">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">İçerdiği Testler & Araçlar</h3>
                <ul className="space-y-1.5">
                  {pkg.tests.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-6 italic">
                {pkg.goal}
              </p>

              <div className="flex items-end justify-between border-t border-gray-100 dark:border-slate-700/60 pt-5">
                <div>
                  <div className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider">Paket Ücreti</div>
                  <div className="text-3xl font-extrabold text-[#0f2847] dark:text-slate-100 mt-1">
                    ₺{formatPrice(pkg.priceTry)}
                  </div>
                </div>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0f2847] text-white text-sm font-bold hover:bg-[#1a3a5f] transition-colors min-h-[44px]"
                >
                  Bilgi Al <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tek tek test fiyatlandırması bilgisi */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            Tek tek test ve uzman seansı ücretleri için{' '}
            <Link href="/pricing" className="text-emerald-600 font-bold hover:underline">
              ücretlendirme sayfamızı
            </Link>{' '}
            ziyaret edebilirsiniz.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
            <Link href="/kvkk" className="hover:text-[#0f2847] inline-flex items-center gap-1"><Shield className="w-3 h-3" /> KVKK</Link>
            <span>·</span>
            <Link href="/gizlilik-politikasi" className="hover:text-[#0f2847]">Gizlilik Politikası</Link>
            <span>·</span>
            <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-[#0f2847]">Mesafeli Satış Sözleşmesi</Link>
            <span>·</span>
            <Link href="/iade-ve-teslimat-sartlari" className="hover:text-[#0f2847]">İade ve Teslimat</Link>
            <span>·</span>
            <a href="mailto:info@egitimcheckup.com" className="hover:text-[#0f2847] inline-flex items-center gap-1"><Mail className="w-3 h-3" /> info@egitimcheckup.com</a>
          </div>
          <p className="text-xs text-gray-400 mt-3">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
