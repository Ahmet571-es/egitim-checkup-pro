'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, LogOut, LayoutDashboard, School, Key, KeyRound, Users, Settings,
  BookOpen, GraduationCap, UserCheck, Heart, ClipboardList, FileText,
  BarChart3, User, Baby, ChevronRight, CreditCard, Radar, Sparkles, Trophy,
  Palette, MessageSquare, Shield, UserPlus, Hourglass,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { NavItem, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { ThemeToggle } from '@/components/ui/Theme';

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, schools: School, licenses: Key, users: Users,
  settings: Settings, classes: BookOpen, teachers: GraduationCap,
  students: UserCheck, parents: Heart, 'my-classes': BookOpen,
  'assign-test': ClipboardList, results: BarChart3, reports: FileText,
  'my-tests': ClipboardList, 'my-results': BarChart3, profile: User,
  'profile-360': Radar, 'my-children': Baby, billing: CreditCard,
  coaching: Sparkles,
  coach: Sparkles,
  shield: Shield,
  achievements: Trophy,
  branding: Palette,
  'guidance-plan': FileText,
  messages: MessageSquare,
  'password-resets': KeyRound,
  'pending-students': Hourglass,
  'pending-teachers': Hourglass,
  'pending-parents': Hourglass,
};

const ACCENT: Record<UserRole, {
  gradient: string;
  activeGrad: string;
  activeText: string;
  dot: string;
  glow: string;
}> = {
  admin: {
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    activeGrad: 'from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30',
    activeText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-400/50',
  },
  school_admin: {
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    activeGrad: 'from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/30',
    activeText: 'text-blue-700 dark:text-sky-300',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-400/50',
  },
  teacher: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    activeGrad: 'from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/30',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-400/50',
  },
  student: {
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    activeGrad: 'from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/30',
    activeText: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    glow: 'shadow-violet-400/50',
  },
  parent: {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    activeGrad: 'from-pink-50 via-rose-50 to-red-50 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-red-950/30',
    activeText: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    glow: 'shadow-rose-400/50',
  },
};

interface SidebarProps {
  role: UserRole;
  navItems: NavItem[];
  userName?: string;
}

