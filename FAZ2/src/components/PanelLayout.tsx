import Sidebar from '@/components/Sidebar';
import type { NavItem, UserRole } from '@/types';

interface PanelLayoutProps {
  role: UserRole;
  navItems: NavItem[];
  children: React.ReactNode;
  userName?: string;
}

export default function PanelLayout({ role, navItems, children, userName }: PanelLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      <Sidebar role={role} navItems={navItems} userName={userName} />
      <main className="flex-1 min-w-0 px-4 py-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
