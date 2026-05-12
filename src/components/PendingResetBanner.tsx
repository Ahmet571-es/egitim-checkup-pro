'use client';

/**
 * PendingResetBanner — Admin / School yöneticisi dashboard'unda gösterilir.
 *
 * /api/admin/password-resets?action=count endpoint'inden bekleyen şifre
 * sıfırlama talebi sayısını alır; >0 ise üstte bir uyarı banner'ı çıkarır.
 *
 * - Her 30 saniyede bir polling yapar (sayfa açık kaldıkça).
 * - Tıklayınca /admin/password-resets sayfasına gider.
 * - Auth fail / network fail durumunda sessizce gizlenir (banner çıkmaz).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

type Role = 'admin' | 'school_admin';

const HREF_BY_ROLE: Record<Role, string> = {
  admin: '/admin/password-resets',
  school_admin: '/school/password-resets',
};

export default function PendingResetBanner({ role }: { role: Role }) {
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/password-resets?action=count', {
          cache: 'no-store',
        });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setCount(Number(data.pending_count) || 0);
        }
      } catch {
        // sessiz
      } finally {
        if (alive) setLoaded(true);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000); // 30 sn polling

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (!loaded || count === 0) return null;

  const href = HREF_BY_ROLE[role];

  return (
    <Link
      href={href}
      className="group block mb-6 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
      aria-label={`${count} bekleyen şifre sıfırlama talebi var, sayfaya git`}
    >
      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        {/* Sol ikon */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
            <KeyRound className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          {/* Pulse */}
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white text-[11px] font-extrabold shadow-md ring-2 ring-white dark:ring-slate-900">
            {count > 99 ? '99+' : count}
            <span className="absolute inset-0 rounded-full bg-rose-500 opacity-60 animate-ping" />
          </span>
        </div>

        {/* Metin */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] sm:text-[12px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
              Bekleyen İşlem
            </p>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            {count === 1
              ? '1 yeni şifre sıfırlama talebi var'
              : `${count} yeni şifre sıfırlama talebi var`}
          </h3>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5">
            Talepleri görüntülemek ve yeni şifre belirlemek için tıklayın.
          </p>
        </div>

        {/* Sağ ok */}
        <div className="shrink-0 hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-slate-800/70 border border-amber-200 dark:border-amber-800/60 group-hover:translate-x-1 transition-transform">
          <ArrowRight className="w-5 h-5 text-amber-700 dark:text-amber-300" />
        </div>
      </div>
    </Link>
  );
}
