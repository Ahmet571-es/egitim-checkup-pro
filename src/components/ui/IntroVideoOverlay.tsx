'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * IntroVideoOverlay
 * ─────────────────
 * Her panele girişte bir kez fullscreen karşılama videosu oynatır.
 * Davranış: oturum başına bir kez (sessionStorage). Logout sonrası
 * yeni login'de tekrar oynar. Sayfa refresh / panel-içi navigasyon
 * sırasında oynamaz.
 *
 * Özellikler:
 * - Ses kapalı (autoPlay için zorunlu, aynı zamanda Mehmet'in isteği)
 * - "Atla" butonu sağ üst köşe (kullanıcı acelesi varsa)
 * - Video bittiğinde otomatik kapanır
 * - prefers-reduced-motion → hiç gösterilmez
 * - Mobil uyumlu (object-cover + center)
 *
 * Kullanım:
 * <IntroVideoOverlay
 *   src="/videos/teacher-intro.mp4"
 *   poster="/videos/teacher-intro-poster.jpg"
 *   storageKey="ecup_intro_seen_teacher"
 * />
 */

interface IntroVideoOverlayProps {
  src: string;
  poster: string;
  storageKey: string;
}

export default function IntroVideoOverlay({
  src,
  poster,
  storageKey,
}: IntroVideoOverlayProps) {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reduced motion check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Bu oturumda gösterildi mi?
    const seen = sessionStorage.getItem(storageKey);
    if (seen === '1') return;

    // İlk gösterim — flag set et
    sessionStorage.setItem(storageKey, '1');
    setShow(true);
  }, [storageKey]);

  // Body scroll lock — video oynarken arka planda kayma olmasın
  useEffect(() => {
    if (!show) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [show]);

  const handleClose = () => {
    setExiting(true);
    // 400ms fade-out animasyonu sonrası DOM'dan kaldır
    setTimeout(() => setShow(false), 400);
  };

  // Klavye: Escape ile atla
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-[400ms] ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="Karşılama videosu"
    >
      {/* Video — fullscreen, object-cover */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        onEnded={handleClose}
        className="w-full h-full object-cover sm:object-contain"
      />

      {/* Atla butonu — sağ üst */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-sm font-bold transition-all active:scale-[0.96] shadow-lg"
        aria-label="Videoyu atla"
      >
        <span>Atla</span>
        <X className="w-4 h-4" />
      </button>

      {/* İlerleme çubuğu — alt */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-white/70 origin-left intro-progress-bar"
          style={{
            animation: `intro-progress ${
              videoRef.current?.duration ? videoRef.current.duration : 15
            }s linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes intro-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
