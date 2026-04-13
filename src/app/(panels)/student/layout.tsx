'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: 'dashboard' },
  { label: 'Testlerim', href: '/student/my-tests', icon: 'my-tests' },
  { label: 'Sonuçlarım', href: '/student/my-results', icon: 'my-results' },
  { label: '360° Profil', href: '/student/profile-360', icon: 'profile-360' },
  { label: 'Profilim', href: '/student/profile', icon: 'profile' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="student" navItems={navItems}>{children}</PanelLayout>;
}
