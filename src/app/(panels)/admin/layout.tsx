'use client';
import PanelLayout from '@/components/PanelLayout';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Okullar', href: '/admin/schools', icon: 'schools' },
  { label: 'Lisanslar', href: '/admin/licenses', icon: 'licenses' },

  // ─── Onay Bekleyen ───
  { label: 'Onay Bekleyen Öğrenciler', href: '/admin/students/pending', icon: 'pending-students' },
  { label: 'Onay Bekleyen Öğretmenler', href: '/admin/teachers/pending', icon: 'pending-teachers' },
  { label: 'Onay Bekleyen Veliler', href: '/admin/parents/pending', icon: 'pending-parents' },

  // ─── Kayıtlı ───
  { label: 'Kayıtlı Öğrenciler', href: '/admin/students/registered', icon: 'students' },
  { label: 'Kayıtlı Öğretmenler', href: '/admin/teachers/registered', icon: 'teachers' },
  { label: 'Kayıtlı Veliler', href: '/admin/parents/registered', icon: 'parents' },

  // ─── Diğer ───
  { label: 'Şifre Sıfırlama', href: '/admin/password-resets', icon: 'password-resets' },
  { label: 'Tüm Kullanıcılar', href: '/admin/users', icon: 'users' },
  { label: 'Ayarlar', href: '/admin/settings', icon: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayout role="admin" navItems={navItems}>{children}</PanelLayout>;
}
