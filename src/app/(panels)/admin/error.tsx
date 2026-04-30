'use client';

/**
 * Admin Error Boundary
 *
 * Admin altındaki herhangi bir sayfa server-side veya client-side bir hata
 * fırlatırsa, kullanıcıya 500 yerine bu kibarlı hata sayfası gösterilir.
 * Hata mesajı gizli kalır (production), kullanıcı "tekrar dene" diyebilir.
 */
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Production'da Vercel logs'a gider
    console.error('[admin/error-boundary]', error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-900/40 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-md">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-lg font-extrabold text-[#0f2847] dark:text-slate-100 mb-2">
          Sayfa yüklenirken bir hata oluştu
        </h2>
        <p className="text-[13px] text-gray-600 dark:text-slate-400 leading-relaxed mb-5">
          Sayfanın bir bölümü düzgün yüklenmedi. Bu geçici bir durum olabilir;
          yeniden deneyebilir veya başka bir sayfaya gidebilirsiniz.
        </p>
        {error.digest && (
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-4 font-mono">
            Hata kodu: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tekrar Dene
          </button>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-[13px] font-bold border border-gray-200 dark:border-slate-600 hover:bg-gray-200 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Kullanıcılara Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
