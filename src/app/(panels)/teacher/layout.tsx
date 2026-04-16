'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
  { label: 'Test Ata', href: '/teacher/assign-test', icon: 'assign-test' },
  { label: 'Sonuçlar', href: '/teacher/results', icon: 'results' },
  { label: 'Raporlar', href: '/teacher/reports', icon: 'reports' },
  { label: 'AI Koçluk', href: '/teacher/coaching', icon: 'coaching' },
  { label: 'Rehberlik Planı', href: '/teacher/guidance-plan', icon: 'guidance-plan' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="teacher" navItems={navItems}>{children}</PanelLayout>;
}
