'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Geri / İleri navigasyon butonları
 * - Tarayıcı history üzerinden çalışır (router.back / router.forward)
 * - Dashboard sayfalarında gizlenir (panel içinde gezinme için)
 */
export default function NavButtons() {
  const router = useRouter();
  const pathname = usePathname();

  // Dashboard'larda gösterme (öğretmen + öğrenci)
  if (pathname === '/teacher/dashboard' || pathname === '/student/dashboard') return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => router.back()}
        aria-label="Bir sayfa geri"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-[12px] font-semibold text-[#0f2847] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Geri</span>
      </button>
      <button
        onClick={() => router.forward()}
        aria-label="Bir sayfa ileri"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-[12px] font-semibold text-[#0f2847] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <span>İleri</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
