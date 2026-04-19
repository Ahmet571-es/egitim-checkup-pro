import Sidebar from '@/components/Sidebar';
import PanelBackground from '@/components/ui/PanelBackground';
import type { NavItem, UserRole } from '@/types';

interface PanelLayoutProps {
  role: UserRole;
  navItems: NavItem[];
  children: React.ReactNode;
  userName?: string;
}

/** Premium Panel layout — ambient aurora bg + sidebar + content */
export default function PanelLayout({ role, navItems, children, userName }: PanelLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      <PanelBackground role={role} />
      <Sidebar role={role} navItems={navItems} userName={userName} />
      <main className="flex-1 min-w-0 px-4 py-6 lg:px-8 lg:py-8 page-enter relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
