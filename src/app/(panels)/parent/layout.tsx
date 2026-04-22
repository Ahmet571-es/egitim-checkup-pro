'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: 'dashboard' },
  { label: 'Çocuklarım', href: '/parent/my-children', icon: 'my-children' },
  { label: 'Sonuçlar', href: '/parent/results', icon: 'results' },
  { label: 'Mesajlar', href: '/parent/messages', icon: 'messages' },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="parent" navItems={navItems}>{children}</PanelLayout>;
}
