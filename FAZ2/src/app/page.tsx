import Link from 'next/link';
import {
  GraduationCap, Brain, Eye, Compass, Lightbulb, AlertTriangle,
  BookOpen, BarChart3, Focus, SplitSquareHorizontal, ArrowRight,
  CheckCircle2, Sparkles, Users, FileText, ChevronRight, Mail, Shield
} from 'lucide-react';

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
  { num: '01', title: 'Okulunuzu Kaydedin', desc: '14 gün ücretsiz deneme ile hemen başlayın. Kurulum 5 dakika.', gradient: 'from-emerald-500 to-teal-600' },
  { num: '02', title: 'Testleri Atayın', desc: 'Sınıflarınızı oluşturun, öğrencilere testleri tek tıkla atayın.', gradient: 'from-sky-500 to-blue-600' },
  { num: '03', title: 'AI Raporunu Alın', desc: 'Yapay zekâ destekli detaylı analizler ve kişiselleştirilmiş öneriler.', gradient: 'from-violet-500 to-purple-600' },
];

const PLANS = [
  { name: 'Başlangıç', students: '50 öğrenci', price: '4.999', popular: false },
  { name: 'Profesyonel', students: '200 öğrenci', price: '14.999', popular: true },
  { name: 'Kurumsal', students: 'Sınırsız öğrenci', price: '29.999', popular: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[15px] font-extrabold text-[#0f2847] tracking-tight">Eğitim Check-Up</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#0f2847] transition-colors">Giriş Yap</Link>
            <Link href="/register" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">Ücretsiz Başla</Link>
          </div>
          <Link href="/login" className="sm:hidden px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold">Giriş</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-[-200px] right-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/15 blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-200/20 to-purple-200/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-lg border border-white/50 shadow-sm mb-8">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-[13px] font-semibold text-gray-600">10 Bilimsel Test · AI Analiz · 5 Panel</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0f2847] leading-tight tracking-tight max-w-4xl mx-auto">
            Öğrencilerinizi{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Gerçekten Tanıyın</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Psikometrik testler ve yapay zekâ ile her öğrencinin benzersiz potansiyelini keşfedin.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all flex items-center gap-2 text-[15px]">
              Ücretsiz Başla <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/50 text-[#0f2847] font-bold shadow-sm hover:shadow-md hover:bg-white/80 transition-all text-[15px]">
              Demo İncele
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, value: '10', label: 'Bilimsel Test', color: 'text-emerald-600 bg-emerald-100' },
            { icon: Sparkles, value: 'AI', label: 'Analiz Raporu', color: 'text-violet-600 bg-violet-100' },
            { icon: Users, value: '5', label: 'Kullanıcı Paneli', color: 'text-sky-600 bg-sky-100' },
            { icon: FileText, value: '3', label: 'Entegre Rapor', color: 'text-amber-600 bg-amber-100' },
          ].map((s) => (
            <div key={s.label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm text-center">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-extrabold text-[#0f2847]">{s.value}</p>
              <p className="text-[13px] text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tests */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Testlerimiz</h2>
          <p className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">Bilimsel temelli 10 farklı psikometrik test ile kapsamlı öğrenci profili</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TESTS.map((t) => (
            <div key={t.name} className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 border-l-4 ${t.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg shrink-0`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#0f2847]">{t.name}</h3>
                    <span className="text-[12px] text-gray-400 font-semibold bg-gray-50 px-2.5 py-1 rounded-full shrink-0 ml-2">{t.count}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Nasıl Çalışır?</h2>
          <p className="mt-3 text-gray-500 text-lg">3 adımda profesyonel öğrenci analizi</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.num} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-7 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                <span className="text-xl font-extrabold text-white">{s.num}</span>
              </div>
              <h3 className="text-lg font-bold text-[#0f2847] mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2847]">Fiyatlandırma</h2>
          <p className="mt-3 text-gray-500 text-lg">Her okula uygun paketler · 14 gün ücretsiz deneme</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative bg-white/70 backdrop-blur-xl rounded-3xl border p-8 shadow-sm hover:shadow-lg transition-shadow ${p.popular ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-white/40'}`}>
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-bold shadow-lg">En Popüler</div>
              )}
              <h3 className="text-xl font-bold text-[#0f2847] mb-1">{p.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{p.students}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-[#0f2847]">₺{p.price}</span>
                <span className="text-sm text-gray-400 font-medium"> / yıl</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['10 bilimsel test', 'AI analiz raporu', "3'lü entegre rapor", 'PDF/Word export', '5 kullanıcı paneli'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`block w-full py-3 rounded-xl text-center text-sm font-bold transition-all ${p.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                14 Gün Ücretsiz Dene <ChevronRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[#0f2847]">Eğitim Check-Up</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/kvkk" className="hover:text-[#0f2847] transition-colors flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> KVKK</Link>
              <a href="mailto:info@egitimcheckup.com" className="hover:text-[#0f2847] transition-colors flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> info@egitimcheckup.com</a>
            </div>
            <p className="text-xs text-gray-400">© 2026 Eğitim Check-Up. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
