import Link from 'next/link';
import { AlertCircle, ArrowRight, BookOpen, Home } from 'lucide-react';

export const metadata = {
  title: 'Deneme Limiti — Eğitim Check-Up',
};

export default function TrialLimitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-8 sm:p-10 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center mb-5 shadow-lg shadow-amber-500/30">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0f2847] mb-3">
          Deneme Limitine Ulaştın
        </h1>

        <p className="text-base text-gray-600 leading-relaxed mb-2">
          Kısa bir süre içinde çok sayıda deneme testi yaptın.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          1 saat sonra tekrar deneyebilir, veya hemen detaylı analize geçebilirsin.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/paketler"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Paketleri İncele
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/60 border border-gray-200 text-gray-700 font-bold text-sm hover:bg-white transition-all"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
        </div>

        <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
          Bu limit, sistemin kötüye kullanımını önlemek içindir. Üye olduğunda sınırsız test yapabilirsin.
        </p>
      </div>
    </div>
  );
}
