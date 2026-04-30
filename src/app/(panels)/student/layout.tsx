'use client';
import PanelLayout from '@/components/PanelLayout';
import NavButtons from '@/components/NavButtons';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: 'dashboard' },
  { label: 'Testlerim', href: '/student/my-tests', icon: 'my-tests' },
  { label: 'AI Koç', href: '/student/coach', icon: 'coach' },
  { label: 'Profilim', href: '/student/profile', icon: 'profile' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelLayout role="student" navItems={navItems}>
      <NavButtons />
      {children}
    </PanelLayout>
  );
}
