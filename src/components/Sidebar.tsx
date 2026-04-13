'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LogOut, LayoutDashboard, School, Key, Users, Settings,
  BookOpen, GraduationCap, UserCheck, Heart, ClipboardList, FileText,
  BarChart3, User, Baby, ChevronRight, CreditCard, Radar, Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { NavItem, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, schools: School, licenses: Key, users: Users,
  settings: Settings, classes: BookOpen, teachers: GraduationCap,
  students: UserCheck, parents: Heart, 'my-classes': BookOpen,
  'assign-test': ClipboardList, results: BarChart3, reports: FileText,
  'my-tests': ClipboardList, 'my-results': BarChart3, profile: User,
  'profile-360': Radar, 'my-children': Baby, billing: CreditCard,
  coaching: Sparkles,
};

const ACCENT: Record<UserRole, { gradient: string; activeBg: string; text: string; border: string }> = {
  admin:        { gradient: 'from-amber-500 to-orange-500',   activeBg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-500' },
  school_admin: { gradient: 'from-sky-500 to-blue-500',       activeBg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-500' },
  teacher:      { gradient: 'from-emerald-500 to-teal-500',   activeBg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500' },
  student:      { gradient: 'from-violet-500 to-purple-500',  activeBg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-500' },
  parent:       { gradient: 'from-pink-500 to-rose-500',      activeBg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-500' },
};

interface SidebarProps {
  role: UserRole;
  navItems: NavItem[];
  userName?: string;
}

/** Madde 10: Premium Sidebar with animated active state, hover translate, online indicator */
export default function Sidebar({ role, navItems, userName = 'Kullanıcı' }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const accent = ACCENT[role];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const nav = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center shadow-lg`}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold text-[#0f2847] tracking-tight">Eğitim Check-Up</h1>
            <p className="text-[11px] text-gray-400 font-medium">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const iconKey = item.href.split('/').pop() || 'dashboard';
          const Icon = ICON_MAP[iconKey] || LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? `${accent.activeBg} ${accent.text}`
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:translate-x-1'
              }`}
            >
              {/* Animated left border for active item */}
              <div className={`absolute left-0 top-0 w-[3px] rounded-r-full transition-all duration-300 ${
                isActive ? `h-full ${accent.border.replace('border-', 'bg-')}` : 'h-0 bg-transparent'
              }`} />

              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* User with online indicator */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white text-xs font-bold`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator dot with pulse */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-700 truncate">{userName}</p>
            <p className="text-[11px] text-gray-400">{ROLE_LABELS[role]}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/80 backdrop-blur-lg shadow-lg border border-gray-200/50 active:scale-95 transition-transform"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Madde 10: Mobile overlay with backdrop blur + slide-in */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
               style={{ animation: 'backdrop-enter 0.2s ease-out forwards' }} />
          {/* Drawer */}
          <div className="relative w-[280px] h-full bg-white shadow-2xl"
               onClick={(e) => e.stopPropagation()}
               style={{ animation: 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationName: 'none' }}>
            <div style={{ animation: 'modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} className="h-full">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 z-10">
                <X className="w-5 h-5 text-gray-500" />
              </button>
              {nav}
            </div>
          </div>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden lg:block w-[260px] h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shrink-0">
        {nav}
      </aside>
    </>
  );
}
