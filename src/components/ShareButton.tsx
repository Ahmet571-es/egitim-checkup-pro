'use client';

/**
 * ShareButton: Test sonucunu paylaşmak için reusable component.
 * - Native: Web Share API (mobile'da OS sheet açar)
 * - Fallback: Clipboard'a kopyala + 2sn "Kopyalandı" toast
 *
 * Kullanım:
 *   <ShareButton
 *     title="VARK Sonucum"
 *     text="Baskın stilim: Görsel öğrenici 👁️"
 *     trialPath="/trial/vark"
 *     accentClass="from-amber-500 to-orange-600"
 *   />
 */

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  trialPath: string;
  accentClass?: string; // tailwind gradient classes (örn. 'from-amber-500 to-orange-600')
}

export function ShareButton({
  title,
  text,
  trialPath,
  accentClass = 'from-amber-500 to-orange-600',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    setBusy(true);

    const url = typeof window !== 'undefined' ? `${window.location.origin}${trialPath}` : trialPath;
    const fullMessage = `${text}\n\nSen de dene → ${url}`;

    // 1) Native Web Share API (mobile'da öncelik)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text, url });
        setBusy(false);
        return;
      } catch (err) {
        // User canceled — sessizce devam et
        if ((err as Error)?.name === 'AbortError') {
          setBusy(false);
          return;
        }
        // Diğer hatalarda fallback'e geç
      }
    }

    // 2) Fallback: Clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullMessage);
      } else {
        // Çok eski tarayıcı — manuel
        const ta = document.createElement('textarea');
        ta.value = fullMessage;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Share fallback failed', err);
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label="Sonucu paylaş"
      className={`relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${accentClass} text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait min-h-[44px]`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Kopyalandı!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Sonucu Paylaş
        </>
      )}
    </button>
  );
}
