/**
 * Faz 1: Hakkımızda sayfası
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/hakkimizda' eklenmiş.
 * Server component (interactivity yok).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Mail, Shield, Brain, Heart, Target, Award,
  Users, BookOpen, Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hakkımızda | Eğitim Check-Up',
  description: 'Eğitim Check-Up Pro: Psikometrik testler ve yapay zekâ analizi ile öğrencilerin potansiyellerini, öğrenme stillerini ve ihtiyaçlarını anlamak için tasarlanmış bilimsel bir platform.',
  alternates: { canonical: 'https://egitim-checkup.com/hakkimizda' },
};

const VALUES = [
  {
    icon: Brain,
    title: 'Bilimsel Temel',
    desc: 'Tüm testlerimiz uluslararası geçerliliği ve güvenirliği kanıtlanmış ölçeklere dayanır. Spekülasyon değil, veriyle çalışırız.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Heart,
    title: 'Çocuk Odaklı',
    desc: 'Her öğrenci biriciktir. Karşılaştırma değil, kendi gelişimi içinde nerede olduğunu anlamasına odaklanırız. Etiketleme yapmayız.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    icon: Target,
    title: 'Eyleme Dönük',
    desc: 'Rapor üretmek yetmez. Her analizimiz öğretmene, veliye ve öğrenciye somut adımlar sunar.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield,
    title: 'KVKK Uyumlu',
    desc: 'Çocuk verileri özel olarak hassastır. Asgari veri ilkesi ve rol bazlı erişim kontrolü ile çalışırız.',
    gradient: 'from-sky-500 to-blue-600',
  },
];

const STATS = [
  { value: '11', label: 'Bilimsel Test' },
  { value: '4', label: 'Kullanıcı Paneli' },
  { value: 'AI', label: 'Destekli Analiz' },
  { value: 'KVKK', label: 'Uyumlu Altyapı' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      {/* Üst nav */}
      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 min-h-[44px] hover:scale-[1.03] transition-transform duration-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight">Eğitim Check-Up</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#0f2847] flex items-center gap-1.5 py-2 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-md mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold text-[#0f2847]">Hakkımızda</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f2847] mb-5 leading-tight">
          Her Öğrenciyi
          <br />
          <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Gerçekten Tanımak
          </span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Eğitim Check-Up Pro, psikometrik testler ve yapay zekâ analizi ile öğrencilerin potansiyellerini, öğrenme stillerini ve ihtiyaçlarını anlamak için tasarlanmış bir platformdur.
        </p>
      </section>

      {/* İstatistik şeridi */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Misyonumuz */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0f2847]">Misyonumuz</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Geleneksel eğitim sistemi sıklıkla öğrencileri ortak bir kalıba sokar; herkesin aynı hızda öğrendiğini, aynı yöntemden faydalandığını varsayar. Oysa bilim açıkça göstermektedir: her öğrenci farklı bir bilişsel profil, farklı bir öğrenme stili ve farklı bir kişilik yapısına sahiptir.
            </p>
            <p>
              Eğitim Check-Up Pro, öğretmenlere, ailelere ve okul yöneticilerine bu farklılıkları ölçülebilir hale getiren bilimsel araçlar sunar. Amacımız, her çocuğun kendi gerçek potansiyeline ulaşabilmesi için doğru yönlendirmeyi mümkün kılmaktır.
            </p>
            <p>
              Bunu yaparken üç ilkeden taviz vermiyoruz: bilimsel temelden, çocuğun mahremiyetinden ve eyleme dönük geri bildirimden.
            </p>
          </div>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-[#0f2847] mb-2">Değerlerimiz</h2>
          <p className="text-gray-500">İşimizi şekillendiren temel ilkeler</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <v.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold text-[#0f2847] mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Şirket bilgisi */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0f2847]">Kurumsal Bilgi</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-bold text-[#0f2847]">Platform Sağlayıcısı:</span>{' '}
              Otonom Reklam Ajansı, Ankara
            </div>
            <div>
              <span className="font-bold text-[#0f2847]">İletişim:</span>{' '}
              <a href="mailto:info@egitimcheckup.com" className="text-emerald-600 hover:underline">info@egitimcheckup.com</a>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              Detaylı kurumsal bilgi (vergi numarası, MERSIS no, KEP adresi vb.) yasal sayfalarda yer almaktadır.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-[#0f2847] via-[#1a3a5c] to-[#0f2847] rounded-3xl p-8 text-white text-center shadow-2xl">
          <Users className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
          <h3 className="text-xl font-extrabold mb-2">Bize Ulaşın</h3>
          <p className="text-sm text-gray-300 mb-5 max-w-md mx-auto">
            Okulunuz veya ailenize özel çözümler için bizimle iletişime geçebilirsiniz.
          </p>
          <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm transition-colors min-h-[44px]">
            İletişim Sayfası <Mail className="w-4 h-4" />
          </Link>
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
          </div>
          <p className="text-xs text-gray-400 mt-3">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
