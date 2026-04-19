'use client';

import { Settings, Construction } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function Page() {
  return (
    <div>
      <PageHeader
        role="admin"
        icon={Settings}
        title="Platform Ayarları"
        subtitle="Sistem yapılandırma ve global ayarlar"
      />
      <EmptyState
        role="admin"
        icon={Construction}
        title="Bu sayfa yakında aktif olacak"
        subtitle="Platform ayarları paneli geliştirme aşamasında. Güncel ayarlar kısa sürede erişime açılacak."
      />
    </div>
  );
}
