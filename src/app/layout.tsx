import type { Metadata } from 'next';
import './globals.css';
import OfflineBanner from '@/components/OfflineBanner';
import AccessibilityToggle from '@/components/ui/AccessibilityToggle';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'Eğitim Check-Up | Psikometrik Test ve AI Analiz Platformu',
  description: '10 bilimsel psikometrik test, yapay zekâ destekli analiz raporları ve 5 farklı kullanıcı paneli ile öğrencilerinizi gerçekten tanıyın.',
  metadataBase: new URL('https://egitim-checkup-pro.vercel.app'),
  openGraph: {
    title: 'Eğitim Check-Up | Psikometrik Test ve AI Analiz Platformu',
    description: '10 bilimsel psikometrik test, yapay zekâ destekli analiz raporları ve 5 farklı kullanıcı paneli ile öğrencilerinizi gerçekten tanıyın.',
    url: 'https://egitim-checkup-pro.vercel.app',
    siteName: 'Eğitim Check-Up',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eğitim Check-Up | Psikometrik Test ve AI Analiz Platformu',
    description: '10 bilimsel psikometrik test, yapay zekâ destekli analiz raporları ve 5 farklı kullanıcı paneli ile öğrencilerinizi gerçekten tanıyın.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <OfflineBanner />
        {children}
        <AccessibilityToggle />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
