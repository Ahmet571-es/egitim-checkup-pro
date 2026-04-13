'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Okullar', href: '/admin/schools', icon: 'schools' },
  { label: 'Lisanslar', href: '/admin/licenses', icon: 'licenses' },
  { label: 'Kullanıcılar', href: '/admin/users', icon: 'users' },
  { label: 'Ayarlar', href: '/admin/settings', icon: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="admin" navItems={navItems}>{children}</PanelLayout>;
}
