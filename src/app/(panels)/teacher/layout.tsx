'use client';
import PanelLayout from '@/components/PanelLayout';
import NavButtons from '@/components/NavButtons';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
  { label: 'Öğrencilerim', href: '/teacher/students', icon: 'students' },
  { label: 'Testlerim', href: '/teacher/my-tests', icon: 'my-tests' },
  { label: 'AI Koç', href: '/teacher/coach', icon: 'coach' },
  { label: 'Profilim', href: '/teacher/profile', icon: 'profile' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout role="teacher" navItems={navItems}>
      <NavButtons />
      {children}
    </PanelLayout>
  );
}
