'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="student"
      status="approved"
      title="Kayıtlı Öğrenciler"
      subtitle="Onaylanmış ve sisteme aktif öğrenciler"
    />
  );
}