/** Premium Sidebar — glass bg, gradient active state, avatar with online pulse */
export default function Sidebar({ role, navItems, userName = 'Kullanıcı' }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingResetCount, setPendingResetCount] = useState(0);
  const pathname = usePathname();

  // Bekleyen şifre sıfırlama talebi sayısı — sadece admin/school_admin rollerinde.
  // 30 sn'de bir polling + pathname değişiminde refresh.
  useEffect(() => {
    if (role !== 'admin' && role !== 'school_admin') return;

    let alive = true;

    const fetchPending = async () => {
      try {
        const res = await fetch('/api/admin/password-resets?action=count', {
          cache: 'no-store',
        });
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setPendingResetCount(Number(data.pending_count) || 0);
        }
      } catch {
        // sessiz
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30_000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [role, pathname]);

  // Okunmamış mesaj sayısını çek — sadece parent/teacher rollerinde anlamlı.
  // Realtime subscription + pathname değişimiyle refresh.
  useEffect(() => {
    if (role !== 'parent' && role !== 'teacher') return;

    let active = true;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(Number(data.count) || 0);
        }
      } catch {
        // sessiz
      }
    };

    fetchUnread();

    // Realtime: parent_teacher_notes INSERT/UPDATE → count değişebilir
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const filterCol = role === 'parent' ? 'parent_id' : 'teacher_id';
      channel = supabase
        .channel(`sidebar-unread:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT (yeni mesaj) VE UPDATE (is_read=true)
            schema: 'public',
            table: 'parent_teacher_notes',
            filter: `${filterCol}=eq.${user.id}`,
          },
          () => {
            fetchUnread();
          },
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [role, pathname]); // pathname değişince de refresh (mesajlar sayfasına girince okunmuş sayılır)
  const accent = ACCENT[role];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const nav = (
    <div className="flex flex-col h-full relative">
      {/* Top gradient strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accent.gradient}`} />
      {/* Subtle bg blob */}
      <div className={`pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br ${accent.gradient} opacity-[0.06] blur-2xl`} />

      {/* Logo */}
      <div className="relative px-5 py-6 border-b border-gray-100/80 dark:border-slate-700/60">
        <div className="flex items-center gap-3 mb-3">
          <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center shadow-lg ${accent.glow}`}>
            <GraduationCap className="w-6 h-6 text-white relative z-10" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent" />
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accent.gradient} opacity-70 blur-lg -z-10`} />
          </div>
          <div>
            <h1 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Eğitim Check-Up</h1>
            <p className="text-[10.5px] text-gray-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">{ROLE_LABELS[role]}</p>
          </div>
        </div>

        {/* Cmd+K hint button */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
            window.dispatchEvent(event);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700/60 hover:shadow-sm border border-gray-100 dark:border-slate-700/60 hover:border-gray-200 dark:hover:border-slate-600 text-gray-500 dark:text-slate-400 text-[12px] font-semibold transition-all group"
          aria-label="Hızlı arama (Cmd+K)"
        >
          <Menu className="w-3.5 h-3.5 opacity-60" />
          <span className="flex-1 text-left">Hızlı ara...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-[9.5px] font-bold font-mono shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const iconKey = item.href.split('/').pop() || 'dashboard';
          const Icon = ICON_MAP[iconKey] || LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`nav-link group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-r ${accent.activeGrad} ${accent.activeText} shadow-sm`
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 hover:text-gray-800 dark:hover:text-slate-200 hover:translate-x-1'
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full transition-all duration-300 ${
                isActive ? `bg-gradient-to-b ${accent.gradient} opacity-100` : 'opacity-0'
              }`} />

              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                isActive
                  ? `bg-gradient-to-br ${accent.gradient} text-white shadow-md ${accent.glow}`
                  : 'bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm'
              }`}>
                <Icon className="w-[15px] h-[15px]" />
              </div>

              <span className="flex-1 truncate">{item.label}</span>
              {unreadCount > 0 &&
                ((role === 'parent' && iconKey === 'messages') ||
                 (role === 'teacher' && iconKey === 'dashboard')) && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-extrabold shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {pendingResetCount > 0 &&
                (role === 'admin' || role === 'school_admin') &&
                iconKey === 'password-resets' && (
                <span className="relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-extrabold shadow-sm">
                  {pendingResetCount > 99 ? '99+' : pendingResetCount}
                  <span className="absolute inset-0 rounded-full bg-rose-400 opacity-60 animate-ping" />
                </span>
              )}
              {isActive && <ChevronRight className={`w-3.5 h-3.5 ${accent.activeText} opacity-70`} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="relative px-4 py-4 border-t border-gray-100/80 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-br from-gray-50/80 to-white/60 dark:from-slate-800/60 dark:to-slate-800/40 border border-gray-100/60 dark:border-slate-700/50">
          <div className="relative shrink-0">
            <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center text-white text-sm font-bold shadow-md ${accent.glow}`}>
              {userName.charAt(0).toUpperCase()}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
              <div className={`relative w-2.5 h-2.5 rounded-full ${accent.dot}`}>
                <div className={`absolute inset-0 rounded-full ${accent.dot} animate-ping opacity-75`} />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-800 dark:text-slate-100 truncate">{userName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className={`w-1 h-1 rounded-full ${accent.dot}`} />
              <p className="text-[10.5px] text-gray-500 dark:text-slate-400 font-medium">Çevrimiçi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="shrink-0" />
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[13px] font-bold transition-colors border border-red-100/60 dark:border-red-900/40 hover:border-red-200 dark:hover:border-red-800/60 active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Güvenli Çıkış
          </button>
        </div>
      </div>

      <style jsx>{`
        .nav-link {
          animation: nav-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        @keyframes nav-enter {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-lg border border-gray-200/60 dark:border-slate-700/60 active:scale-95 transition-transform"
        aria-label="Menüyü Aç"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-slate-300" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm mobile-backdrop" />
          <div
            className="relative w-[280px] h-full bg-white dark:bg-slate-900 shadow-2xl mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 z-10">
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
            {nav}
          </div>
          <style jsx>{`
            .mobile-backdrop {
              animation: fadeIn 0.2s ease-out forwards;
            }
            .mobile-drawer {
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden lg:block w-[270px] h-screen sticky top-0 bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-gray-200/60 dark:border-slate-700/60 shrink-0 shadow-[1px_0_20px_rgba(15,40,71,0.04)] dark:shadow-[1px_0_20px_rgba(0,0,0,0.3)]">
        {nav}
      </aside>
    </>
  );
}
