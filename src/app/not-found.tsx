import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-white px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[#0f2847]/10 select-none mb-2">404</div>
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-3">
          Sayfa Bulunamadı
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0f2847] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3a5c] transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[#0f2847] border border-[#e2e8f0] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
