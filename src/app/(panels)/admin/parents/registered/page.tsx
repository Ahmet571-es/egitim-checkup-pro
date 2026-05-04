'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="parent"
      status="approved"
      title="Kayıtlı Veliler"
      subtitle="Onaylanmış ve sisteme aktif veliler"
    />
  );
}
