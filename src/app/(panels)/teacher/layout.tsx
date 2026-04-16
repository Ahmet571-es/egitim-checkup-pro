'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
  { label: 'Öğrencilerim', href: '/teacher/students', icon: 'students' },
  { label: 'AI Koçluk', href: '/teacher/coaching', icon: 'coaching' },
  { label: 'Rehberlik Planı', href: '/teacher/guidance-plan', icon: 'guidance-plan' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="teacher" navItems={navItems}>{children}</PanelLayout>;
}
