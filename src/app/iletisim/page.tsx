'use client';
/**
 * Faz 1: İletişim sayfası
 * Public page — proxy.ts PUBLIC_PATHS içerisinde '/iletisim' eklenmiş.
 *
 * NOT: İletişim formu Faz 4'te Resend entegrasyonu ile aktive olacak.
 * Şimdilik doğrudan e-posta linki ile çalışır.
 */
import Link from 'next/link';
import {
  ArrowLeft, GraduationCap, Mail, Shield, MapPin, Phone, MessageCircle,
  Sparkles, Clock, Users
} from 'lucide-react';

export default function ContactPage() {
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
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold text-[#0f2847]">İletişim</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f2847] mb-5 leading-tight">
          Bize Ulaşın
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Sorularınız, paket bilgisi talepleriniz veya kurumsal işbirlikleri için bizimle iletişime geçebilirsiniz. En geç 1 iş günü içinde dönüş yaparız.
        </p>
      </section>

      {/* İletişim kanalları */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* E-posta */}
          <a
            href="mailto:info@egitimcheckup.com"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-7 hover:-translate-y-1 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-md group-hover:rotate-6 transition-transform">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0f2847] mb-1">E-posta</h3>
            <p className="text-emerald-600 font-bold text-sm mb-1 break-all">info@egitimcheckup.com</p>
            <p className="text-xs text-gray-500">Genel sorular ve bilgi talepleri için</p>
          </a>

          {/* KVKK */}
          <a
            href="mailto:kvkk@egitimcheckup.com"
            className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-7 hover:-translate-y-1 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 shadow-md group-hover:rotate-6 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0f2847] mb-1">KVKK Başvuruları</h3>
            <p className="text-sky-600 font-bold text-sm mb-1 break-all">kvkk@egitimcheckup.com</p>
            <p className="text-xs text-gray-500">Veri işleme, silme ve düzeltme talepleri için</p>
          </a>
        </div>
      </section>

      {/* Kurumsal bilgi */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0f2847]">Kurumsal Bilgiler</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#0f2847] mb-0.5">Platform Sağlayıcısı</div>
                <div className="text-gray-600">Otonom Reklam Ajansı</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#0f2847] mb-0.5">Adres</div>
                <div className="text-gray-600">Ankara, Türkiye</div>
                <div className="text-xs text-gray-400 mt-1 italic">Detaylı adres yakında eklenecek.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <Phone className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#0f2847] mb-0.5">Telefon</div>
                <div className="text-gray-400 italic text-xs">Yakında eklenecek.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#0f2847] mb-0.5">Çalışma Saatleri</div>
                <div className="text-gray-600">Pazartesi – Cuma: 09:00 – 18:00</div>
                <div className="text-xs text-gray-500 mt-1">E-posta destek 7/24 alınır, hafta içi yanıtlanır.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yanıt süresi notu */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-emerald-50/60 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-6 text-center">
          <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-[#0f2847] mb-2">Yanıt Süremiz</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Tüm e-posta başvurularına en geç <strong>1 iş günü</strong> içinde dönüş yapıyoruz.<br />
            KVKK kapsamındaki başvurular yasal olarak 30 gün içinde sonuçlandırılır.
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
          </div>
          <p className="text-xs text-gray-400 mt-3">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
