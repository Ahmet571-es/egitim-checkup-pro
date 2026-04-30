'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/school/dashboard', icon: 'dashboard' },
  { label: 'Sınıflar', href: '/school/classes', icon: 'classes' },
  { label: 'Öğretmenler', href: '/school/teachers', icon: 'teachers' },
  { label: 'Öğrenciler', href: '/school/students', icon: 'students' },
  { label: 'Veliler', href: '/school/parents', icon: 'parents' },
  { label: 'Genetik Raporlar', href: '/school/genetic-reports', icon: 'shield' },
  { label: 'Markalaşma', href: '/school/branding', icon: 'branding' },
  { label: 'Faturalandırma', href: '/school/billing', icon: 'billing' },
];

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="school_admin" navItems={navItems}>{children}</PanelLayout>;
}
