'use client';
import PanelLayout from '@/components/PanelLayout';
import NavButtons from '@/components/NavButtons';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
  { label: 'Öğrencilerim', href: '/teacher/students', icon: 'students' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout role="teacher" navItems={navItems}>
      <NavButtons />
      {children}
    </PanelLayout>
  );
}
