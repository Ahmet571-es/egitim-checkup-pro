'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner — navigator.onLine dinleyicisi
 *
 * Durumlar:
 * - offline: kırmızı banner sürekli görünür
 * - online (geçiş sonrası): yeşil banner 3sn gösterilir
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    setIsOnline(window.navigator.onLine);

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  if (!mounted) return null;

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[100] bg-red-500/95 backdrop-blur-xl border-b border-red-600/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5">
          <WifiOff className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          <p className="text-white text-sm font-semibold">
            İnternet bağlantısı yok. Değişiklikleriniz kaydedilemeyebilir.
          </p>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500/95 backdrop-blur-xl border-b border-emerald-600/50 shadow-lg offline-banner-fade"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2.5">
          <Wifi className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
          <p className="text-white text-sm font-semibold">
            Bağlantı yeniden kuruldu.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
