'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="teacher"
      status="pending"
      title="Onay Bekleyen Öğretmenler"
      subtitle="Yeni kayıt yapan öğretmenler"
    />
  );
}
