'use client';

import dynamic from 'next/dynamic';

const QRCodeGenerator = dynamic(() => import('@/components/teacher/QRCodeGenerator'), {
  ssr: false,
});

export default function QRCodeSection() {
  return <QRCodeGenerator />;
}
