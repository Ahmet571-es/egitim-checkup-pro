'use client';

import { Users, Construction } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function Page() {
  return (
    <div>
      <PageHeader
        role="admin"
        icon={Users}
        title="Kullanıcılar"
        subtitle="Platformdaki tüm kullanıcıları görüntüleyin ve yönetin"
      />
      <EmptyState
        role="admin"
        icon={Construction}
        title="Bu sayfa yakında aktif olacak"
        subtitle="Kullanıcı yönetim paneli geliştirme aşamasında. Şimdilik kullanıcıları okul yöneticileri üzerinden yönetebilirsiniz."
      />
    </div>
  );
}
