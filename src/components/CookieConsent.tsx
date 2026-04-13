'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Daha önce kabul ettiyse gösterme
    try {
      if (localStorage.getItem(COOKIE_KEY) === 'accepted') return;
    } catch {
      // localStorage erişilemezse göster
    }
    // 1sn gecikmeyle göster (UX için)
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'accepted');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 text-sm text-gray-600 leading-relaxed">
          Bu site, deneyiminizi iyileştirmek için çerezler kullanmaktadır.
          Siteyi kullanmaya devam ederek{' '}
          <Link href="/kvkk" className="text-emerald-600 font-semibold hover:underline">
            KVKK ve Gizlilik Politikamızı
          </Link>{' '}
          kabul etmiş olursunuz.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            Kabul Et
          </button>
          <button
            onClick={() => setVisible(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
