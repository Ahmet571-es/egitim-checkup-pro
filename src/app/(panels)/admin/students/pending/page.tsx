'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="student"
      status="pending"
      title="Onay Bekleyen Öğrenciler"
      subtitle="Yeni kayıt yapan öğrenciler. Onayladıktan sonra öğretmen ataması yapın."
    />
  );
}
