import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eğitim Check-Up | Psikometrik Test ve AI Analiz Platformu',
  description: '10 bilimsel psikometrik test, yapay zekâ destekli analiz raporları ve 5 farklı kullanıcı paneli ile öğrencilerinizi gerçekten tanıyın.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
