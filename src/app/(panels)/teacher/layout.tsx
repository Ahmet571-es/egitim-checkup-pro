'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
  { label: 'Sınıflarım', href: '/teacher/my-classes', icon: 'my-classes' },
  { label: 'Test Ata', href: '/teacher/assign-test', icon: 'assign-test' },
  { label: 'Sonuçlar', href: '/teacher/results', icon: 'results' },
  { label: 'Raporlar', href: '/teacher/reports', icon: 'reports' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="teacher" navItems={navItems}>{children}</PanelLayout>;
}
