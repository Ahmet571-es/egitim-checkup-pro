'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="teacher"
      status="approved"
      title="Kayıtlı Öğretmenler"
      subtitle="Onaylanmış ve sisteme aktif öğretmenler"
    />
  );
}
