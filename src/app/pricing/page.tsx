'use client';
/**
 * Faz 1: Ücretlendirme sayfası
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/pricing' önceden mevcut.
 */
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Receipt, Sparkles, Crown, Tag, GraduationCap,
  Mail, Shield, Package
} from 'lucide-react';

type SinglePrice = { name: string; priceTry: number };

const SINGLE_TESTS: SinglePrice[] = [
  { name: 'Genetik Test', priceTry: 3000 },
  { name: 'Akademik Analiz', priceTry: 2000 },
  { name: 'D2 Dikkat Testi', priceTry: 1500 },
  { name: 'Sağ-Sol Beyin Yatkınlığı Testi', priceTry: 500 },
  { name: 'Sınav Kaygısı Ölçme Ölçeği', priceTry: 2000 },
  { name: 'Çalışma Davranışı Ölçme Ölçeği', priceTry: 1500 },
  { name: 'Meslek Testi', priceTry: 1500 },
  { name: 'Enneagram Kişilik Testi', priceTry: 2000 },
  { name: 'Çoklu Zekâ Testi', priceTry: 1500 },
  { name: 'Öğrenme Stilleri Testi', priceTry: 500 },
];

const EXTRA_SERVICES: SinglePrice[] = [
  { name: 'Toplu Rapor', priceTry: 16000 },
  { name: 'Uzman Seansı + Rapor', priceTry: 20000 },
];

function formatPrice(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

export default function PricingPage() {
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
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold text-[#0f2847]">Ücretlendirme</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f2847] mb-4 leading-tight">
          Şeffaf ve Esnek
          <br />
          <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Fiyatlandırma
          </span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          İhtiyacınıza göre paket seçin veya tek tek test alın. Tüm fiyatlar KDV dahildir.
        </p>
      </section>

      {/* Kampanya banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-7 sm:p-9 text-white shadow-2xl">
          <div className="absolute top-[-30px] right-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-[-20px] left-[-20px] w-[150px] h-[150px] rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Tag className="w-7 h-7" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-extrabold tracking-widest opacity-90 mb-1">SINIRLI SÜRELİ KAMPANYA</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Toplu Rapor &nbsp;&middot;&nbsp; ₺14.000</h2>
              <p className="text-sm opacity-90">
                <span className="line-through opacity-75">₺16.000</span>{' '}
                <span className="font-bold">₺14.000</span> &mdash; Detaylı uzman yorumları içeren toplu rapor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Paketleri öne çıkar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-gradient-to-br from-[#0f2847] via-[#1a3a5c] to-[#0f2847] rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-emerald-400" />
                <span className="text-[12px] font-extrabold tracking-widest text-emerald-300">EN UYGUN SEÇİM</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">5 Hazır Paketimizden Birini Seçin</h2>
              <p className="text-gray-300 text-sm">
                Yaş grubuna ve hedefe göre tasarlanmış paketler ile ₺5.500&apos;den başlayan fiyatlarla başlayın.
              </p>
            </div>
            <Link
              href="/paketler"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm transition-colors min-h-[44px] shadow-lg whitespace-nowrap"
            >
              Paketleri İncele <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tekil test fiyatları */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#0f2847] mb-2">Tek Tek Test Fiyatları</h2>
          <p className="text-gray-500">Yalnızca ihtiyacınız olan testi seçin.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {SINGLE_TESTS.map((t) => (
              <li key={t.name} className="flex items-center justify-between px-6 py-4 hover:bg-emerald-50/40 transition-colors">
                <span className="text-[15px] font-semibold text-[#0f2847]">{t.name}</span>
                <span className="text-lg font-extrabold text-emerald-600">₺{formatPrice(t.priceTry)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ek hizmetler */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#0f2847] mb-2 flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> Ek Hizmetler
          </h2>
          <p className="text-gray-500">Uzman değerlendirmesi ve kapsamlı raporlama.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {EXTRA_SERVICES.map((s) => (
            <div key={s.name} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-extrabold text-[#0f2847]">{s.name}</h3>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">₺{formatPrice(s.priceTry)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-8 text-center">
          <h3 className="text-xl font-extrabold text-[#0f2847] mb-3">Sorularınız mı var?</h3>
          <p className="text-sm text-gray-600 mb-5">
            Size en uygun paketi seçmenize yardımcı olalım. Bize ulaşın, ihtiyacınızı dinleyelim.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2847] hover:bg-[#1a3a5f] text-white font-extrabold text-sm transition-colors min-h-[44px]"
          >
            İletişim <ArrowRight className="w-4 h-4" />
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
            <span>·</span>
            <a href="mailto:info@egitimcheckup.com" className="hover:text-[#0f2847] inline-flex items-center gap-1"><Mail className="w-3 h-3" /> info@egitimcheckup.com</a>
          </div>
          <p className="text-xs text-gray-400 mt-3">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
