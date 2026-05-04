'use client';
import UserListView from '@/components/admin/UserListView';
export default function Page() {
  return (
    <UserListView
      role="parent"
      status="pending"
      title="Onay Bekleyen Veliler"
      subtitle="Yeni kayıt yapan veliler"
    />
  );
}
